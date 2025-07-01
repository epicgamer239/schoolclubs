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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <form
        onSubmit={handleJoin}
        className="card p-8 shadow-2xl border border-border/50 w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-6 text-foreground text-center">🏫 Join a School</h1>

        <input
          type="text"
          placeholder="Enter Join Code"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          className="input uppercase mb-6"
          required
        />

        {error && <p className="text-destructive mb-6 text-center font-medium">{error}</p>}

        <button
          type="submit"
          className="w-full btn-primary py-3"
        >
          Join School
        </button>
      </form>
    </div>
  );
}