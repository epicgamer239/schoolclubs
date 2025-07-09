"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { firestore } from "@/firebase";
import {
  getDocs,
  collection,
  query,
  where,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../components/AuthContext";
import DashboardTopBar from "../../../components/DashboardTopBar";

export default function AdminClubManager() {
  const [clubs, setClubs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState("all");
  const [editingClubId, setEditingClubId] = useState(null);
  const router = useRouter();
  const { userData, loading } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.schoolId) return;

      const q = query(collection(firestore, "clubs"), where("schoolId", "==", userData.schoolId));
      const snap = await getDocs(q);
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setClubs(list);
      setFiltered(list);
    };

    if (!loading && userData) {
    fetchData();
    }
  }, [userData, loading]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this club?")) return;
    await deleteDoc(doc(firestore, "clubs", id));
    setClubs((prev) => prev.filter((c) => c.id !== id));
    setFiltered((prev) => prev.filter((c) => c.id !== id));
  };

  const handleEdit = (id) => {
    setEditingClubId(id);
  };

  const handleSaveEdit = async (id, name, description) => {
    await updateDoc(doc(firestore, "clubs", id), { name, description });
    setEditingClubId(null);
    setClubs((prev) =>
      prev.map((club) => (club.id === id ? { ...club, name, description } : club))
    );
    setFiltered((prev) =>
      prev.map((club) => (club.id === id ? { ...club, name, description } : club))
    );
  };

  const applyFilters = (text, memberCountFilter) => {
    let filteredClubs = clubs;

    // Apply text search
    if (text) {
      filteredClubs = filteredClubs.filter((c) => 
        c.name.toLowerCase().includes(text.toLowerCase())
      );
    }

    // Apply member count filter
    if (memberCountFilter !== "all") {
      filteredClubs = filteredClubs.filter((club) => {
        const memberCount = club.studentIds?.length || 0;
        switch (memberCountFilter) {
          case "0":
            return memberCount === 0;
          case "1-5":
            return memberCount >= 1 && memberCount <= 5;
          case "6-10":
            return memberCount >= 6 && memberCount <= 10;
          case "11-20":
            return memberCount >= 11 && memberCount <= 20;
          case "20+":
            return memberCount > 20;
          default:
            return true;
        }
      });
    }

    setFiltered(filteredClubs);
  };

  const handleSearch = (text) => {
    setSearch(text);
    applyFilters(text, memberFilter);
  };

  const handleMemberFilter = (filter) => {
    setMemberFilter(filter);
    applyFilters(search, filter);
  };

  return (
    <ProtectedRoute requiredRole="admin">
    <div className="min-h-screen bg-gradient-to-br from-background to-muted text-foreground p-6">
        <DashboardTopBar title="Admin Dashboard" />
        
        {/* Back Button */}
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="mb-6 bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-lg text-white font-semibold flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">📘 Manage Clubs</h1>
          <button
            onClick={() => router.push("/admin/clubs/create")}
            className="btn-primary"
          >
            ➕ Create Club
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              placeholder="Search clubs..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="input w-full"
            />
          </div>
          <div className="md:w-64">
            <select
              value={memberFilter}
              onChange={(e) => handleMemberFilter(e.target.value)}
              className="input w-full"
            >
              <option value="all">All member counts</option>
              <option value="0">0 members</option>
              <option value="1-5">1-5 members</option>
              <option value="6-10">6-10 members</option>
              <option value="11-20">11-20 members</option>
              <option value="20+">20+ members</option>
            </select>
          </div>
        </div>
        
        {/* Filter Summary */}
        {(search || memberFilter !== "all") && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Filtered results:</span>
            {search && <span className="badge badge-primary">{search}</span>}
            {memberFilter !== "all" && (
              <span className="badge badge-secondary">
                {memberFilter === "0" ? "0 members" : 
                 memberFilter === "1-5" ? "1-5 members" :
                 memberFilter === "6-10" ? "6-10 members" :
                 memberFilter === "11-20" ? "11-20 members" :
                 "20+ members"}
              </span>
            )}
            <button
              onClick={() => {
                setSearch("");
                setMemberFilter("all");
                setFiltered(clubs);
              }}
              className="text-primary hover:text-primary/80 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Club List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">No Clubs Found</h3>
            <p className="text-muted-foreground mb-4">
              {search || memberFilter !== "all" 
                ? `No clubs match your current filters.` 
                : "No clubs have been created yet."}
            </p>
            {(search || memberFilter !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setMemberFilter("all");
                  setFiltered(clubs);
                }}
                className="btn-primary"
              >
                Clear Filters
              </button>
            )}
            {!search && memberFilter === "all" && (
              <button
                onClick={() => router.push("/admin/clubs/create")}
                className="btn-primary"
              >
                Create Your First Club
              </button>
            )}
          </div>
        ) : (
          filtered.map((club) => (
            <div key={club.id} className="card p-6 hover:shadow-lg transition-shadow">
              {editingClubId === club.id ? (
                <div className="space-y-4">
                  <input
                    value={club.name}
                    onChange={(e) =>
                      setFiltered((prev) =>
                        prev.map((c) => (c.id === club.id ? { ...c, name: e.target.value } : c))
                      )
                    }
                    className="input"
                    placeholder="Club name"
                  />
                  <textarea
                    value={club.description}
                    onChange={(e) =>
                      setFiltered((prev) =>
                        prev.map((c) => (c.id === club.id ? { ...c, description: e.target.value } : c))
                      )
                    }
                    className="input h-24 resize-none"
                    placeholder="Club description"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(club.id, club.name, club.description)}
                      className="btn-primary"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditingClubId(null)}
                      className="btn-outline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{club.name}</h2>
                      <p className="text-muted-foreground mt-1">{club.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-primary">
                        {club.studentIds?.length || 0} members
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEdit(club.id)}
                      className="btn-outline"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => router.push(`/admin/clubs/${club.id}`)}
                      className="btn-primary"
                    >
                      👥 View Members
                    </button>
                    <button
                      onClick={() => handleDelete(club.id)}
                      className="btn-destructive"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
}
