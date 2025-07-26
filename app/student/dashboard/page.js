"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import { firestore } from "@/firebase";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../components/AuthContext";
import DashboardTopBar from "../../../components/DashboardTopBar";
import { useModal } from "../../../utils/useModal";
import db from "../../../utils/database";
import { cacheUtils } from "../../../utils/cache";

export default function StudentDashboard() {
  const [clubs, setClubs] = useState([]);
  const [allClubs, setAllClubs] = useState([]);
  const [clubTags, setClubTags] = useState({});
  const router = useRouter();
  const { userData } = useAuth();
  const { modalState, showConfirm, showAlert, closeModal, handleConfirm } = useModal();

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!userData) return;

      const userClubIds = userData.clubIds || [];

      // Check cache for clubs first
      const cachedClubs = cacheUtils.getCachedClubs(userData.schoolId);
      let clubList = [];
      
      if (cachedClubs) {
        clubList = cachedClubs;
      } else {
        // Fetch clubs with caching
        const clubsSnap = await db.getDocuments("clubs", {
          whereClauses: [{ field: "schoolId", operator: "==", value: userData.schoolId }],
          useCache: true
        });
        clubList = clubsSnap.documents;
      }

      const joined = clubList.filter((c) => userClubIds.includes(c.id));
      const available = clubList.filter((c) => !userClubIds.includes(c.id));

      // Fetch tags for all clubs with caching
      const tagsMap = {};
      
      for (const club of clubList) {
        if (club.tagIds && club.tagIds.length > 0) {
          // Check cache for tags first
          const cachedTags = cacheUtils.getCachedTags(club.tagIds);
          if (cachedTags) {
            tagsMap[club.id] = cachedTags;
          } else {
            // Fetch tags with caching
            const tagsSnap = await db.getDocuments("tags", {
              whereClauses: [{ field: "__name__", operator: "in", value: club.tagIds }],
              useCache: true
            });
            const tags = tagsSnap.documents;
            tagsMap[club.id] = tags;
            
            // Cache the tags
            cacheUtils.cacheTags(club.tagIds, tags);
          }
        } else {
          tagsMap[club.id] = [];
        }
      }
      
      setClubTags(tagsMap);
      setClubs(joined);
      setAllClubs(available);
    };

    fetchStudentData();
  }, [userData]);

  const handleLeave = async (clubId) => {
    showConfirm("Leave Club", "Are you sure you want to leave this club?", async () => {
      const updatedClubs = clubs.filter((c) => c.id !== clubId);
      const leavingClub = clubs.find((c) => c.id === clubId);

      await updateDoc(doc(firestore, "users", userData.uid), {
        clubIds: arrayRemove(clubId),
      });
      await updateDoc(doc(firestore, "clubs", clubId), {
        studentIds: arrayRemove(userData.uid),
      });

      setClubs(updatedClubs);
      setAllClubs((prev) => [leavingClub, ...prev]);
    });
  };

  const handleJoin = async (clubId) => {
    // Check if already a member
    if (clubs.some(c => c.id === clubId)) {
      showAlert("Already a Member", "You are already a member of this club.");
      return;
    }

    const joiningClub = allClubs.find((c) => c.id === clubId);

    try {
      await updateDoc(doc(firestore, "users", userData.uid), {
        clubIds: arrayUnion(clubId),
      });
      await updateDoc(doc(firestore, "clubs", clubId), {
        studentIds: arrayUnion(userData.uid),
      });

      setClubs((prev) => [...prev, joiningClub]);
      setAllClubs((prev) => prev.filter((c) => c.id !== clubId));
    } catch (error) {
      console.error("Error joining club:", error);
      showAlert("Join Failed", "Failed to join club. Please try again.");
    }
  };

  const handleClubClick = (clubId) => {
    router.push(`/student/clubs/${clubId}`);
  };

  return (
    <ProtectedRoute requiredRole="student">
      <div className="min-h-screen bg-background text-foreground">
        <DashboardTopBar title="Student Dashboard" />

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage your club memberships and discover new opportunities</p>
          </div>
          
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">My Clubs</h2>
            {clubs.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">No Clubs Yet</h3>
                <p className="text-muted-foreground mb-4">You're not in any clubs yet.</p>
                <p className="text-sm text-muted-foreground">
                  Browse available clubs below to get started.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubs.map((club) => (
                  <div 
                    key={club.id} 
                    className="card p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => handleClubClick(club.id)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-foreground">{club.name}</h3>
                      {club.leaderId === userData?.uid && (
                        <span className="badge-primary">
                          Leader
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{club.description}</p>
                    
                    {/* Tags */}
                    {clubTags[club.id] && clubTags[club.id].length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {clubTags[club.id].map((tag) => (
                          <Tag key={tag.id} tag={tag} />
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {club.studentIds?.length || 0} members
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLeave(club.id);
                        }}
                        className="btn-destructive text-sm"
                      >
                        Leave Club
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-6">Available Clubs</h2>
            {allClubs.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">No Available Clubs</h3>
                <p className="text-muted-foreground">No other clubs available at your school.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allClubs.map((club) => (
                  <div key={club.id} className="card p-6 hover:shadow-lg transition-shadow group">
                    <h3 className="text-lg font-semibold text-foreground mb-2">{club.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{club.description}</p>
                    
                    {/* Tags */}
                    {clubTags[club.id] && clubTags[club.id].length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {clubTags[club.id].map((tag) => (
                          <Tag key={tag.id} tag={tag} />
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {club.studentIds?.length || 0} members
                      </span>
                      <button
                        onClick={() => handleJoin(club.id)}
                        className="btn-primary text-sm"
                      >
                        Join Club
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={handleConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />
    </ProtectedRoute>
  );
}