"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "../../../firebase";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState(null);
  const [schoolName, setSchoolName] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      const userData = userDoc.data();

      if (userData?.role !== "teacher") {
        alert("Access denied. Admins only.");
        router.push("/");
        return;
      }

      if (userData.schoolId) {
        const schoolDoc = await getDoc(doc(firestore, "schools", userData.schoolId));
        setSchool(schoolDoc.data());
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
    }, { merge: true });

    setSchool(schoolData);
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white p-8">
      <h1 className="text-3xl font-bold mb-6">🏫 Admin Dashboard</h1>

      {school ? (
        <>
          <div className="bg-white/5 p-6 rounded shadow max-w-md">
            <p><strong>School:</strong> {school.name}</p>
            <p className="mt-2">
              <strong>Teacher Join Code:</strong>{" "}
              <code className="bg-black/30 p-1 rounded">{school.joinCode}</code>
            </p>
          </div>

          <button
            onClick={() => router.push("/student/clubs")}
            className="mt-6 bg-white text-[#0D1B2A] hover:bg-gray-200 px-4 py-2 rounded font-semibold"
          >
            👀 View as Student
          </button>
        </>
      ) : (
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
      )}
    </div>
  );
}
