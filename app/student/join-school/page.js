"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, provider, firestore } from "../../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function JoinSchoolPage() {
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleJoin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) return;

      // 1. Search for school with join code
      const q = query(
        collection(firestore, "schools"),
        where("joinCode", "==", joinCode.toUpperCase())
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("Invalid join code. Please try again.");
        return;
      }

      // 2. Get the school document
      const schoolDoc = querySnapshot.docs[0];
      const schoolId = schoolDoc.id;

      // 3. Update the user's schoolId field
      await updateDoc(doc(firestore, "users", user.uid), {
        schoolId,
      });

      // 4. Redirect to dashboard
      router.push("/student/dashboard");
    } catch (err) {
      console.error("Join school error:", err);
      setError("An error occurred while joining the school.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white flex items-center justify-center p-6">
      <form
        onSubmit={handleJoin}
        className="bg-white/10 backdrop-blur p-8 rounded-xl shadow-lg max-w-md w-full"
      >
        <h1 className="text-2xl font-bold mb-4">🔑 Join Your School</h1>
        {error && <p className="text-red-400 mb-4">{error}</p>}

        <label className="block mb-2 font-medium">Enter School Join Code:</label>
        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          className="w-full p-3 rounded bg-white/10 text-white mb-4"
          placeholder="e.g. ABC123"
        />

        <button
          type="submit"
          className="w-full bg-teal-500 hover:bg-teal-600 py-2 rounded text-white font-semibold"
        >
          Join School
        </button>
      </form>
    </div>
  );
}
