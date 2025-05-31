"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase";
import { signOut } from "firebase/auth";

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1B2A] via-[#1e2746] to-[#111b32] text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-4 font-poppins">🎓 Welcome to StudyHub</h1>
      <p className="text-[#CFCFCF] mb-8 text-center">
        Your personalized learning assistant dashboard.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl">
        <div
          onClick={() => router.push("/upload")}
          className="bg-white/10 border border-white/10 rounded-2xl p-6 hover:bg-white/20 transition cursor-pointer"
        >
          <h2 className="text-xl font-bold mb-2">📤 Upload Notes</h2>
          <p className="text-[#CFCFCF] text-sm">Convert handwritten or scanned notes to text.</p>
        </div>

        <div className="bg-white/10 border border-white/10 rounded-2xl p-6 opacity-60 cursor-not-allowed">
          <h2 className="text-xl font-bold mb-2">📊 Progress Tracker</h2>
          <p className="text-[#CFCFCF] text-sm">Track your learning stats (coming soon).</p>
        </div>

        <div
          onClick={() => router.push("/summary")}
          className="bg-white/10 border border-white/10 rounded-2xl p-6 hover:bg-white/20 transition cursor-pointer"
        >
          <h2 className="text-xl font-bold mb-2">📝 Voice Summarizer</h2>
          <p className="text-[#CFCFCF] text-sm">Record or upload lectures and get flashcards.</p>
        </div>

        <div className="bg-white/10 border border-white/10 rounded-2xl p-6 opacity-60 cursor-not-allowed">
          <h2 className="text-xl font-bold mb-2">🔍 Smart Search</h2>
          <p className="text-[#CFCFCF] text-sm">Find summaries by topic (coming soon).</p>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="mt-8 bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-lg transition font-semibold"
      >
        Log Out
      </button>
    </div>
  );
}