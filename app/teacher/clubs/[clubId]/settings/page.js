"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { firestore } from "@/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import ProtectedRoute from "../../../../../components/ProtectedRoute";
import { useAuth } from "../../../../../components/AuthContext";
import DashboardTopBar from "../../../../../components/DashboardTopBar";

export default function ClubSettingsPage() {
  const { clubId } = useParams();
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();
  
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [joinType, setJoinType] = useState("open"); // "open" or "request"
  const [joinDeadline, setJoinDeadline] = useState("");
  const [maxMembers, setMaxMembers] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const fetchClubData = async () => {
      if (!userData?.uid || !clubId) return;

      try {
        const clubDoc = await getDoc(doc(firestore, "clubs", clubId));
        if (!clubDoc.exists()) {
          setError("Club not found.");
          setLoading(false);
          return;
        }

        const clubData = clubDoc.data();
        
        // Verify the teacher owns this club
        if (clubData.teacherId !== userData.uid) {
          setError("You don't have permission to edit this club.");
          setLoading(false);
          return;
        }

        setClub({ id: clubDoc.id, ...clubData });
        
        // Set form values
        setJoinType(clubData.joinType || "open");
        setJoinDeadline(clubData.joinDeadline || "");
        setMaxMembers(clubData.maxMembers || "");
        setDescription(clubData.description || "");
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching club:", error);
        setError("Failed to load club data.");
        setLoading(false);
      }
    };

    if (!authLoading && userData) {
      fetchClubData();
    }
  }, [clubId, userData, authLoading]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updateData = {
        joinType,
        description: description.trim(),
      };

      // Only add joinDeadline if it's set
      if (joinDeadline) {
        updateData.joinDeadline = joinDeadline;
      }

      // Only add maxMembers if it's set and valid
      if (maxMembers && !isNaN(maxMembers) && parseInt(maxMembers) > 0) {
        updateData.maxMembers = parseInt(maxMembers);
      }

      await updateDoc(doc(firestore, "clubs", clubId), updateData);
      
      setSuccess("Club settings updated successfully!");
      setClub(prev => ({ ...prev, ...updateData }));
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error updating club:", error);
      setError("Failed to update club settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="teacher">
        <div className="min-h-screen bg-[#0D1B2A] text-white p-6">
          <DashboardTopBar title="Teacher Dashboard" />
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredRole="teacher">
        <div className="min-h-screen bg-[#0D1B2A] text-white p-6">
          <DashboardTopBar title="Teacher Dashboard" />
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-600/20 border border-red-600 text-red-400 p-4 rounded-lg">
              {error}
            </div>
            <button
              onClick={() => router.push("/teacher/clubs")}
              className="mt-4 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white"
            >
              Back to Clubs
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="teacher">
      <div className="min-h-screen bg-[#0D1B2A] text-white p-6">
        <DashboardTopBar title="Teacher Dashboard" />
        
        {/* Back Button */}
        <button
          onClick={() => router.push("/teacher/clubs")}
          className="mb-6 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Clubs
        </button>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">⚙️ Club Settings</h1>
          
          {club && (
            <div className="mb-6 p-4 bg-white/5 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">{club.name}</h2>
              <p className="text-gray-400">Current Members: {club.studentIds?.length || 0}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-600/20 border border-red-600 text-red-400 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-600/20 border border-green-600 text-green-400 p-4 rounded-lg mb-6">
              {success}
            </div>
          )}

          <form onSubmit={handleSave} className="bg-white/10 p-6 rounded-xl border border-white/10">
            <div className="space-y-6">
              {/* Join Type Setting */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Join Method
                </label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="joinType"
                      value="open"
                      checked={joinType === "open"}
                      onChange={(e) => setJoinType(e.target.value)}
                      className="text-blue-600"
                    />
                    <div>
                      <span className="text-white font-medium">Open Join</span>
                      <p className="text-sm text-gray-400">Students can join directly without approval</p>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="joinType"
                      value="request"
                      checked={joinType === "request"}
                      onChange={(e) => setJoinType(e.target.value)}
                      className="text-blue-600"
                    />
                    <div>
                      <span className="text-white font-medium">Request to Join</span>
                      <p className="text-sm text-gray-400">Students must request approval to join</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Join Deadline */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Join Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={joinDeadline}
                  onChange={(e) => setJoinDeadline(e.target.value)}
                  min={formatDate(new Date())}
                  className="w-full p-3 rounded text-black bg-white/90 border border-gray-300 focus:border-blue-500 focus:outline-none"
                />
                <p className="text-sm text-gray-400 mt-1">
                  Students won't be able to join after this date. Leave empty for no deadline.
                </p>
              </div>

              {/* Max Members */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Maximum Members (Optional)
                </label>
                <input
                  type="number"
                  placeholder="e.g., 20"
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(e.target.value)}
                  min="1"
                  className="w-full p-3 rounded text-black bg-white/90 border border-gray-300 focus:border-blue-500 focus:outline-none"
                />
                <p className="text-sm text-gray-400 mt-1">
                  Maximum number of students allowed in the club. Leave empty for no limit.
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Club Description
                </label>
                <textarea
                  placeholder="Describe what this club is about..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded text-black bg-white/90 border border-gray-300 focus:border-blue-500 focus:outline-none h-32 resize-none"
                  required
                />
              </div>

              {/* Save Button */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-3 rounded text-white font-semibold flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Settings
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => router.push("/teacher/clubs")}
                  className="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded text-white font-semibold"
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