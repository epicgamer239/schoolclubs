// ✅ Combined and updated AdminDashboard and SignupPage with clean logic and safe defaults

// --- AdminDashboard (pages/admin/dashboard/page.js) ---
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, firestore } from "@firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc, getDoc, setDoc, collection,
  getDocs, query, where
} from "firebase/firestore";
import DashboardTopBar from "../../../components/DashboardTopBar";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState(null);
  const [schoolName, setSchoolName] = useState("");
  const [stats, setStats] = useState({ students: 0, teachers: 0, clubs: 0 });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push("/login");

      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      const userData = userDoc.data();
      if (userData?.role !== "admin") return router.push("/");

      if (userData.schoolId) {
        const schoolDoc = await getDoc(doc(firestore, "schools", userData.schoolId));
        setSchool({ id: userData.schoolId, ...schoolDoc.data() });

        const usersRef = collection(firestore, "users");
        const clubsRef = collection(firestore, "clubs");

        const [studentsSnap, teachersSnap, clubsSnap] = await Promise.all([
          getDocs(query(usersRef, where("schoolId", "==", userData.schoolId), where("role", "==", "student"))),
          getDocs(query(usersRef, where("schoolId", "==", userData.schoolId), where("role", "==", "teacher"))),
          getDocs(query(clubsRef, where("schoolId", "==", userData.schoolId)))
        ]);

        setStats({
          students: studentsSnap.size,
          teachers: teachersSnap.size,
          clubs: clubsSnap.size,
        });
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateSchool = async () => {
    const user = auth.currentUser;
    if (!user || !schoolName.trim()) return;

    const schoolId = crypto.randomUUID().slice(0, 8);
    const schoolData = {
      name: schoolName,
      joinCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdBy: user.uid,
      createdAt: Date.now(),
    };

    await setDoc(doc(firestore, "schools", schoolId), schoolData);
    await setDoc(doc(firestore, "users", user.uid), {
      ...schoolData,
      schoolId,
      role: "admin",
      clubIds: [],
    }, { merge: true });

    setSchool({ id: schoolId, ...schoolData });
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white p-6">
      <DashboardTopBar title="Admin Dashboard" />
      <h1 className="text-3xl font-bold mb-6">🏫 Admin Dashboard</h1>

      {!school ? (
        <div className="bg-white/5 p-6 rounded shadow max-w-md">
          <label className="block mb-2 font-semibold">Create your school:</label>
          <input
            type="text"
            className="w-full p-2 rounded text-black"
            placeholder="School Name"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
          />
          <button
            onClick={handleCreateSchool}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded text-white"
          >
            Create School
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white/10 border border-white/10 rounded-xl p-6 max-w-3xl mb-8 shadow-md">
            <p className="text-lg font-bold">📛 {school.name}</p>
            <p className="mt-2 text-sm text-gray-300">
              <strong>Teacher Join Code:</strong>{" "}
              <code className="bg-black/40 p-1 rounded">{school.joinCode}</code>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mb-10">
            <div className="bg-white/10 rounded-xl p-6 shadow-md text-center">
              <h2 className="text-xl font-semibold mb-1">👩‍🎓 Students</h2>
              <p className="text-3xl font-bold">{stats.students}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-6 shadow-md text-center">
              <h2 className="text-xl font-semibold mb-1">👨‍🏫 Teachers</h2>
              <p className="text-3xl font-bold">{stats.teachers}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-6 shadow-md text-center">
              <h2 className="text-xl font-semibold mb-1">📘 Clubs</h2>
              <p className="text-3xl font-bold">{stats.clubs}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-4">
            <button
              onClick={() => router.push("/admin/clubs")}
              className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-white rounded-xl shadow font-semibold"
            >
              🛠️ Manage Clubs
            </button>

            <button
              onClick={() => router.push("/student/clubs")}
              className="bg-white text-[#0D1B2A] hover:bg-gray-200 px-4 py-2 rounded font-semibold"
            >
              👀 View as Student
            </button>
          </div>
        </>
      )}
    </div>
  );
}