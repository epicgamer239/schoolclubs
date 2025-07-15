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
      <div className="min-h-screen bg-background text-foreground">
        <DashboardTopBar title="Admin Dashboard" />
        
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>

          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Manage Clubs</h1>
              <p className="text-muted-foreground mt-2">View and manage all clubs in your school</p>
            </div>
            <button
              onClick={() => router.push("/admin/clubs/create")}
              className="btn-primary"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Club
            </button>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
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
                {search && <span className="badge-primary">{search}</span>}
                {memberFilter !== "all" && (
                  <span className="badge-secondary">
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
              <div className="card p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">No Clubs Found</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
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
                          <span className="badge-primary">
                            {club.studentIds?.length || 0} members
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEdit(club.id)}
                          className="btn-outline"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => router.push(`/admin/clubs/${club.id}`)}
                          className="btn-primary"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          View Members
                        </button>
                        <button
                          onClick={() => handleDelete(club.id)}
                          className="btn-destructive"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
