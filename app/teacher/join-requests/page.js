"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { firestore } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  deleteDoc,
} from "firebase/firestore";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../components/AuthContext";
import DashboardTopBar from "../../../components/DashboardTopBar";
import Image from "next/image";

export default function JoinRequestsPage() {
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState(null);
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchJoinRequests = async () => {
      if (!userData?.uid) return;

      try {
        // Get all clubs owned by this teacher
        const clubsQuery = query(
          collection(firestore, "clubs"),
          where("teacherId", "==", userData.uid)
        );
        const clubsSnapshot = await getDocs(clubsQuery);
        const clubIds = clubsSnapshot.docs.map(doc => doc.id);

        if (clubIds.length === 0) {
          setJoinRequests([]);
          setLoading(false);
          return;
        }

        // Get all join requests for these clubs
        const requestsQuery = query(
          collection(firestore, "joinRequests"),
          where("clubId", "in", clubIds),
          where("status", "==", "pending")
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        
        // Fetch additional details for each request
        const requestsWithDetails = await Promise.all(
          requestsSnapshot.docs.map(async (requestDoc) => {
            const requestData = requestDoc.data();
            
            // Get club details
            const clubDoc = await getDoc(doc(firestore, "clubs", requestData.clubId));
            const clubData = clubDoc.exists() ? clubDoc.data() : null;
            
            // Get student details
            const studentDoc = await getDoc(doc(firestore, "users", requestData.studentId));
            const studentData = studentDoc.exists() ? studentDoc.data() : null;
            
            return {
              id: requestDoc.id,
              ...requestData,
              club: clubData ? { id: requestData.clubId, ...clubData } : null,
              student: studentData ? { id: requestData.studentId, ...studentData } : null,
            };
          })
        );

        // Sort by creation date (newest first)
        const sortedRequests = requestsWithDetails
          .filter(request => request.club && request.student) // Only show requests with valid club and student
          .sort((a, b) => {
            if (a.createdAt && b.createdAt) {
              return b.createdAt.toDate() - a.createdAt.toDate();
            }
            return 0;
          });

        setJoinRequests(sortedRequests);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching join requests:", error);
        setLoading(false);
      }
    };

    if (!authLoading && userData) {
      fetchJoinRequests();
    }
  }, [userData, authLoading]);

  const handleApprove = async (requestId, request) => {
    if (!confirm(`Approve ${request.studentName}'s request to join "${request.club.name}"?`)) {
      return;
    }

    setProcessingRequest(requestId);

    try {
      // Add student to club
      await updateDoc(doc(firestore, "clubs", request.clubId), {
        studentIds: arrayUnion(request.studentId)
      });

      // Add club to student's clubIds
      await updateDoc(doc(firestore, "users", request.studentId), {
        clubIds: arrayUnion(request.clubId)
      });

      // Update request status
      await updateDoc(doc(firestore, "joinRequests", requestId), {
        status: "approved",
        processedAt: new Date(),
      });

      // Remove from local state
      setJoinRequests(prev => prev.filter(req => req.id !== requestId));

      alert(`${request.studentName} has been approved to join ${request.club.name}!`);
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Failed to approve request. Please try again.");
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleReject = async (requestId, request) => {
    if (!confirm(`Reject ${request.studentName}'s request to join "${request.club.name}"?`)) {
      return;
    }

    setProcessingRequest(requestId);

    try {
      // Update request status
      await updateDoc(doc(firestore, "joinRequests", requestId), {
        status: "rejected",
        processedAt: new Date(),
      });

      // Remove from local state
      setJoinRequests(prev => prev.filter(req => req.id !== requestId));

      alert(`${request.studentName}'s request has been rejected.`);
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject request. Please try again.");
    } finally {
      setProcessingRequest(null);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleString();
    }
    return new Date(timestamp).toLocaleString();
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
        
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">📝 Join Requests</h1>
            <button
              onClick={() => router.push("/teacher/clubs")}
              className="btn-outline"
            >
              Back to Clubs
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : joinRequests.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h2 className="text-xl font-semibold mb-2">No Pending Requests</h2>
              <p className="text-muted-foreground">You don't have any pending join requests at the moment.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {joinRequests.map((request) => (
                <div key={request.id} className="card p-6 border border-border/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        {request.student?.photoURL ? (
                          <Image
                            src={request.student.photoURL}
                            alt="Student"
                            className="w-12 h-12 rounded-full border-2 border-border"
                            width={48}
                            height={48}
                            unoptimized
                          />
                        ) : (
                          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                            {(request.studentName || "?").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{request.studentName}</h3>
                          <p className="text-muted-foreground text-sm">{request.studentEmail}</p>
                          <p className="text-muted-foreground text-xs">
                            Requested on {formatDate(request.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
                        <h4 className="font-semibold mb-3 text-foreground">Requesting to join:</h4>
                        <div className="space-y-2">
                          <p><strong className="text-foreground">Club:</strong> <span className="text-muted-foreground">{request.club.name}</span></p>
                          <p><strong className="text-foreground">Description:</strong> <span className="text-muted-foreground">{request.club.description}</span></p>
                          <p><strong className="text-foreground">Current Members:</strong> <span className="text-muted-foreground">{request.club.studentIds?.length || 0}</span></p>
                          {request.club.maxMembers && (
                            <p><strong className="text-foreground">Max Members:</strong> <span className="text-muted-foreground">{request.club.maxMembers}</span></p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3 ml-6">
                      <button
                        onClick={() => handleApprove(request.id, request)}
                        disabled={processingRequest === request.id}
                        className="btn-success"
                      >
                        {processingRequest === request.id ? "Processing..." : "✅ Approve"}
                      </button>
                      
                      <button
                        onClick={() => handleReject(request.id, request)}
                        disabled={processingRequest === request.id}
                        className="btn-destructive"
                      >
                        {processingRequest === request.id ? "Processing..." : "❌ Reject"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 