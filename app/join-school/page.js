"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { firestore } from "@/firebase";
import { doc, getDocs, collection, query, where, updateDoc, addDoc } from "firebase/firestore";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../components/AuthContext";
import DashboardTopBar from "../../components/DashboardTopBar";

export default function JoinSchoolPage() {
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { userData } = useAuth();

  const handleJoin = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    if (!joinCode.trim()) {
      setError("Please enter a join code.");
      setLoading(false);
      return;
    }

    try {
      // Search for school with either student or teacher join code
      const studentQuery = query(collection(firestore, "schools"), where("studentJoinCode", "==", joinCode.toUpperCase()));
      const teacherQuery = query(collection(firestore, "schools"), where("teacherJoinCode", "==", joinCode.toUpperCase()));
      
      const [studentSnapshot, teacherSnapshot] = await Promise.all([
        getDocs(studentQuery),
        getDocs(teacherQuery)
      ]);

      let schoolDoc = null;
      let joinType = null;
      let userRole = null;

      if (!studentSnapshot.empty) {
        schoolDoc = studentSnapshot.docs[0];
        joinType = "student";
        userRole = "student";
      } else if (!teacherSnapshot.empty) {
        schoolDoc = teacherSnapshot.docs[0];
        joinType = "teacher";
        userRole = "teacher";
      } else {
        setError("Invalid join code. Please check your code and try again.");
        setLoading(false);
        return;
      }

      const schoolData = schoolDoc.data();
      const schoolId = schoolDoc.id;

      // Check if manual approval is required
      const joinTypeSetting = joinType === "student" ? schoolData.studentJoinType : schoolData.teacherJoinType;
      
      if (joinTypeSetting === "manual") {
        // Create a school join request
        await addDoc(collection(firestore, "schoolJoinRequests"), {
          studentId: userData.uid,
          schoolId: schoolId,
          studentName: userData.name || userData.email,
          studentEmail: userData.email,
          status: "pending",
          createdAt: new Date(),
          type: joinType,
          requestedRole: userRole
        });

        setSuccess(`Your request to join the school as a ${userRole} has been submitted and is pending admin approval. You will be notified once your request is processed.`);
        setJoinCode("");
      } else {
        // Immediate join (code-based)
        await updateDoc(doc(firestore, "users", userData.uid), {
          role: userRole,
          schoolId,
        });

        setSuccess(`Successfully joined the school as a ${userRole}!`);
        setTimeout(() => {
          router.push(`/${userRole}/dashboard`);
        }, 2000);
      }
    } catch (err) {
      console.error("Join school error:", err);
      setError("An error occurred while joining the school. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted text-foreground p-6">
        <DashboardTopBar title="Join School" />
        
        <div className="max-w-md mx-auto mt-8">
          <h1 className="text-3xl font-bold mb-8 text-center">🏫 Join Your School</h1>
          
          <div className="card p-8 space-y-6">
            <div>
              <label htmlFor="joinCode" className="block text-sm font-semibold mb-3 text-foreground">
                School Join Code
              </label>
              <input
                id="joinCode"
                type="text"
                placeholder="Enter your school's join code"
                className="input uppercase"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Enter your student or teacher join code provided by your school administrator.
              </p>
            </div>
            
            <button
              onClick={handleJoin}
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? "Processing..." : "Join School"}
            </button>
            
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                <p className="text-destructive text-sm font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-600/10 border border-green-600/20 rounded-xl">
                <p className="text-green-600 text-sm font-medium">{success}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}