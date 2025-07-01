"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";
import PendingApprovalScreen from "./PendingApprovalScreen";

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
        return;
      }

      if (requiredRole && userData?.role !== requiredRole) {
        // Redirect based on user role
        if (userData?.role === "admin") {
          router.push("/admin/dashboard");
        } else if (userData?.role === "teacher") {
          router.push("/teacher/dashboard");
        } else if (userData?.role === "student") {
          router.push("/student/dashboard");
        } else {
          router.push("/welcome");
        }
        return;
      }
    }
  }, [user, userData, loading, requiredRole, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  // Show pending approval screen if user doesn't have a schoolId
  if (userData && !userData.schoolId) {
    return <PendingApprovalScreen />;
  }

  if (requiredRole && userData?.role !== requiredRole) {
    return null; // Will redirect to appropriate dashboard
  }

  return children;
} 