"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, firestore } from "@/firebase";
import { doc, getDocs, collection, query, where, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function JoinSchoolPage() {
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/login");
    });
    return () => unsub();
  }, []);

  const handleJoin = async () => {
    setError("");
    if (!joinCode.trim()) return;

    const q = query(collection(firestore, "schools"), where("joinCode", "==", joinCode.toUpperCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      setError("Invalid join code.");
      return;
    }

    const schoolDoc = querySnapshot.docs[0];
    const schoolId = schoolDoc.id;
    const user = auth.currentUser;

    await updateDoc(doc(firestore, "users", user.uid), {
      role: "teacher",
      schoolId,
    });

    router.push("/teacher/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">Join Your School</h1>
      <input
        type="text"
        placeholder="Enter Join Code"
        className="p-3 rounded text-black w-full max-w-sm mb-4"
        value={joinCode}
        onChange={(e) => setJoinCode(e.target.value)}
      />
      <button
        onClick={handleJoin}
        className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded"
      >
        Join School
      </button>
      {error && <p className="text-red-400 mt-4">{error}</p>}
    </div>
  );
}