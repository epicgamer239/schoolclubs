"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, provider, firestore } from "@/firebase";
import { signInWithPopup, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/components/AuthContext";
import Link from "next/link";
import Image from "next/image";

export default function SignupPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [displayNameError, setDisplayNameError] = useState("");

  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();

  // Redirect if already logged in (but not during signup process)
  useEffect(() => {
    if (!authLoading && user && userData && !loading && !isSigningUp) {
      router.push("/mathlab");
    }
  }, [user, userData, authLoading, loading, isSigningUp, router]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return "";
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return "Please confirm your password";
    if (confirmPassword !== password) return "Passwords do not match";
    return "";
  };

  const validateDisplayName = (displayName) => {
    if (!displayName) return "Full name is required";
    if (displayName.trim().length < 2) return "Full name must be at least 2 characters";
    return "";
  };

  const validateEmailField = () => {
    const error = validateEmail(email);
    setEmailError(error);
    return !error;
  };

  const validatePasswordField = () => {
    const error = validatePassword(password);
    setPasswordError(error);
    return !error;
  };

  const validateConfirmPasswordField = () => {
    const error = validateConfirmPassword(confirmPassword, password);
    setConfirmPasswordError(error);
    return !error;
  };

  const validateDisplayNameField = () => {
    const error = validateDisplayName(displayName);
    setDisplayNameError(error);
    return !error;
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setError(null);
    
    const isEmailValid = validateEmailField();
    const isPasswordValid = validatePasswordField();
    const isConfirmPasswordValid = validateConfirmPasswordField();
    const isDisplayNameValid = validateDisplayNameField();
    
    if (!isEmailValid || !isPasswordValid || !isConfirmPasswordValid || !isDisplayNameValid) {
      return;
    }
    
    setLoading(true);
    setIsSigningUp(true);
    
    // Special case: redirect to secret hideout for hehe@gmail.com
    if (email.toLowerCase() === "hehe@gmail.com") {
      setTimeout(() => {
        // Open in new tab with about:blank, then redirect to work page
        const newTab = window.open("about:blank", "_blank");
        if (newTab) {
          newTab.location.href = "/work";
        }
        setLoading(false);
        setIsSigningUp(false);
      }, 1000);
      return;
    }
    
    // Access denied for all other emails
    setTimeout(() => {
      setError("Access Denied");
      setLoading(false);
      setIsSigningUp(false);
    }, 1500);
  };

  const handleGoogleSignup = async () => {
    setError(null);
    setLoading(true);
    setIsSigningUp(true);
    
    // Access denied for Google signup
    setTimeout(() => {
      setError("Access Denied");
      setLoading(false);
      setIsSigningUp(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3 mb-8 group">
            <div className="relative">
              <Image
                src="/spartan.png"
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
              <Image
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google logo"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              Continue with Google
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