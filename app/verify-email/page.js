"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, sendEmailVerification } from "@/firebase";
import { useAuth } from "@/components/AuthContext";
import Link from "next/link";

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();

  // Handle page unload/refresh to preserve state
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Save current state to localStorage if needed
      if (user) {
        localStorage.setItem('verificationInProgress', 'true');
      }
    };

    const handlePageShow = () => {
      // Check if user returned to the page
      const wasInProgress = localStorage.getItem('verificationInProgress');
      if (wasInProgress && user) {
        // User returned, check verification status
        handleRefresh();
        localStorage.removeItem('verificationInProgress');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/signup");
        return;
      }
      
      // If user is already verified and has a role, redirect to dashboard
      if (user.emailVerified && userData?.role) {
        if (userData.role === "admin") {
          router.push("/admin/dashboard");
        } else if (userData.role === "teacher") {
          router.push("/teacher/dashboard");
        } else if (userData.role === "student") {
          router.push("/student/dashboard");
        } else {
          router.push("/welcome");
        }
      } else if (user.emailVerified && userData && !userData.role) {
        // User is verified and has userData but doesn't have a role yet, go to role selection
        router.push("/signup/role");
      }
      // If user is verified but no userData exists yet, stay on verification page
      // This happens for Google signups where email is verified but user document doesn't exist
    }
  }, [user, userData, authLoading, router]);

  const handleResendVerification = async () => {
    setResendLoading(true);
    setError(null);
    
    console.log("Resending email verification to:", user.email);
    try {
      await sendEmailVerification(user);
      console.log("Resend verification email sent successfully");
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (error) {
      console.error("Error sending verification email:", error);
      console.error("Resend error code:", error.code);
      console.error("Resend error message:", error.message);
      
      // Provide more specific error messages
      if (error.code === "auth/too-many-requests") {
        setError("Too many verification emails sent. Please wait a few minutes before trying again.");
      } else if (error.code === "auth/user-not-found") {
        setError("User not found. Please try signing up again.");
      } else {
        setError("Failed to send verification email. Please try again.");
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    
    // Reload the user to check verification status
    user.reload().then(() => {
      if (user.emailVerified) {
        // User is now verified, redirect to role selection or dashboard
        if (userData?.role) {
          if (userData.role === "admin") {
            router.push("/admin/dashboard");
          } else if (userData.role === "teacher") {
            router.push("/teacher/dashboard");
          } else if (userData.role === "student") {
            router.push("/student/dashboard");
          } else {
            router.push("/welcome");
          }
        } else if (userData && !userData.role) {
          // User has userData but no role, go to role selection
          router.push("/signup/role");
        } else {
          // User is verified but no userData exists yet, stay on verification page
          // This happens for Google signups where email is verified but user document doesn't exist
          setError("Email verified! Please wait while we set up your account...");
        }
      } else {
        setError("Email not verified yet. Please check your inbox and click the verification link. If the link doesn't work, try resending the verification email.");
      }
      setLoading(false);
    }).catch((error) => {
      console.error("Error reloading user:", error);
      setError("Failed to check verification status. Please try again.");
      setLoading(false);
    });
  };

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

  if (!user) {
    return null; // Will redirect to signup
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-2">Verify Your Email</h1>
          <p className="text-muted-foreground mb-6">
            We've sent a verification email to <strong>{user.email}</strong>
          </p>
          
          <div className="space-y-4 mb-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2">What to do next:</h3>
              <ol className="text-sm text-muted-foreground space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                  <span>Check your email inbox (and spam folder)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                  <span>Click the verification link in the email</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                  <span>Return here and click "I've Verified My Email"</span>
                </li>
              </ol>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {resendSuccess && (
            <div className="bg-success/10 border border-success/20 text-success p-4 rounded-lg mb-6">
              Verification email sent successfully!
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Checking...
                </>
              ) : (
                "I've Verified My Email"
              )}
            </button>
            
            <button
              onClick={handleResendVerification}
              disabled={resendLoading}
              className="btn-outline w-full"
            >
              {resendLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Sending...
                </>
              ) : (
                "Resend Verification Email"
              )}
            </button>
            
            <Link
              href="/login"
              className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 