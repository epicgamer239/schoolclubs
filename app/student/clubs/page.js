"use client";
import { useEffect, useState } from "react";
import { firestore } from "@/firebase";
import {
  doc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../components/AuthContext";
import DashboardTopBar from "../../../components/DashboardTopBar";
import Modal from "../../../components/Modal";
import { useModal } from "../../../utils/useModal";

export default function StudentClubList() {
  const [clubs, setClubs] = useState([]);
  const [joinedClubIds, setJoinedClubIds] = useState([]);
  const router = useRouter();
  const { userData, loading } = useAuth();
  const { modalState, showAlert, closeModal } = useModal();

  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.schoolId) return;

      setJoinedClubIds(userData.clubIds || []);

        const q = query(collection(firestore, "clubs"), where("schoolId", "==", userData.schoolId));
        const querySnapshot = await getDocs(q);
        const clubList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClubs(clubList);
    };

    if (!loading && userData) {
    fetchData();
    }
  }, [userData, loading]);

  const handleJoin = async (clubId) => {
    if (!userData?.uid) return;
    
    // Check if already a member
    if (joinedClubIds.includes(clubId)) {
      showAlert("Already a Member", "You are already a member of this club.");
      return;
    }
    
    try {
      await updateDoc(doc(firestore, "users", userData.uid), {
        clubIds: arrayUnion(clubId),
      });
      await updateDoc(doc(firestore, "clubs", clubId), {
        studentIds: arrayUnion(userData.uid),
      });
      setJoinedClubIds((prev) => [...prev, clubId]);
    } catch (error) {
      console.error("Error joining club:", error);
      showAlert("Error", "Failed to join club. Please try again.");
    }
  };

  return (
    <ProtectedRoute requiredRole="student">
      <div className="min-h-screen bg-background text-foreground">
        <DashboardTopBar title="Student Dashboard" />
        
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Explore Clubs</h1>
            <p className="text-muted-foreground mt-2">Discover and join clubs at your school</p>
          </div>

          {clubs.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">No Clubs Available</h3>
              <p className="text-muted-foreground">No clubs found for your school.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clubs.map((club) => (
                <div key={club.id} className="card p-6 hover:shadow-lg transition-shadow">
                  <h2 className="text-xl font-bold mb-2 text-foreground">{club.name}</h2>
                  <p className="text-sm text-muted-foreground mb-4">{club.description}</p>
                  {joinedClubIds.includes(club.id) ? (
                    <button className="btn-outline cursor-not-allowed opacity-60">
                      Joined
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoin(club.id)}
                      className="btn-primary"
                    >
                      Join Club
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />
    </ProtectedRoute>
  );
}
