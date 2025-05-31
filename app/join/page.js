"use client";
import { useState } from "react";
import { firestore } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase";

export default function JoinSchoolPage() {
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleJoin = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    setError("");

    try {
      const q = query(
        collection(firestore, "schools"),
        where("joinCode", "==", joinCode.trim().toUpperCase())
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError("No school found with this join code.");
        return;
      }

      const schoolDoc = snapshot.docs[0];

      // Update user's schoolId
      await updateDoc(doc(firestore, "users", user.uid), {
        schoolId: schoolDoc.id,
      });

      alert("Joined school successfully!");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form
        onSubmit={handleJoin}
        className="bg-white p-6 rounded shadow w-full max-w-md"
      >
        <h1 className="text-xl font-bold mb-4">Join a School</h1>

        <input
          type="text"
          placeholder="Enter Join Code"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          className="w-full p-3 border rounded mb-4 uppercase"
          required
        />

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Join School
        </button>
      </form>
    </div>
  );
}