"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "@/firebase";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../components/AuthContext";
import DashboardTopBar from "../../../components/DashboardTopBar";
import db from "../../../utils/database";
import { cacheUtils, globalCache } from "../../../utils/cache";

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { userData } = useAuth();

  useEffect(() => {
    const fetchStudents = async () => {
      if (!userData?.schoolId) return;

      try {
        // Check cache for students first
        const cacheKey = `students:${userData.schoolId}`;
        const cachedStudents = globalCache.get(cacheKey);
        
        if (cachedStudents) {
          setStudents(cachedStudents);
          setLoading(false);
          return;
        }

        // Fetch students with caching
        const studentsSnap = await db.getDocuments("users", {
          whereClauses: [
            { field: "schoolId", operator: "==", value: userData.schoolId },
            { field: "role", operator: "==", value: "student" }
          ],
          useCache: true
        });

        const studentsList = studentsSnap.documents;
        setStudents(studentsList);
        
        // Cache the students data
        globalCache.set(cacheKey, studentsList, 300); // 5 minutes
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching students:", error);
        setLoading(false);
      }
    };

    fetchStudents();
  }, [userData]);

  useEffect(() => {
    let filtered = students;

    // Apply text search
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter((student) => {
        const searchLower = searchTerm.toLowerCase();
        const name = (student.displayName || student.email || "").toLowerCase();
        const email = (student.email || "").toLowerCase();
        return name.includes(searchLower) || email.includes(searchLower);
      });
    }

    // Apply role filter (though for students page this will always be "student")
    if (filterRole !== "all") {
      filtered = filtered.filter((student) => student.role === filterRole);
    }

    setFilteredStudents(filtered);
  }, [searchTerm, filterRole, students]);

  const handleStudentClick = (studentId) => {
    router.push(`/admin/students/${studentId}`);
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-background text-foreground">
          <DashboardTopBar title="Admin Dashboard" />
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-muted-foreground font-medium">Loading students...</p>
              </div>
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
        
        <div className="container">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Manage Students</h1>
                <p className="text-muted-foreground">View and manage all students in your school</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="btn-outline"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="card p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-semibold mb-2 text-foreground">
                  Search Students
                </label>
                <input
                  id="search"
                  type="text"
                  placeholder="Search by name or email..."
                  className="input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="md:w-48">
                <label htmlFor="filter" className="block text-sm font-semibold mb-2 text-foreground">
                  Filter by Role
                </label>
                <select
                  id="filter"
                  className="input"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="all">All Students</option>
                  <option value="student">Students</option>
                </select>
              </div>
            </div>
          </div>

          {/* Students List */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Students ({filteredStudents.length})</h2>
            </div>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || filterRole !== "all" 
                    ? "Try adjusting your search or filters"
                    : "No students have joined your school yet"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => handleStudentClick(student.id)}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50 cursor-pointer hover:shadow-lg transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{student.displayName || "Unknown"}</h3>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="badge-primary">
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 