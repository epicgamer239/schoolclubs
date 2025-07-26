"use client";
import { useState } from "react";
import { auth, sendEmailVerification } from "@/firebase";
import { useAuth } from "./AuthContext";

export default function EmailVerificationBanner() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { user } = useAuth();

  if (!user || user.emailVerified) {
    return null;
  }

  const handleResendVerification = async () => {
    setSending(true);
    console.log("Banner: Resending email verification to:", user.email);
    try {
      await sendEmailVerification(user);
      console.log("Banner: Resend verification email sent successfully");
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (error) {
      console.error("Banner: Error sending verification email:", error);
      console.error("Banner: Error code:", error.code);
      console.error("Banner: Error message:", error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-warning/10 border border-warning/20 text-warning-foreground p-4 rounded-lg mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="font-medium">Please verify your email address</p>
            <p className="text-sm opacity-90">
              We sent a verification email to <strong>{user.email}</strong>
            </p>
          </div>
        </div>
        <button
          onClick={handleResendVerification}
          disabled={sending}
          className="btn-outline text-sm"
        >
          {sending ? "Sending..." : sent ? "Sent!" : "Resend"}
        </button>
      </div>
    </div>
  );
} 