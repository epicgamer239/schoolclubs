"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { firestore } from "@/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import { useAuth } from "../../../../components/AuthContext";
import DashboardTopBar from "../../../../components/DashboardTopBar";

export default function StudentDetailPage() {
  const { studentId } = useParams();
  const router = useRouter();
  const [student, setStudent] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userData, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!userData?.schoolId || !studentId) return;

      try {
        // Fetch student data
        const studentDoc = await getDoc(doc(firestore, "users", studentId));
        if (!studentDoc.exists()) {
          console.error("Student not found");
          setLoading(false);
          return;
        }

        const studentData = { id: studentDoc.id, ...studentDoc.data() };
        setStudent(studentData);

        // Fetch student's clubs
        if (studentData.clubIds && studentData.clubIds.length > 0) {
          const clubQuery = query(
            collection(firestore, "clubs"),
            where("schoolId", "==", userData.schoolId)
          );
          const clubSnapshot = await getDocs(clubQuery);
          const allClubs = clubSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Filter clubs that the student is in
          const studentClubs = allClubs.filter((club) =>
            studentData.clubIds.includes(club.id)
          );
          setClubs(studentClubs);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching student data:", error);
        setLoading(false);
      }
    };

    if (!authLoading && userData) {
      fetchStudentData();
    }
  }, [studentId, userData, authLoading]);



  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-background text-foreground">
          <DashboardTopBar title="Admin Dashboard" />
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading student details...</p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!student) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-background text-foreground">
          <DashboardTopBar title="Admin Dashboard" />
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="text-center py-8">
              <p className="text-destructive">Student not found.</p>
              <button
                onClick={() => router.push("/admin/students")}
                className="mt-4 btn-primary"
              >
                Back to Student Directory
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-background text-foreground">
        <DashboardTopBar title="Admin Dashboard" />
        
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.push("/admin/students")}
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Student Directory
          </button>

          {/* Student Header */}
          <div className="card p-6 mb-8">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {(student.displayName || student.email || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                  {student.displayName || "No Name"}
                </h1>
                <p className="text-muted-foreground text-lg">{student.email}</p>
              </div>
            </div>
          </div>

          {/* Student Details Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Basic Information */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Basic Information
              </h2>
              <div className="space-y-3">
                <div>
                  <span className="text-muted-foreground text-sm">Display Name:</span>
                  <p className="font-medium">{student.displayName || "Not provided"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Email:</span>
                  <p className="font-medium">{student.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Role:</span>
                  <p className="font-medium capitalize">{student.role}</p>
                </div>

              </div>
            </div>

            {/* Club Statistics */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Club Statistics
              </h2>
              <div className="space-y-3">
                <div>
                  <span className="text-muted-foreground text-sm">Total Clubs Joined:</span>
                  <p className="font-medium text-2xl">{clubs.length}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Clubs as Leader:</span>
                  <p className="font-medium">
                    {clubs.filter(club => club.leaderId === student.id).length}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Active Member:</span>
                  <p className="font-medium text-primary">
                    {clubs.length > 0 ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Clubs Section */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Clubs
            </h2>
            
            {clubs.length === 0 ? (
              <p className="text-muted-foreground">This student hasn't joined any clubs yet.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clubs.map((club) => (
                  <div key={club.id} className="card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{club.name}</h3>
                      {club.leaderId === student.id && (
                                                  <span className="badge-primary">
                          Leader
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm mb-3">{club.description}</p>
                    <div className="text-xs text-muted-foreground">
                      <p>Members: {club.studentIds?.length || 0}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 