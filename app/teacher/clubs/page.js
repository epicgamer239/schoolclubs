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
} from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function TeacherClubsPage() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return router.push("/login");

      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      const userData = userDoc.data();

      if (userData.role !== "teacher" && userData.role !== "admin") {
        return router.push("/homescreen");
      }

      const q = query(
        collection(firestore, "clubs"),
        where("teacherId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setClubs(results);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-6 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white p-6">
      <h1 className="text-3xl font-bold mb-6">📚 Your Clubs</h1>

      {clubs.length === 0 ? (
        <p>You haven't created any clubs yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club) => (
            <div key={club.id} className="bg-white/10 p-5 rounded-xl">
              <h2 className="text-xl font-bold">{club.name}</h2>
              <p className="text-sm text-[#CFCFCF] mb-3">{club.description}</p>
              <p className="text-sm text-gray-400">
                👥 Members: {club.studentIds?.length || 0}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
