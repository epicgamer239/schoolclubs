"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { firestore } from "@/firebase";
import {
  doc,
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";
import DashboardTopBar from "../../../components/DashboardTopBar";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../components/AuthContext";

export default function StudentDashboard() {
  const [clubs, setClubs] = useState([]);
  const [allClubs, setAllClubs] = useState([]);
  const router = useRouter();
  const { userData } = useAuth();

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!userData) return;

      const userClubIds = userData.clubIds || [];

      const clubQuery = query(
        collection(firestore, "clubs"),
        where("schoolId", "==", userData.schoolId)
      );
      const allClubsSnap = await getDocs(clubQuery);
      const clubList = allClubsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const joined = clubList.filter((c) => userClubIds.includes(c.id));
      const available = clubList.filter((c) => !userClubIds.includes(c.id));

      setClubs(joined);
      setAllClubs(available);
    };

    fetchStudentData();
  }, [userData]);

  const handleLeave = async (clubId) => {
    if (!confirm("Are you sure you want to leave this club?")) return;

    const updatedClubs = clubs.filter((c) => c.id !== clubId);
    const leavingClub = clubs.find((c) => c.id === clubId);

    await updateDoc(doc(firestore, "users", userData.uid), {
      clubIds: arrayRemove(clubId),
    });
    await updateDoc(doc(firestore, "clubs", clubId), {
      studentIds: arrayRemove(userData.uid),
    });

    setClubs(updatedClubs);
    setAllClubs((prev) => [leavingClub, ...prev]);
  };

  const handleJoin = async (clubId) => {
    const joiningClub = allClubs.find((c) => c.id === clubId);

    await updateDoc(doc(firestore, "users", userData.uid), {
      clubIds: arrayUnion(clubId),
    });
    await updateDoc(doc(firestore, "clubs", clubId), {
      studentIds: arrayUnion(userData.uid),
    });

    setClubs((prev) => [...prev, joiningClub]);
    setAllClubs((prev) => prev.filter((c) => c.id !== clubId));
  };

  return (
    <ProtectedRoute requiredRole="student">
      <div className="min-h-screen bg-gradient-to-br from-background to-muted text-foreground p-6">
        <DashboardTopBar title="Student Dashboard" />

        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">👨‍🎓 Student Dashboard</h1>
          
          <h2 className="text-2xl font-semibold mb-6">📚 My Clubs</h2>
          {clubs.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2">No Clubs Yet</h3>
              <p className="text-muted-foreground mb-4">You're not in any clubs yet.</p>
              <p className="text-sm text-muted-foreground">
                Browse available clubs below to get started.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {clubs.map((club) => (
                <div key={club.id} className="card p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-foreground">{club.name}</h3>
                    {club.leaderId === userData?.uid && (
                      <span className="badge badge-primary">
                        👑 Leader
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{club.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {club.studentIds?.length || 0} members
                    </span>
                    <button
                      onClick={() => handleLeave(club.id)}
                      className="btn-destructive text-sm"
                    >
                      Leave Club
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 className="text-2xl font-semibold mb-6">🔍 Available Clubs</h2>
          {allClubs.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">No Available Clubs</h3>
              <p className="text-muted-foreground">No other clubs available at your school.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allClubs.map((club) => (
                <div key={club.id} className="card p-6 hover:shadow-lg transition-shadow">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{club.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{club.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {club.studentIds?.length || 0} members
                    </span>
                    <button
                      onClick={() => handleJoin(club.id)}
                      className="btn-primary text-sm"
                    >
                      Join Club
                    </button>
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