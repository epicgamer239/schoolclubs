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
import Modal from "../../components/Modal";
import { useModal } from "../../utils/useModal";

export default function JoinSchoolPage() {
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { modalState, showAlert, closeModal } = useModal();

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

      showAlert("Success", "Joined school successfully!");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <form
        onSubmit={handleJoin}
        className="card p-8 shadow-2xl border border-border/50 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Join a School</h1>
          <p className="text-muted-foreground mt-2">Enter your school's join code to get started</p>
        </div>

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
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />
    </div>
  );
}