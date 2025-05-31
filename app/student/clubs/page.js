"use client";
import { useEffect, useState } from "react";
import { auth, firestore } from "@/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function StudentClubList() {
  const [clubs, setClubs] = useState([]);
  const [schoolId, setSchoolId] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [joinedClubIds, setJoinedClubIds] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return router.push("/login");

      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      const userData = userDoc.data();

      if (userData.role !== "student") return router.push("/homescreen");

      setStudentId(user.uid);
      setJoinedClubIds(userData.clubIds || []);
      setSchoolId(userData.schoolId);

      if (userData.schoolId) {
        const q = query(collection(firestore, "clubs"), where("schoolId", "==", userData.schoolId));
        const querySnapshot = await getDocs(q);
        const clubList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClubs(clubList);
      }
    };

    fetchData();
  }, []);

  const handleJoin = async (clubId) => {
    if (!studentId) return;
    await updateDoc(doc(firestore, "users", studentId), {
      clubIds: arrayUnion(clubId),
    });
    await updateDoc(doc(firestore, "clubs", clubId), {
      studentIds: arrayUnion(studentId),
    });
    setJoinedClubIds((prev) => [...prev, clubId]);
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white p-6">
      <h1 className="text-3xl font-bold mb-6">🎓 Explore Clubs</h1>

      {clubs.length === 0 ? (
        <p>No clubs found for your school.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club) => (
            <div key={club.id} className="bg-white/10 p-5 rounded-xl shadow">
              <h2 className="text-xl font-bold mb-2">{club.name}</h2>
              <p className="text-sm text-[#CFCFCF] mb-4">{club.description}</p>
              {joinedClubIds.includes(club.id) ? (
                <button className="bg-green-600 text-white px-4 py-2 rounded cursor-not-allowed opacity-60">
                  Joined
                </button>
              ) : (
                <button
                  onClick={() => handleJoin(club.id)}
                  className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded"
                >
                  Join Club
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
