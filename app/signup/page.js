"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, provider, firestore, createUserWithEmailAndPassword, sendEmailVerification } from "@/firebase";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { useAuth } from "@/components/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { validateEmail, validatePassword, getValidationError } from "@/utils/validation";

export default function SignupPage() {
  // Basic signup state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  
  // Validation errors
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [displayNameError, setDisplayNameError] = useState("");
  
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();

  // Clean up any existing temporary user data when component mounts
  useEffect(() => {
    localStorage.removeItem('tempUserData');
  }, []);

  // Handle page unload/refresh to preserve signup state
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Save current form state if user is in the middle of signup
      if (email || password || displayName) {
        const formState = {
          email,
          displayName,
          // Don't save password for security
        };
        localStorage.setItem('signupInProgress', JSON.stringify(formState));
      }
    };

    const handlePageShow = () => {
      // Restore form state if user returns to the page
      const savedState = localStorage.getItem('signupInProgress');
      if (savedState && !user) {
        try {
          const state = JSON.parse(savedState);
          setEmail(state.email || '');
          setDisplayName(state.displayName || '');
          // Don't restore password for security
          localStorage.removeItem('signupInProgress');
        } catch (error) {
          console.error('Error restoring signup state:', error);
          localStorage.removeItem('signupInProgress');
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [email, password, displayName, user]);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && userData) {
      if (userData.role === "admin") {
        router.push("/admin/dashboard");
      } else if (userData.role === "teacher") {
        router.push("/teacher/dashboard");
      } else if (userData.role === "student") {
        router.push("/student/dashboard");
      } else {
        router.push("/welcome");
      }
    }
  }, [user, userData, authLoading, router]);

  // Validation functions
  const validateEmailField = () => {
    const error = getValidationError('email', email);
    setEmailError(error || "");
    return !error;
  };

  const validatePasswordField = () => {
    const error = getValidationError('password', password);
    setPasswordError(error || "");
    return !error;
  };

  const validateConfirmPasswordField = () => {
    const error = getValidationError('confirmPassword', confirmPassword, { password });
    setConfirmPasswordError(error || "");
    return !error;
  };

  const validateDisplayNameField = () => {
    const error = getValidationError('displayName', displayName);
    setDisplayNameError(error || "");
    return !error;
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    
    // Validate all fields
    const isEmailValid = validateEmailField();
    const isPasswordValid = validatePasswordField();
    const isConfirmPasswordValid = validateConfirmPasswordField();
    const isDisplayNameValid = validateDisplayNameField();
    
    if (!isEmailValid || !isPasswordValid || !isConfirmPasswordValid || !isDisplayNameValid) {
      return;
    }

    setLoading(true);

    try {
      // Create user with email and password
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // Check if user already exists in our database
      const userRef = doc(firestore, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setError("You already have an account. Please sign in instead.");
        setLoading(false);
        return;
      }

      // Send email verification
      console.log("Sending email verification to:", user.email);
      try {
        await sendEmailVerification(user);
        console.log("Email verification sent successfully");
      } catch (verificationError) {
        console.error("Email verification error:", verificationError);
        console.error("Verification error code:", verificationError.code);
        console.error("Verification error message:", verificationError.message);
        // Continue with the flow even if verification fails
      }
      
      // Store temporary user data for role selection
      const tempUserData = {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        photoURL: "",
      };
      setTempUser(tempUserData);
      
      // Store in localStorage for role selection page
      localStorage.setItem('tempUserData', JSON.stringify(tempUserData));

      // Redirect to email verification page
      router.push("/verify-email");
    } catch (err) {
      console.error("Email signup error", err);
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Please sign in instead.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please choose a stronger password.");
      } else {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    setLoading(true);

    try {
      console.log("Starting Google signup...");
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Google signup successful:", user.email);
      
      const userRef = doc(firestore, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setError("You already have an account. Please sign in instead.");
        setLoading(false);
        return;
      }

      // Google users are already verified, so skip email verification
      console.log("Google user is already verified, skipping email verification");
      
      // Store temporary user data for role selection
      const tempUserData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
        photoURL: user.photoURL ? (user.photoURL.includes('lh3.googleusercontent.com') ? 
          user.photoURL.replace(/=s400-c$/, '=s400-c') : user.photoURL) : "",
      };
      setTempUser(tempUserData);
      
      // Store in localStorage for role selection page
      localStorage.setItem('tempUserData', JSON.stringify(tempUserData));

      // Redirect directly to role selection since Google users are already verified
      router.push("/signup/role");
    } catch (err) {
      console.error("Google signup error", err);
      console.error("Error code:", err.code);
      console.error("Error message:", err.message);
      
      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign in was cancelled. Please try again.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Pop-up was blocked. Please allow pop-ups for this site and try again.");
      } else if (err.code === "auth/internal-error") {
        setError("Google sign-in failed. Please try again or use email signup instead.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection and try again.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many sign-in attempts. Please wait a moment and try again.");
      } else {
        setError(`Sign-in failed: ${err.message}`);
      }
      setLoading(false);
    }
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show signup form if already authenticated
  if (user && userData) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3 mb-8 group">
            <div className="relative">
              <Image
                src="/logo.png"
                alt="StudyHub Logo"
                width={40}
                height={40}
                className="w-10 h-10 transition-transform duration-200 group-hover:scale-110"
              />
            </div>
            <span className="text-2xl font-bold text-foreground">
              StudyHub
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Create Account</h1>
          <p className="text-muted-foreground">Join StudyHub to get started</p>
        </div>

        <div className="card-elevated p-8">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div>
                <label htmlFor="displayName" className="block text-sm font-semibold mb-2 text-foreground">
                  Full Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  placeholder="Enter your full name"
                  className={`input ${displayNameError ? 'border-destructive' : ''}`}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onBlur={validateDisplayNameField}
                />
                {displayNameError && (
                  <p className="text-xs text-destructive mt-1">{displayNameError}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2 text-foreground">
                  Email Address
                </label>
                <input
                  id="email"
                  type="text"
                  placeholder="Enter your email address"
                  className={`input ${emailError ? 'border-destructive' : ''}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={validateEmailField}
                />
                {emailError && (
                  <p className="text-xs text-destructive mt-1">{emailError}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold mb-2 text-foreground">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  className={`input ${passwordError ? 'border-destructive' : ''}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={validatePasswordField}
                />
                {passwordError && (
                  <p className="text-xs text-destructive mt-1">{passwordError}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2 text-foreground">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  className={`input ${confirmPasswordError ? 'border-destructive' : ''}`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={validateConfirmPasswordField}
                />
                {confirmPasswordError && (
                  <p className="text-xs text-destructive mt-1">{confirmPasswordError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-base py-4"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  <>
                    Create Account
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-4 text-muted-foreground font-medium">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full btn-outline flex items-center justify-center gap-3 py-4 text-base"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                <>
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google logo"
                    className="w-6 h-6"
                  />
                  Continue with Google
                </>
              )}
            </button>
          </div>

          <div className="text-center mt-8">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors duration-200">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
