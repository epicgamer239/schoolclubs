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
  deleteDoc,
} from "firebase/firestore";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../components/AuthContext";
import DashboardTopBar from "../../../components/DashboardTopBar";

export default function SchoolJoinRequestsPage() {
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState(null);
  const router = useRouter();
  const { userData, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchJoinRequests = async () => {
      if (!userData?.schoolId) return;

      try {
        // Get all pending school join requests for this school
        const requestsQuery = query(
          collection(firestore, "schoolJoinRequests"),
          where("schoolId", "==", userData.schoolId),
          where("status", "==", "pending")
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        
        // Fetch additional details for each request
        const requestsWithDetails = await Promise.all(
          requestsSnapshot.docs.map(async (requestDoc) => {
            const requestData = requestDoc.data();
            
            // Get student details
            const studentDoc = await getDoc(doc(firestore, "users", requestData.studentId));
            const studentData = studentDoc.exists() ? studentDoc.data() : null;
            
            return {
              id: requestDoc.id,
              ...requestData,
              student: studentData ? { id: requestData.studentId, ...studentData } : null,
            };
          })
        );

        // Sort by creation date (newest first)
        const sortedRequests = requestsWithDetails
          .filter(request => request.student) // Only show requests with valid student
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
    if (!confirm(`Approve ${request.studentName}'s request to join the school as a ${request.requestedRole || 'student'}?`)) {
      return;
    }

    setProcessingRequest(requestId);

    try {
      // Update the user's schoolId and role fields
      const updateData = {
        schoolId: request.schoolId,
      };
      
      // If it's a teacher request, also update the role
      if (request.requestedRole === "teacher" || request.type === "teacher") {
        updateData.role = "teacher";
      } else {
        updateData.role = "student";
      }

      await updateDoc(doc(firestore, "users", request.studentId), updateData);

      // Update request status
      await updateDoc(doc(firestore, "schoolJoinRequests", requestId), {
        status: "approved",
        processedAt: new Date(),
        processedBy: userData.uid,
      });

      // Remove from local state
      setJoinRequests(prev => prev.filter(req => req.id !== requestId));

      alert(`${request.studentName} has been approved to join the school as a ${request.requestedRole || 'student'}!`);
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Failed to approve request. Please try again.");
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleReject = async (requestId, request) => {
    if (!confirm(`Reject ${request.studentName}'s request to join the school?`)) {
      return;
    }

    setProcessingRequest(requestId);

    try {
      // Update request status
      await updateDoc(doc(firestore, "schoolJoinRequests", requestId), {
        status: "rejected",
        processedAt: new Date(),
        processedBy: userData.uid,
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

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-background text-foreground">
          <DashboardTopBar title="Admin Dashboard" />
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

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
          
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">School Join Requests</h1>
                <p className="text-muted-foreground mt-2">Review and approve pending student and teacher requests</p>
              </div>
              <button
                onClick={() => router.push("/admin/school")}
                className="btn-outline"
              >
                School Settings
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
              </div>
            ) : joinRequests.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">No Pending Requests</h3>
                <p className="text-muted-foreground">All student and teacher join requests have been processed.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {joinRequests.map((request) => (
                  <div key={request.id} className="card p-6 border-l-4 border-l-primary">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{request.studentName}</h3>
                          <span className="text-sm text-muted-foreground">({request.studentEmail})</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (request.requestedRole === "teacher" || request.type === "teacher") 
                              ? "bg-blue-100 text-blue-800" 
                              : "bg-green-100 text-green-800"
                          }`}>
                            {(request.requestedRole === "teacher" || request.type === "teacher") ? "Teacher" : "Student"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Requested to join school on {formatDate(request.createdAt)}
                        </p>
                        {request.student && (
                          <div className="text-sm text-muted-foreground">
                            <p>Role: {request.student.role || 'Student'}</p>
                            {request.student.grade && <p>Grade: {request.student.grade}</p>}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleApprove(request.id, request)}
                          disabled={processingRequest === request.id}
                          className="btn-primary text-sm px-4 py-2"
                        >
                          {processingRequest === request.id ? "Processing..." : "Approve"}
                        </button>
                        <button
                          onClick={() => handleReject(request.id, request)}
                          disabled={processingRequest === request.id}
                          className="btn-destructive text-sm px-4 py-2"
                        >
                          {processingRequest === request.id ? "Processing..." : "Reject"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 