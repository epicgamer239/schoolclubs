"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { firestore } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../components/AuthContext";
import DashboardTopBar from "../../../components/DashboardTopBar";

export default function StudentLookupPage() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchStudents = async () => {
      if (!userData?.schoolId) return;

      try {
        const q = query(
          collection(firestore, "users"),
          where("schoolId", "==", userData.schoolId),
          where("role", "==", "student")
        );
        const querySnapshot = await getDocs(q);
        const studentList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort students alphabetically by name (displayName or email)
        const sortedStudents = studentList.sort((a, b) => {
          const nameA = (a.displayName || a.email || "").toLowerCase();
          const nameB = (b.displayName || b.email || "").toLowerCase();
          return nameA.localeCompare(nameB);
        });

        setStudents(sortedStudents);
        setFilteredStudents(sortedStudents);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching students:", error);
        setLoading(false);
      }
    };

    if (!authLoading && userData) {
      fetchStudents();
    }
  }, [userData, authLoading]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter((student) => {
        const searchLower = searchTerm.toLowerCase();
        const name = (student.displayName || student.email || "").toLowerCase();
        const email = (student.email || "").toLowerCase();
        return name.includes(searchLower) || email.includes(searchLower);
      });
      setFilteredStudents(filtered);
    }
  }, [searchTerm, students]);

  const handleStudentClick = (studentId) => {
    router.push(`/admin/students/${studentId}`);
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-gradient-to-br from-background to-muted text-foreground p-6">
          <DashboardTopBar title="Admin Dashboard" />
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-muted-foreground font-medium">Loading students...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-background to-muted text-foreground p-6">
        <DashboardTopBar title="Admin Dashboard" />
        
        {/* Back Button */}
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="mb-6 bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-lg text-white font-semibold flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold mb-6">👥 Student Look Up</h1>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input max-w-md"
          />
        </div>

        {/* Student Count */}
        <p className="text-muted-foreground mb-6 font-medium">
          {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
        </p>

        {/* Student List */}
        <div className="grid gap-4">
          {filteredStudents.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold mb-2">No Students Found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'No students found matching your search.' : 'No students have joined yet.'}
              </p>
            </div>
          ) : (
            filteredStudents.map((student) => (
              <div
                key={student.id}
                onClick={() => handleStudentClick(student.id)}
                className="card p-6 cursor-pointer hover:shadow-lg transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">
                      {(student.displayName || student.email || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {student.displayName || "No Name"}
                      </h3>
                      <p className="text-muted-foreground text-sm">{student.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="badge badge-primary">
                          {student.clubIds?.length || 0} club{(student.clubIds?.length || 0) !== 1 ? 's' : ''} joined
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-muted-foreground group-hover:text-primary transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 