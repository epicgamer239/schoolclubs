"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { firestore } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  addDoc,
} from "firebase/firestore";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../components/AuthContext";
import DashboardTopBar from "../../../components/DashboardTopBar";

export default function JoinSchoolPage() {
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { userData } = useAuth();

  const handleJoin = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (!userData?.uid) return;

      // 1. Search for school with student join code
      const q = query(
        collection(firestore, "schools"),
        where("studentJoinCode", "==", joinCode.toUpperCase())
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("Invalid student join code. Please try again.");
        setLoading(false);
        return;
      }

      // 2. Get the school document
      const schoolDoc = querySnapshot.docs[0];
      const schoolData = schoolDoc.data();
      const schoolId = schoolDoc.id;

      // 3. Check if manual approval is required
      if (schoolData.studentJoinType === "manual") {
        // Check for existing join request
        const existingRequestQuery = query(
          collection(firestore, "schoolJoinRequests"),
          where("studentId", "==", userData.uid),
          where("schoolId", "==", schoolId),
          where("status", "==", "pending")
        );
        const existingRequestSnapshot = await getDocs(existingRequestQuery);
        
        if (!existingRequestSnapshot.empty) {
          setSuccess("You already have a pending request to join this school. Please wait for administrator approval.");
          setLoading(false);
          return;
        }

        // Create a school join request
        await addDoc(collection(firestore, "schoolJoinRequests"), {
          studentId: userData.uid,
          schoolId: schoolId,
          studentName: userData.name || userData.email,
          studentEmail: userData.email,
          status: "pending",
          createdAt: new Date(),
          type: "student"
        });

        setSuccess("Your request to join the school has been submitted and is pending admin approval. You will be notified once your request is processed.");
        setJoinCode("");
      } else {
        // Immediate join (code-based)
        await updateDoc(doc(firestore, "users", userData.uid), {
          schoolId,
        });

        setSuccess("Successfully joined the school!");
        setTimeout(() => {
          router.push("/student/dashboard");
        }, 2000);
      }
    } catch (err) {
      console.error("Join school error:", err);
      setError("An error occurred while joining the school.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="student">
      <div className="min-h-screen bg-[#0D1B2A] text-white p-6">
        <DashboardTopBar title="Student Dashboard" />
        
        <div className="max-w-md mx-auto mt-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Join Your School</h1>
            <p className="text-gray-400">Enter your student join code to access school clubs</p>
          </div>

          <form onSubmit={handleJoin} className="bg-white/10 p-6 rounded-xl border border-white/10">
            <div className="space-y-4">
              <div>
                <label htmlFor="joinCode" className="block text-sm font-medium mb-2">
                  Student Join Code
                </label>
                <input
                  id="joinCode"
                  type="text"
                  placeholder="Enter your student join code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full p-3 rounded text-black bg-white/90 border border-gray-300 focus:border-blue-500 focus:outline-none uppercase"
                  required
                  disabled={loading}
                />
                <p className="text-sm text-gray-400 mt-1">
                  Ask your school administrator for the student join code.
                </p>
              </div>

              {error && (
                <div className="bg-red-600/20 border border-red-600 text-red-400 p-3 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-600/20 border border-green-600 text-green-400 p-3 rounded-lg">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 px-6 py-3 rounded text-white font-semibold transition-colors"
              >
                {loading ? "Processing..." : "Join School"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
