"use client";
import { useEffect, useState } from "react";
import { firestore } from "@/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../components/AuthContext";
import DashboardTopBar from "../../../components/DashboardTopBar";

export default function CreateClubPage() {
  const [clubName, setClubName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { userData, loading } = useAuth();

  useEffect(() => {
    if (!loading && userData) {
      if (!userData.schoolId) {
        setError("You must be joined to a school to create a club.");
      }
    }
  }, [userData, loading]);

  const handleCreate = async () => {
    setError("");

    if (!clubName.trim() || !description.trim()) {
      setError("Both club name and description are required.");
      return;
    }

    if (!userData?.schoolId) {
      setError("You must be joined to a school to create a club.");
      return;
    }

    try {
      await addDoc(collection(firestore, "clubs"), {
        name: clubName.trim(),
        description: description.trim(),
        schoolId: userData.schoolId,
        teacherId: userData.uid,
        studentIds: [],
        createdAt: serverTimestamp(),
      });

      alert("Club created successfully!");
      router.push("/teacher/dashboard");
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    }
  };

  return (
    <ProtectedRoute requiredRole="teacher">
      <div className="min-h-screen bg-gradient-to-br from-background to-muted text-foreground p-6">
        <DashboardTopBar title="Teacher Dashboard" />
        
        {/* Back Button */}
        <button
          onClick={() => router.push("/teacher/dashboard")}
          className="mb-6 bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-lg text-white font-semibold flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
        
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">➕ Create a Club</h1>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
              <p className="text-destructive font-medium">{error}</p>
            </div>
          )}

          <div className="card p-8 space-y-6">
            <div>
              <label htmlFor="clubName" className="block text-sm font-semibold mb-3 text-foreground">
                Club Name
              </label>
              <input
                id="clubName"
                type="text"
                placeholder="Enter club name"
                className="input"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-semibold mb-3 text-foreground">
                Description
              </label>
              <textarea
                id="description"
                placeholder="Describe the club's purpose and activities"
                className="input min-h-[120px] resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCreate}
                className="flex-1 btn-primary"
              >
                Create Club
              </button>
              <button
                onClick={() => router.push("/teacher/dashboard")}
                className="btn-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
