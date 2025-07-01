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

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    
    try {
      // Handle Firestore timestamp
      if (timestamp.toDate) {
        return new Date(timestamp.toDate()).toLocaleDateString();
      }
      // Handle regular date object or timestamp
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString();
      }
      // Handle timestamp number
      if (typeof timestamp === 'number') {
        return new Date(timestamp).toLocaleDateString();
      }
      return "Unknown";
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Unknown";
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-[#0D1B2A] text-white p-6">
          <DashboardTopBar title="Admin Dashboard" />
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Loading student details...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!student) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-[#0D1B2A] text-white p-6">
          <DashboardTopBar title="Admin Dashboard" />
          <div className="text-center py-8">
            <p className="text-red-400">Student not found.</p>
            <button
              onClick={() => router.push("/admin/students")}
              className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
            >
              Back to Student Look Up
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-[#0D1B2A] text-white p-6">
        <DashboardTopBar title="Admin Dashboard" />
        
        {/* Back Button */}
        <button
          onClick={() => router.push("/admin/students")}
          className="mb-6 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Student Look Up
        </button>

        {/* Student Header */}
        <div className="bg-white/10 rounded-xl p-6 mb-6 border border-white/10">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
              {(student.displayName || student.email || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {student.displayName || "No Name"}
              </h1>
              <p className="text-gray-300 text-lg">{student.email}</p>
            </div>
          </div>
        </div>

        {/* Student Details Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Basic Information */}
          <div className="bg-white/10 rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold mb-4">📋 Basic Information</h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-400">Display Name:</span>
                <p className="font-medium">{student.displayName || "Not provided"}</p>
              </div>
              <div>
                <span className="text-gray-400">Email:</span>
                <p className="font-medium">{student.email}</p>
              </div>
              <div>
                <span className="text-gray-400">Role:</span>
                <p className="font-medium capitalize">{student.role}</p>
              </div>
              <div>
                <span className="text-gray-400">Account Created:</span>
                <p className="font-medium">
                  {formatDate(student.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Club Statistics */}
          <div className="bg-white/10 rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold mb-4">📊 Club Statistics</h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-400">Total Clubs Joined:</span>
                <p className="font-medium text-2xl">{clubs.length}</p>
              </div>
              <div>
                <span className="text-gray-400">Clubs as Leader:</span>
                <p className="font-medium">
                  {clubs.filter(club => club.leaderId === student.id).length}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Active Member:</span>
                <p className="font-medium text-green-400">
                  {clubs.length > 0 ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Clubs Section */}
        <div className="bg-white/10 rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-4">📘 Clubs</h2>
          
          {clubs.length === 0 ? (
            <p className="text-gray-400">This student hasn't joined any clubs yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clubs.map((club) => (
                <div key={club.id} className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{club.name}</h3>
                    {club.leaderId === student.id && (
                      <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs">
                        Leader
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm mb-3">{club.description}</p>
                  <div className="text-xs text-gray-400">
                    <p>Members: {club.studentIds?.length || 0}</p>
                    <p>Created: {formatDate(club.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 