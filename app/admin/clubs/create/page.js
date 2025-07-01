"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { firestore } from "@/firebase";
import { addDoc, collection, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import { useAuth } from "../../../../components/AuthContext";
import DashboardTopBar from "../../../../components/DashboardTopBar";

export default function AdminCreateClubPage() {
  const [clubName, setClubName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const router = useRouter();
  const { userData } = useAuth();

  // Fetch teachers from the school
  useEffect(() => {
    const fetchTeachers = async () => {
      if (!userData?.schoolId) return;

      try {
        const q = query(
          collection(firestore, "users"),
          where("schoolId", "==", userData.schoolId),
          where("role", "==", "teacher")
        );
        const querySnapshot = await getDocs(q);
        const teacherList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort teachers alphabetically by name
        const sortedTeachers = teacherList.sort((a, b) => {
          const nameA = (a.displayName || a.email || "").toLowerCase();
          const nameB = (b.displayName || b.email || "").toLowerCase();
          return nameA.localeCompare(nameB);
        });

        setTeachers(sortedTeachers);
        setLoadingTeachers(false);
      } catch (error) {
        console.error("Error fetching teachers:", error);
        setError("Failed to load teachers. Please try again.");
        setLoadingTeachers(false);
      }
    };

    if (userData) {
      fetchTeachers();
    }
  }, [userData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!clubName.trim() || !description.trim()) {
      setError("Both club name and description are required.");
      setLoading(false);
      return;
    }

    if (!userData?.schoolId) {
      setError("You must be associated with a school to create a club.");
      setLoading(false);
      return;
    }

    try {
      const clubData = {
        name: clubName.trim(),
        description: description.trim(),
        schoolId: userData.schoolId,
        studentIds: [],
        createdAt: serverTimestamp(),
      };

      // Only add teacherId if a teacher is selected
      if (selectedTeacherId) {
        clubData.teacherId = selectedTeacherId;
      }

      const docRef = await addDoc(collection(firestore, "clubs"), clubData);

      alert("Club created successfully!");
      router.push("/admin/clubs");
    } catch (err) {
      console.error("Error creating club:", err);
      setError("Something went wrong while creating the club.");
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-background to-muted text-foreground p-6">
        <DashboardTopBar title="Admin Dashboard" />
        
        {/* Back Button */}
        <button
          onClick={() => router.push("/admin/clubs")}
          className="mb-6 bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-lg text-white font-semibold flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Manage Clubs
        </button>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">➕ Create New Club</h1>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="card p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-3 text-foreground">
                  Club Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter club name"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-3 text-foreground">
                  Description *
                </label>
                <textarea
                  placeholder="Describe what this club is about..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input h-32 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-3 text-foreground">
                  Teacher Sponsor (Optional)
                </label>
                {loadingTeachers ? (
                  <div className="input text-muted-foreground">
                    Loading teachers...
                  </div>
                ) : (
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="input"
                  >
                    <option value="">No teacher sponsor (Executive creation)</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.displayName || teacher.email}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  Select a teacher to sponsor this club, or leave empty for executive creation without a sponsor.
                </p>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-success flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Club
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => router.push("/admin/clubs")}
                  className="btn-outline"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
} 