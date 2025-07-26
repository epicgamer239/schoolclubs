"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { firestore } from "@/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  getDocs,
  collection,
  where,
  query,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import { useAuth } from "../../../../components/AuthContext";
import DashboardTopBar from "../../../../components/DashboardTopBar";
import Modal from "../../../../components/Modal";
import { useModal } from "../../../../utils/useModal";

export default function ClubMembersPage() {
  const { clubId } = useParams();
  const router = useRouter();
  const [club, setClub] = useState(null);
  const [students, setStudents] = useState([]);
  const { userData, loading } = useAuth();
  const { modalState, showConfirm, showAlert, closeModal, handleConfirm } = useModal();

  useEffect(() => {
    const fetchClubAndMembers = async () => {
      if (!userData || !clubId) return;

      const clubDoc = await getDoc(doc(firestore, "clubs", clubId));
      const clubData = clubDoc.data();
      setClub({ id: clubDoc.id, ...clubData });

      // Get student details
      const studentIds = Array.isArray(clubData.studentIds) ? clubData.studentIds : [];
      const studentQuery = query(
        collection(firestore, "users"),
        where("uid", "in", studentIds)
      );

      const studentSnap = await getDocs(studentQuery);
      const studentList = studentSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setStudents(studentList);
    };

    if (!loading && userData) {
    fetchClubAndMembers();
    }
  }, [clubId, userData, loading]);

  const handleRemove = async (studentId) => {
    showConfirm(
      "Remove Student",
      "Are you sure you want to remove this student from the club?",
      async () => {
        await updateDoc(doc(firestore, "clubs", clubId), {
          studentIds: arrayRemove(studentId),
        });

        await updateDoc(doc(firestore, "users", studentId), {
          clubIds: arrayRemove(clubId),
        });

        setStudents((prev) => prev.filter((s) => s.uid !== studentId));
      }
    );
  };

  const handlePromote = async (studentId) => {
    await updateDoc(doc(firestore, "clubs", clubId), {
      leaderId: studentId,
    });
    setClub((prev) => ({ ...prev, leaderId: studentId }));
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-background text-foreground">
        <DashboardTopBar title="Admin Dashboard" />
        
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.push("/admin/clubs")}
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Manage Clubs
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Club Members</h1>
            {club && (
              <p className="text-muted-foreground mt-2">
                Managing members for: <span className="font-semibold text-foreground">{club.name}</span>
              </p>
            )}
          </div>

          {students.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">No Members Yet</h3>
              <p className="text-muted-foreground">This club doesn't have any members yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {students.map((student) => (
                <div
                  key={student.uid}
                  className="card p-6 flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-foreground">{student.displayName || student.email}</p>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                    {club?.leaderId === student.uid && (
                      <div className="flex items-center gap-2 mt-2">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        <span className="text-sm font-medium text-primary">Club Leader</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {club?.leaderId !== student.uid && (
                      <button
                        onClick={() => handlePromote(student.uid)}
                        className="btn-outline text-sm"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        Promote to Leader
                      </button>
                    )}
                                          <button
                        onClick={() => showAlert("Coming Soon", "Messaging feature coming soon")}
                        className="btn-outline text-sm"
                      >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Message
                    </button>
                    <button
                      onClick={() => handleRemove(student.uid)}
                      className="btn-destructive text-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={handleConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />
    </ProtectedRoute>
  );
}
