"use client";
import { useEffect, useState } from "react";
import { firestore } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../components/AuthContext";
import DashboardTopBar from "../../../components/DashboardTopBar";
import Image from "next/image";

export default function TeacherClubsPage() {
  const [clubs, setClubs] = useState([]);
  const [clubDetails, setClubDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState({});
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.uid) return;

      const q = query(
        collection(firestore, "clubs"),
        where("teacherId", "==", userData.uid)
      );
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setClubs(results);
      setLoading(false);
    };

    if (!authLoading && userData) {
      fetchData();
    }
  }, [userData, authLoading]);

  const fetchClubDetails = async (clubId) => {
    if (clubDetails[clubId]) return; // Already loaded

    setLoadingDetails(prev => ({ ...prev, [clubId]: true }));
    
    try {
      const club = clubs.find(c => c.id === clubId);
      if (!club || !club.studentIds || club.studentIds.length === 0) {
        setClubDetails(prev => ({ ...prev, [clubId]: { students: [] } }));
        setLoadingDetails(prev => ({ ...prev, [clubId]: false }));
        return;
      }

      // Fetch all students in the club
      const studentsPromises = club.studentIds.map(async (studentId) => {
        const studentDoc = await getDoc(doc(firestore, "users", studentId));
        if (studentDoc.exists()) {
          return { id: studentId, ...studentDoc.data() };
        }
        return null;
      });
      
      const studentsResults = await Promise.all(studentsPromises);
      const students = studentsResults.filter(student => student !== null);

      setClubDetails(prev => ({ ...prev, [clubId]: { students } }));
    } catch (error) {
      console.error("Error fetching club details:", error);
    } finally {
      setLoadingDetails(prev => ({ ...prev, [clubId]: false }));
    }
  };

  const handleKickStudent = async (clubId, studentId, studentName) => {
    if (!confirm(`Are you sure you want to remove ${studentName} from this club?`)) {
      return;
    }

    try {
      // Remove student from club
      await updateDoc(doc(firestore, "clubs", clubId), {
        studentIds: arrayRemove(studentId)
      });

      // Remove club from student's clubIds
      await updateDoc(doc(firestore, "users", studentId), {
        clubIds: arrayRemove(clubId)
      });

      // Update local state
      setClubs(prev => prev.map(club => 
        club.id === clubId 
          ? { ...club, studentIds: club.studentIds.filter(id => id !== studentId) }
          : club
      ));

      // Update club details
      setClubDetails(prev => ({
        ...prev,
        [clubId]: {
          students: prev[clubId]?.students.filter(student => student.id !== studentId) || []
        }
      }));

      alert(`${studentName} has been removed from the club.`);
    } catch (error) {
      console.error("Error kicking student:", error);
      alert("Failed to remove student from club. Please try again.");
    }
  };

  return (
    <ProtectedRoute requiredRole="teacher">
      <div className="min-h-screen bg-gradient-to-br from-background to-muted text-foreground p-6">
        <DashboardTopBar title="Teacher Dashboard" />
        
        {/* Back Button */}
        <button
          onClick={() => router.push("/teacher/dashboard")}
          className="mb-6 bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-lg text-white font-semibold flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold mb-8">📚 Your Clubs</h1>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : clubs.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">No Clubs Yet</h3>
            <p className="text-muted-foreground mb-4">You haven't created any clubs yet.</p>
            <button
              onClick={() => router.push("/teacher/create-club")}
              className="btn-primary"
            >
              Create Your First Club
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {clubs.map((club) => (
              <div key={club.id} className="card p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{club.name}</h2>
                    <p className="text-muted-foreground mt-2">{club.description}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="badge badge-primary">
                        👥 {club.studentIds?.length || 0} members
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push(`/teacher/clubs/${club.id}`)}
                      className="btn-primary"
                    >
                      👁️ View Club
                    </button>
                    <button
                      onClick={() => router.push(`/teacher/clubs/${club.id}/settings`)}
                      className="btn-outline"
                    >
                      ⚙️ Settings
                    </button>
                    <button
                      onClick={() => fetchClubDetails(club.id)}
                      className="btn-outline"
                    >
                      {clubDetails[club.id] ? "Hide Members" : "View Members"}
                    </button>
                  </div>
                </div>

                {/* Student Details Section */}
                {clubDetails[club.id] && (
                  <div className="mt-6 border-t border-border pt-6">
                    <h3 className="text-lg font-semibold mb-4">👥 Club Members</h3>
                    
                    {loadingDetails[club.id] ? (
                      <div className="flex justify-center items-center h-16">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                      </div>
                    ) : clubDetails[club.id].students.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">👥</div>
                        <p className="text-muted-foreground">No students have joined this club yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {clubDetails[club.id].students.map((student) => (
                          <div key={student.id} className="card p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  {student.photoURL ? (
                                    <Image
                                      src={student.photoURL}
                                      crossOrigin="anonymous"
                                      alt="Student"
                                      width={40}
                                      height={40}
                                      className="w-10 h-10 rounded-full border-2 border-border"
                                      unoptimized
                                    />
                                  ) : (
                                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                                      {(student.displayName || student.email || "?").charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-foreground font-medium">
                                      {student.displayName || student.email}
                                    </p>
                                    <p className="text-muted-foreground text-sm">
                                      {student.email}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleKickStudent(
                                  club.id, 
                                  student.id, 
                                  student.displayName || student.email
                                )}
                                className="btn-destructive text-sm ml-2"
                                title="Remove from club"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
