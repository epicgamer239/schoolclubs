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
  arrayUnion,
  getDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../components/AuthContext";
import DashboardTopBar from "../../../components/DashboardTopBar";
import Image from "next/image";

export default function StudentExploreClubs() {
  const [clubs, setClubs] = useState([]);
  const [userClubs, setUserClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClub, setSelectedClub] = useState(null);
  const [clubDetails, setClubDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [joiningClub, setJoiningClub] = useState(null);
  const router = useRouter();
  const { userData } = useAuth();

  useEffect(() => {
    const fetchClubs = async () => {
      if (!userData?.schoolId) return;

      try {
        // Get all clubs in the student's school
        const clubsQuery = query(
          collection(firestore, "clubs"),
          where("schoolId", "==", userData.schoolId)
        );
        const clubsSnapshot = await getDocs(clubsQuery);
        const clubsList = clubsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Separate joined and available clubs
        const userClubIds = userData.clubIds || [];
        const joined = clubsList.filter((club) => userClubIds.includes(club.id));
        const available = clubsList.filter((club) => !userClubIds.includes(club.id));

        setClubs(available);
        setUserClubs(joined);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching clubs:", error);
        setLoading(false);
      }
    };

    if (userData) {
      fetchClubs();
    }
  }, [userData]);

  const fetchClubDetails = async (club) => {
    setLoadingDetails(true);
    setSelectedClub(club);
    
    try {
      // Fetch teacher information
      let teacherInfo = null;
      if (club.teacherId) {
        const teacherDoc = await getDoc(doc(firestore, "users", club.teacherId));
        if (teacherDoc.exists()) {
          teacherInfo = teacherDoc.data();
        }
      }

      // Fetch all students in the club
      let studentsInfo = [];
      if (club.studentIds && club.studentIds.length > 0) {
        const studentsPromises = club.studentIds.map(async (studentId) => {
          const studentDoc = await getDoc(doc(firestore, "users", studentId));
          if (studentDoc.exists()) {
            return { id: studentId, ...studentDoc.data() };
          }
          return null;
        });
        
        const studentsResults = await Promise.all(studentsPromises);
        studentsInfo = studentsResults.filter(student => student !== null);
      }

      setClubDetails({
        teacher: teacherInfo,
        students: studentsInfo,
      });
    } catch (error) {
      console.error("Error fetching club details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const canJoinClub = (club) => {
    // Check if club is at max capacity
    if (club.maxMembers && club.studentIds && club.studentIds.length >= club.maxMembers) {
      return { canJoin: false, reason: "Club is at maximum capacity" };
    }

    // Check if join deadline has passed
    if (club.joinDeadline) {
      const deadline = new Date(club.joinDeadline);
      const now = new Date();
      if (now > deadline) {
        return { canJoin: false, reason: "Join deadline has passed" };
      }
    }

    return { canJoin: true };
  };

  const handleJoinClub = async (clubId) => {
    if (!userData) return;

    const club = clubs.find(c => c.id === clubId);
    const joinCheck = canJoinClub(club);
    
    if (!joinCheck.canJoin) {
      alert(joinCheck.reason);
      return;
    }

    setJoiningClub(clubId);

    try {
      if (club.joinType === "request") {
        // Create join request
        await addDoc(collection(firestore, "joinRequests"), {
          clubId,
          studentId: userData.uid,
          studentName: userData.displayName || userData.email,
          studentEmail: userData.email,
          status: "pending", // pending, approved, rejected
          createdAt: serverTimestamp(),
        });
        
        alert("Join request sent! The teacher will review your request.");
      } else {
        // Direct join
        await updateDoc(doc(firestore, "users", userData.uid), {
          clubIds: arrayUnion(clubId),
        });

        await updateDoc(doc(firestore, "clubs", clubId), {
          studentIds: arrayUnion(userData.uid),
        });

        // Move club from available to joined
        const joiningClub = clubs.find((club) => club.id === clubId);
        setClubs((prev) => prev.filter((club) => club.id !== clubId));
        setUserClubs((prev) => [...prev, joiningClub]);

        // Update club details if this club is currently selected
        if (selectedClub && selectedClub.id === clubId) {
          const updatedClub = { ...joiningClub, studentIds: [...(joiningClub.studentIds || []), userData.uid] };
          setSelectedClub(updatedClub);
          setClubDetails(prev => ({
            ...prev,
            students: [...(prev?.students || []), { id: userData.uid, ...userData }]
          }));
        }

        alert("Successfully joined the club!");
      }
    } catch (error) {
      console.error("Error joining club:", error);
      alert("Failed to join club. Please try again.");
    } finally {
      setJoiningClub(null);
    }
  };

  const handleViewClubDetails = (club) => {
    fetchClubDetails(club);
  };

  const closeClubDetails = () => {
    setSelectedClub(null);
    setClubDetails(null);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString();
    }
    return new Date(timestamp).toLocaleDateString();
  };

  const getJoinButtonText = (club) => {
    if (joiningClub === club.id) {
      return "Joining...";
    }
    
    const joinCheck = canJoinClub(club);
    if (!joinCheck.canJoin) {
      return "Cannot Join";
    }
    
    return club.joinType === "request" ? "Request to Join" : "Join Club";
  };

  const getJoinButtonClass = (club) => {
    if (joiningClub === club.id) {
      return "bg-muted cursor-not-allowed";
    }
    
    const joinCheck = canJoinClub(club);
    if (!joinCheck.canJoin) {
      return "bg-muted cursor-not-allowed";
    }
    
    return club.joinType === "request" ? "btn-warning" : "btn-primary";
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="student">
        <div className="min-h-screen bg-gradient-to-br from-background to-muted text-foreground flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground font-medium">Loading clubs...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="student">
      <div className="min-h-screen bg-gradient-to-br from-background to-muted text-foreground p-6">
        <DashboardTopBar title="Student Dashboard" />
        
        {/* Back Button */}
        <button
          onClick={() => router.push("/student/dashboard")}
          className="mb-6 bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-lg text-white font-semibold flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
        
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">🌟 Explore Clubs</h1>

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : clubs.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-6xl mb-4">🌟</div>
              <h3 className="text-xl font-semibold mb-2">No Available Clubs</h3>
              <p className="text-muted-foreground">No clubs are available to join at your school.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clubs.map((club) => {
                const joinCheck = canJoinClub(club);
                const isAtCapacity = club.maxMembers && club.studentIds && club.studentIds.length >= club.maxMembers;
                const isPastDeadline = club.joinDeadline && new Date() > new Date(club.joinDeadline);
                
                return (
                  <div key={club.id} className="card p-6 hover:shadow-lg transition-all duration-200">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-foreground">{club.name}</h3>
                      <div className="flex flex-col items-end space-y-1">
                        {/* Join Type Badge */}
                        <span className={`badge ${
                          club.joinType === "request" 
                            ? "badge-warning" 
                            : "badge-primary"
                        }`}>
                          {club.joinType === "request" ? "Request Required" : "Open Join"}
                        </span>
                        
                        {/* Status Badges */}
                        {isAtCapacity && (
                          <span className="badge badge-destructive">
                            Full
                          </span>
                        )}
                        {isPastDeadline && (
                          <span className="badge badge-destructive">
                            Closed
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground mb-4 line-clamp-2">{club.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Members:</span>
                        <span className="text-foreground font-medium">
                          {club.studentIds?.length || 0}
                          {club.maxMembers && ` / ${club.maxMembers}`}
                        </span>
                      </div>
                      
                      {club.joinDeadline && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Join Deadline:</span>
                          <span className={`${isPastDeadline ? 'text-destructive' : 'text-foreground'}`}>
                            {new Date(club.joinDeadline).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewClubDetails(club)}
                        className="btn-outline flex-1"
                      >
                        View Details
                      </button>
                      
                      <button
                        onClick={() => handleJoinClub(club.id)}
                        disabled={!joinCheck.canJoin || joiningClub === club.id}
                        className={`flex-1 ${getJoinButtonClass(club)}`}
                        title={!joinCheck.canJoin ? joinCheck.reason : ""}
                      >
                        {getJoinButtonText(club)}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Club Details Modal */}
          {selectedClub && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-background rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-foreground">{selectedClub.name}</h2>
                  <button
                    onClick={closeClubDetails}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {loadingDetails ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Club Description */}
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Description</h3>
                      <p className="text-muted-foreground">{selectedClub.description}</p>
                    </div>
                    
                    {/* Club Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="card p-3">
                        <h3 className="font-semibold text-muted-foreground mb-1 text-sm">Members</h3>
                        <p className="text-foreground text-lg font-bold">{selectedClub.studentIds?.length || 0}</p>
                      </div>
                      <div className="card p-3">
                        <h3 className="font-semibold text-muted-foreground mb-1 text-sm">Created</h3>
                        <p className="text-foreground text-sm">{formatDate(selectedClub.createdAt)}</p>
                      </div>
                      <div className="card p-3">
                        <h3 className="font-semibold text-muted-foreground mb-1 text-sm">Join Type</h3>
                        <p className="text-foreground text-sm">
                          {selectedClub.joinType === "request" ? "Request Required" : "Open Join"}
                        </p>
                      </div>
                      <div className="card p-3">
                        <h3 className="font-semibold text-muted-foreground mb-1 text-sm">Status</h3>
                        <p className="text-foreground text-sm">
                          {userClubs.some(c => c.id === selectedClub.id) ? "✅ Joined" : "🌟 Available"}
                        </p>
                      </div>
                    </div>

                    {/* Join Deadline Warning */}
                    {selectedClub.joinDeadline && (
                      <div className={`p-3 rounded-lg ${
                        new Date() > new Date(selectedClub.joinDeadline) 
                          ? "bg-destructive/10 border border-destructive/20" 
                          : "bg-warning/10 border border-warning/20"
                      }`}>
                        <p className="text-sm">
                          <strong>Join Deadline:</strong> {new Date(selectedClub.joinDeadline).toLocaleDateString()}
                          {new Date() > new Date(selectedClub.joinDeadline) && " (Deadline has passed)"}
                        </p>
                      </div>
                    )}

                    {/* Teacher Sponsor */}
                    {clubDetails?.teacher && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-3">👨‍🏫 Teacher Sponsor</h3>
                        <div className="card p-4">
                          <div className="flex items-center space-x-3">
                            {clubDetails.teacher.photoURL ? (
                              <Image
                                src={clubDetails.teacher.photoURL}
                                alt="Teacher"
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-full border-2 border-border"
                                unoptimized
                              />
                            ) : (
                              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                                {(clubDetails.teacher.displayName || "?").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-foreground font-semibold">
                                {clubDetails.teacher.displayName || clubDetails.teacher.name || "Unknown Teacher"}
                              </p>
                              <p className="text-muted-foreground text-sm">
                                {clubDetails.teacher.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Students List */}
                    {clubDetails?.students && clubDetails.students.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-3">👥 Current Members ({clubDetails.students.length})</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                          {clubDetails.students.map((student) => (
                            <div key={student.id} className="card p-3">
                              <div className="flex items-center space-x-3">
                                {student.photoURL ? (
                                  <Image
                                    src={student.photoURL}
                                    alt="Student"
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 rounded-full border border-border"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xs">
                                    {(student.displayName || "?").charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <p className="text-foreground text-sm font-medium">
                                    {student.displayName || student.email}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Join Button */}
                    {!userClubs.some(c => c.id === selectedClub.id) && (
                      <div className="flex gap-3 pt-4 border-t border-border">
                        <button
                          onClick={() => handleJoinClub(selectedClub.id)}
                          disabled={!canJoinClub(selectedClub).canJoin || joiningClub === selectedClub.id}
                          className={`flex-1 ${getJoinButtonClass(selectedClub)}`}
                          title={!canJoinClub(selectedClub).canJoin ? canJoinClub(selectedClub).reason : ""}
                        >
                          {getJoinButtonText(selectedClub)}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 