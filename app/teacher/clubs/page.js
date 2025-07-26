"use client";
import { useEffect, useState } from "react";
import { firestore } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../components/AuthContext";
import DashboardTopBar from "../../../components/DashboardTopBar";
import Tag from "../../../components/Tag";
import Modal from "../../../components/Modal";
import { useModal } from "../../../utils/useModal";
import Image from "next/image";
import db from "../../../utils/database";
import { cacheUtils, globalCache } from "../../../utils/cache";

export default function TeacherClubsPage() {
  const [clubs, setClubs] = useState([]);
  const [clubDetails, setClubDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState({});
  const [clubTags, setClubTags] = useState({});
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();
  const { modalState, showConfirm, showAlert, closeModal, handleConfirm } = useModal();

  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.uid) return;

      // Check cache for teacher's clubs first
      const cacheKey = `teacherClubs:${userData.uid}`;
      const cachedClubs = globalCache.get(cacheKey);
      
      if (cachedClubs) {
        setClubs(cachedClubs.clubs);
        setClubTags(cachedClubs.tags);
        setLoading(false);
        return;
      }

      // Fetch clubs with caching
      const clubsSnap = await db.getDocuments("clubs", {
        whereClauses: [{ field: "teacherId", operator: "==", value: userData.uid }],
        useCache: true
      });
      const results = clubsSnap.documents;

      // Fetch tags for all clubs with caching
      const tagsMap = {};
      
      for (const club of results) {
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
      
      // Cache the clubs and tags data
      globalCache.set(cacheKey, { clubs: results, tags: tagsMap }, 300); // 5 minutes
      
      setClubTags(tagsMap);
      setClubs(results);
      setLoading(false);
    };

    if (!authLoading && userData) {
      fetchData();
    }
  }, [userData, authLoading]);

  const fetchClubDetails = async (clubId) => {
    if (clubDetails[clubId]) return; // Already loaded

    setLoadingDetails(prev => ({ ...prev, [clubId]: true }));
    
    try {
      const club = clubs.find(c => c.id === clubId);
      if (!club || !club.studentIds || club.studentIds.length === 0) {
        setClubDetails(prev => ({ ...prev, [clubId]: { students: [] } }));
        setLoadingDetails(prev => ({ ...prev, [clubId]: false }));
        return;
      }

      // Check cache for club details first
      const cacheKey = `clubDetails:${clubId}`;
      const cachedDetails = globalCache.get(cacheKey);
      
      if (cachedDetails) {
        setClubDetails(prev => ({ ...prev, [clubId]: cachedDetails }));
        setLoadingDetails(prev => ({ ...prev, [clubId]: false }));
        return;
      }

      // Fetch all students in the club with caching
      const studentsPromises = club.studentIds.map(async (studentId) => {
        // Check cache for user data first
        const cachedUser = cacheUtils.getCachedUser(studentId);
        if (cachedUser) {
          return cachedUser;
        }
        
        // Fetch user data with caching
        const userData = await db.getDocument("users", studentId, true);
        return userData;
      });
      
      const studentsResults = await Promise.all(studentsPromises);
      const students = studentsResults.filter(student => student !== null);
      
      // Cache the club details
      globalCache.set(cacheKey, { students }, 300); // 5 minutes

      setClubDetails(prev => ({ ...prev, [clubId]: { students } }));
    } catch (error) {
      console.error("Error fetching club details:", error);
    } finally {
      setLoadingDetails(prev => ({ ...prev, [clubId]: false }));
    }
  };

  const handleKickStudent = async (clubId, studentId, studentName) => {
    showConfirm(
      "Remove Student",
      `Are you sure you want to remove ${studentName} from this club?`,
      async () => {
        try {
          // Remove student from club
          await updateDoc(doc(firestore, "clubs", clubId), {
            studentIds: arrayRemove(studentId)
          });

          // Remove club from student's clubIds
          await updateDoc(doc(firestore, "users", studentId), {
            clubIds: arrayRemove(clubId)
          });

          // Update local state
          setClubs(prev => prev.map(club => 
            club.id === clubId 
              ? { ...club, studentIds: club.studentIds.filter(id => id !== studentId) }
              : club
          ));

          // Update club details
          setClubDetails(prev => ({
            ...prev,
            [clubId]: {
              students: prev[clubId]?.students.filter(student => student.id !== studentId) || []
            }
          }));

          showAlert("Success", `${studentName} has been removed from the club.`);
        } catch (error) {
          console.error("Error kicking student:", error);
          showAlert("Error", "Failed to remove student from club. Please try again.");
        }
      }
    );
  };

  return (
    <ProtectedRoute requiredRole="teacher">
      <div className="min-h-screen bg-background text-foreground">
        <DashboardTopBar title="Teacher Dashboard" />
        
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.push("/teacher/dashboard")}
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Your Clubs</h1>
            <p className="text-muted-foreground mt-2">Manage your clubs and view member details</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : clubs.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">No Clubs Yet</h3>
              <p className="text-muted-foreground mb-6">You haven't created any clubs yet.</p>
              <button
                onClick={() => router.push("/teacher/create-club")}
                className="btn-primary"
              >
                Create Your First Club
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {clubs.map((club) => (
                <div key={club.id} className="card p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{club.name}</h2>
                      <p className="text-muted-foreground mt-2">{club.description}</p>
                      
                      {/* Tags */}
                      {clubTags[club.id] && clubTags[club.id].length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {clubTags[club.id].map((tag) => (
                            <Tag key={tag.id} tag={tag} />
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 mt-3">
                        <span className="badge-primary">
                          {club.studentIds?.length || 0} members
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => router.push(`/teacher/clubs/${club.id}`)}
                        className="btn-primary"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Club
                      </button>
                      <button
                        onClick={() => router.push(`/teacher/clubs/${club.id}/settings`)}
                        className="btn-outline"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </button>
                      <button
                        onClick={() => fetchClubDetails(club.id)}
                        className="btn-outline"
                      >
                        {clubDetails[club.id] ? "Hide Members" : "View Members"}
                      </button>
                    </div>
                  </div>

                  {/* Student Details Section */}
                  {clubDetails[club.id] && (
                    <div className="mt-6 border-t border-border pt-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Club Members
                      </h3>
                      
                      {loadingDetails[club.id] ? (
                        <div className="flex justify-center items-center h-16">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                        </div>
                      ) : clubDetails[club.id].students.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <p className="text-muted-foreground">No students have joined this club yet.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {clubDetails[club.id].students.map((student) => (
                            <div key={student.id} className="card p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    {student.photoURL ? (
                                      <Image
                                        src={student.photoURL}
                                        crossOrigin="anonymous"
                                        alt="Student"
                                        width={40}
                                        height={40}
                                        className="w-10 h-10 rounded-full border-2 border-border"
                                        unoptimized
                                      />
                                    ) : (
                                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                                        {(student.displayName || student.email || "?").charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div>
                                      <p className="text-foreground font-medium">
                                        {student.displayName || student.email}
                                      </p>
                                      <p className="text-muted-foreground text-sm">
                                        {student.email}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleKickStudent(
                                    club.id, 
                                    student.id, 
                                    student.displayName || student.email
                                  )}
                                  className="btn-destructive text-sm ml-2"
                                  title="Remove from club"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal */}
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
