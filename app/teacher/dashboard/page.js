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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted text-foreground p-6">
        <DashboardTopBar title="Teacher Dashboard" />
        
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">👨‍🏫 Teacher Dashboard</h1>

          {school ? (
            <>
              <div className="card p-6 max-w-md mb-8">
                <h2 className="text-lg font-semibold mb-4">🏫 School Information</h2>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => router.push("/teacher/clubs")}
                    className="card p-6 text-left hover:shadow-lg transition-all duration-200 group cursor-pointer"
                  >
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📚</div>
                    <h3 className="font-semibold text-foreground mb-2">My Clubs</h3>
                    <p className="text-sm text-muted-foreground">Manage your clubs and members</p>
                  </button>
                  
                  <button
                    onClick={() => router.push("/teacher/join-requests")}
                    className="card p-6 text-left hover:shadow-lg transition-all duration-200 group cursor-pointer"
                  >
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📝</div>
                    <h3 className="font-semibold text-foreground mb-2">Join Requests</h3>
                    <p className="text-sm text-muted-foreground">Review student join requests</p>
                  </button>
                  
                  <button
                    onClick={() => router.push("/teacher/create-club")}
                    className="card p-6 text-left hover:shadow-lg transition-all duration-200 group cursor-pointer"
                  >
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">➕</div>
                    <h3 className="font-semibold text-foreground mb-2">Create Club</h3>
                    <p className="text-sm text-muted-foreground">Start a new club</p>
                  </button>

                  <button
                    onClick={() => router.push("/student/clubs")}
                    className="card p-6 text-left hover:shadow-lg transition-all duration-200 group cursor-pointer"
                  >
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">👀</div>
                    <h3 className="font-semibold text-foreground mb-2">View as Student</h3>
                    <p className="text-sm text-muted-foreground">See the student experience</p>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="card p-8 max-w-md text-center">
              <div className="text-6xl mb-4">⚠️</div>
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
