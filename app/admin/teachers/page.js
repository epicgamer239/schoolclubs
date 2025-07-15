"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { firestore } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import DashboardTopBar from "../../../components/DashboardTopBar";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../components/AuthContext";

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const { userData } = useAuth();

  useEffect(() => {
    const fetchTeachers = async () => {
      if (!userData?.schoolId) return;

      try {
        const teachersQuery = query(
          collection(firestore, "users"),
          where("schoolId", "==", userData.schoolId),
          where("role", "==", "teacher")
        );
        
        const teachersSnapshot = await getDocs(teachersQuery);
        const teachersList = teachersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort teachers by displayName in JavaScript
        const sortedTeachers = teachersList.sort((a, b) => {
          const nameA = (a.displayName || a.email || "").toLowerCase();
          const nameB = (b.displayName || b.email || "").toLowerCase();
          return nameA.localeCompare(nameB);
        });
        
        setTeachers(sortedTeachers);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching teachers:", error);
        setLoading(false);
      }
    };

    if (userData) {
      fetchTeachers();
    }
  }, [userData]);

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterRole === "all" || teacher.role === filterRole;
    return matchesSearch && matchesFilter;
  });

  const handleDeleteTeacher = async () => {
    if (!selectedTeacher) return;

    setDeleting(true);
    try {
      // Delete the teacher's user document
      await deleteDoc(doc(firestore, "users", selectedTeacher.id));
      
      // Remove teacher from any clubs they're part of
      const clubsQuery = query(
        collection(firestore, "clubs"),
        where("schoolId", "==", userData.schoolId)
      );
      const clubsSnapshot = await getDocs(clubsQuery);
      
      const updatePromises = clubsSnapshot.docs.map(async (clubDoc) => {
        const clubData = clubDoc.data();
        if (clubData.teacherIds?.includes(selectedTeacher.id)) {
          const updatedTeacherIds = clubData.teacherIds.filter(id => id !== selectedTeacher.id);
          await updateDoc(doc(firestore, "clubs", clubDoc.id), {
            teacherIds: updatedTeacherIds
          });
        }
      });
      
      await Promise.all(updatePromises);
      
      // Update local state
      setTeachers(prev => prev.filter(t => t.id !== selectedTeacher.id));
      setShowDeleteModal(false);
      setSelectedTeacher(null);
    } catch (error) {
      console.error("Error deleting teacher:", error);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString();
    }
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-background">
          <DashboardTopBar title="Manage Teachers" />
          <div className="container">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-background">
        <DashboardTopBar title="Manage Teachers" />
        
        <div className="container">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Manage Teachers</h1>
                <p className="text-muted-foreground">View and manage all teachers in your school</p>
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
                  Search Teachers
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
                  <option value="all">All Teachers</option>
                  <option value="teacher">Teachers</option>
                </select>
              </div>
            </div>
          </div>

          {/* Teachers List */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Teachers ({filteredTeachers.length})</h2>
            </div>

            {filteredTeachers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">No Teachers Found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || filterRole !== "all" 
                    ? "Try adjusting your search or filters"
                    : "No teachers have joined your school yet"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTeachers.map((teacher) => (
                  <div key={teacher.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{teacher.displayName || "Unknown"}</h3>
                        <p className="text-sm text-muted-foreground">{teacher.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined: {formatDate(teacher.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="badge-secondary capitalize">{teacher.role}</span>
                      <button
                        onClick={() => {
                          setSelectedTeacher(teacher);
                          setShowDeleteModal(true);
                        }}
                        className="btn-ghost text-destructive hover:text-destructive/80"
                        title="Remove Teacher"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedTeacher && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Remove Teacher</h3>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to remove <strong>{selectedTeacher.displayName}</strong> from your school? 
                This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedTeacher(null);
                  }}
                  className="btn-outline flex-1"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTeacher}
                  className="btn-destructive flex-1"
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Removing...
                    </>
                  ) : (
                    "Remove Teacher"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 