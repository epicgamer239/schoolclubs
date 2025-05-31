"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, firestore } from "@firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";
import DashboardTopBar from "../../../components/DashboardTopBar";

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [allClubs, setAllClubs] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchStudentData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return router.push("/login");

      const userDoc = await getDoc(doc(firestore, "users", currentUser.uid));
      const userData = userDoc.data();

      if (userData?.role !== "student") return router.push("/");

      const userClubIds = userData.clubIds || [];

      setUser({ ...userData, uid: currentUser.uid });

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
  }, [router]);

  const handleLeave = async (clubId) => {
    if (!confirm("Are you sure you want to leave this club?")) return;

    const updatedClubs = clubs.filter((c) => c.id !== clubId);
    const leavingClub = clubs.find((c) => c.id === clubId);

    await updateDoc(doc(firestore, "users", user.uid), {
      clubIds: arrayRemove(clubId),
    });
    await updateDoc(doc(firestore, "clubs", clubId), {
      studentIds: arrayRemove(user.uid),
    });

    setClubs(updatedClubs);
    setAllClubs((prev) => [leavingClub, ...prev]);
  };

  const handleJoin = async (clubId) => {
    const joiningClub = allClubs.find((c) => c.id === clubId);

    await updateDoc(doc(firestore, "users", user.uid), {
      clubIds: arrayUnion(clubId),
    });
    await updateDoc(doc(firestore, "clubs", clubId), {
      studentIds: arrayUnion(user.uid),
    });

    setClubs((prev) => [...prev, joiningClub]);
    setAllClubs((prev) => prev.filter((c) => c.id !== clubId));
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white p-6">
      <DashboardTopBar title="Student Dashboard" />

      <h2 className="text-xl font-semibold mb-4">📘 My Clubs</h2>
      {clubs.length === 0 ? (
        <p className="text-gray-300 mb-6">You're not in any clubs yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {clubs.map((club) => (
            <div key={club.id} className="bg-white/10 p-4 rounded-xl shadow">
              <h3 className="text-lg font-bold mb-1">{club.name}</h3>
              <p className="text-sm text-gray-300">{club.description}</p>
              {club.leaderId === user.uid && (
                <p className="text-green-400 mt-1 text-sm">🌟 You are the leader</p>
              )}
              <button
                onClick={() => handleLeave(club.id)}
                className="mt-3 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm text-white"
              >
                Leave Club
              </button>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4">🔍 Explore Clubs</h2>
      {allClubs.length === 0 ? (
        <p className="text-gray-300">No other clubs available at your school.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allClubs.map((club) => (
            <div key={club.id} className="bg-white/10 p-4 rounded-xl shadow">
              <h3 className="text-lg font-bold mb-1">{club.name}</h3>
              <p className="text-sm text-gray-300">{club.description}</p>
              <button
                onClick={() => handleJoin(club.id)}
                className="mt-3 bg-teal-500 hover:bg-teal-600 px-3 py-1 rounded text-sm text-white"
              >
                Join Club
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
