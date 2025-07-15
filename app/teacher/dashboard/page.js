"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/firebase";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../components/AuthContext";
import DashboardTopBar from "../../../components/DashboardTopBar";

export default function TeacherDashboard() {
  const [school, setSchool] = useState(null);
  const router = useRouter();
  const { userData, loading } = useAuth();

  useEffect(() => {
    const fetchSchoolData = async () => {
      if (!userData?.schoolId) return;

      const schoolDoc = await getDoc(doc(firestore, "schools", userData.schoolId));
      if (schoolDoc.exists()) {
        setSchool(schoolDoc.data());
      }
    };

    if (!loading && userData) {
      fetchSchoolData();
    }
  }, [userData, loading]);

  return (
    <ProtectedRoute requiredRole="teacher">
      <div className="min-h-screen bg-background text-foreground">
        <DashboardTopBar title="Teacher Dashboard" />
        
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage your clubs and review student requests</p>
          </div>

          {school ? (
            <>
              <div className="card p-6 max-w-md mb-8">
                <h2 className="text-lg font-semibold mb-4">School Information</h2>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-semibold text-muted-foreground">School:</span>
                    <p className="text-foreground font-medium">{school.name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-muted-foreground">Teacher Join Code:</span>
                    <div className="mt-2">
                      <code className="bg-muted px-3 py-2 rounded-lg text-sm font-mono border border-border">
                        {school.teacherJoinCode}
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <button
                    onClick={() => router.push("/teacher/clubs")}
                    className="card p-6 text-left hover:shadow-lg transition-all duration-200 group cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">My Clubs</h3>
                    <p className="text-sm text-muted-foreground">Manage your clubs and members</p>
                  </button>
                  
                  <button
                    onClick={() => router.push("/teacher/join-requests")}
                    className="card p-6 text-left hover:shadow-lg transition-all duration-200 group cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                      <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Join Requests</h3>
                    <p className="text-sm text-muted-foreground">Review student join requests</p>
                  </button>
                  
                  <button
                    onClick={() => router.push("/teacher/create-club")}
                    className="card p-6 text-left hover:shadow-lg transition-all duration-200 group cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Create Club</h3>
                    <p className="text-sm text-muted-foreground">Start a new club</p>
                  </button>

                  <button
                    onClick={() => router.push("/student/clubs")}
                    className="card p-6 text-left hover:shadow-lg transition-all duration-200 group cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-4 group-hover:bg-muted/80 transition-colors">
                      <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">View as Student</h3>
                    <p className="text-sm text-muted-foreground">See the student experience</p>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="card p-12 max-w-md text-center mx-auto">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-4">School Association Required</h2>
              <p className="text-muted-foreground mb-6">
                You need to be associated with a school to access the teacher dashboard.
              </p>
              <p className="text-sm text-muted-foreground">
                Please contact your school administrator to get your join code.
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
