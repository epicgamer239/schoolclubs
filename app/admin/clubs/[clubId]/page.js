"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, firestore } from "@firebase";
import {
  doc,
  getDoc,
  updateDoc,
  getDocs,
  collection,
  where,
  query,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";

export default function ClubMembersPage() {
  const { clubId } = useParams();
  const router = useRouter();
  const [club, setClub] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClubAndMembers = async () => {
      const user = auth.currentUser;
      if (!user) return router.push("/login");

      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      const userData = userDoc.data();
      if (userData.role !== "admin") return router.push("/");

      const clubDoc = await getDoc(doc(firestore, "clubs", clubId));
      const clubData = clubDoc.data();
      setClub({ id: clubDoc.id, ...clubData });

      // Get student details
      const studentIds = Array.isArray(clubData.studentIds) ? clubData.studentIds : [];
      const studentQuery = query(
        collection(firestore, "users"),
        where("uid", "in", studentIds)
      );

      const studentSnap = await getDocs(studentQuery);
      const studentList = studentSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setStudents(studentList);
      setLoading(false);
    };

    fetchClubAndMembers();
  }, [clubId]);

  const handleRemove = async (studentId) => {
    if (!confirm("Remove this student from the club?")) return;

    await updateDoc(doc(firestore, "clubs", clubId), {
      studentIds: arrayRemove(studentId),
    });

    await updateDoc(doc(firestore, "users", studentId), {
      clubIds: arrayRemove(clubId),
    });

    setStudents((prev) => prev.filter((s) => s.uid !== studentId));
  };

  const handlePromote = async (studentId) => {
    await updateDoc(doc(firestore, "clubs", clubId), {
      leaderId: studentId,
    });
    setClub((prev) => ({ ...prev, leaderId: studentId }));
  };

  if (loading) return <div className="p-6 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white p-6">
      <h1 className="text-3xl font-bold mb-4">👥 Club Members</h1>
      <p className="text-lg mb-4">Club: <strong>{club.name}</strong></p>

      {students.length === 0 ? (
        <p>No students in this club yet.</p>
      ) : (
        <div className="space-y-4">
          {students.map((student) => (
            <div
              key={student.uid}
              className="bg-white/10 p-4 rounded-xl shadow-md flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{student.displayName || student.email}</p>
                <p className="text-xs text-gray-300">{student.email}</p>
                {club.leaderId === student.uid && (
                  <p className="text-green-400 text-sm mt-1">🌟 Leader</p>
                )}
              </div>
              <div className="flex gap-2">
                {club.leaderId !== student.uid && (
                  <button
                    onClick={() => handlePromote(student.uid)}
                    className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded text-white text-sm"
                  >
                    Promote to Leader
                  </button>
                )}
                <button
                  onClick={() => alert("Messaging feature coming soon")}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white text-sm"
                >
                  Message
                </button>
                <button
                  onClick={() => handleRemove(student.uid)}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
