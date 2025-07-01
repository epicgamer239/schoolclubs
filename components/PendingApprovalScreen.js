"use client";
import { useEffect, useState } from "react";
import { firestore } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "./AuthContext";

export default function PendingApprovalScreen() {
  const [joinRequest, setJoinRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userData } = useAuth();

  useEffect(() => {
    const checkJoinRequest = async () => {
      if (!userData?.uid) return;

      try {
        // Check for pending join requests
        const requestsQuery = query(
          collection(firestore, "schoolJoinRequests"),
          where("studentId", "==", userData.uid),
          where("status", "==", "pending")
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        
        if (!requestsSnapshot.empty) {
          const request = requestsSnapshot.docs[0].data();
          setJoinRequest(request);
        }
      } catch (error) {
        console.error("Error checking join request:", error);
      } finally {
        setLoading(false);
      }
    };

    checkJoinRequest();
  }, [userData]);

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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted text-foreground flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="card p-8 text-center">
          <div className="text-6xl mb-6">⏳</div>
          <h1 className="text-2xl font-bold mb-4">Pending Approval</h1>
          
          {joinRequest ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Your request to join the school as a <strong>{joinRequest.requestedRole || 'student'}</strong> has been submitted and is pending administrator approval.
              </p>
              
              <div className="bg-muted/50 p-4 rounded-lg text-sm">
                <p className="text-muted-foreground mb-2">Request Details:</p>
                <p><strong>Email:</strong> {joinRequest.studentEmail}</p>
                <p><strong>Role:</strong> {joinRequest.requestedRole || 'Student'}</p>
                <p><strong>Submitted:</strong> {formatDate(joinRequest.createdAt)}</p>
              </div>
              
              <p className="text-sm text-muted-foreground">
                You will be able to access the platform once your request is approved by a school administrator.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                You don't have access to any school yet. Please contact your school administrator to get access.
              </p>
            </div>
          )}
          
          <div className="mt-8 pt-6 border-t border-border">
            <button
              onClick={() => window.location.href = "/signup"}
              className="btn-outline w-full"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 