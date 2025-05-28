"use client";
import { useEffect, useState } from "react";
import { auth, firestore } from "../../../firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function CreateClubPage() {
  const [clubName, setClubName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [schoolId, setSchoolId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return router.push("/login");

      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      const data = userDoc.data();

      if (!data || !["teacher", "admin"].includes(data.role)) {
        return router.push("/login");
      }

      if (!data.schoolId) {
        setError("You must be joined to a school to create a club.");
      } else {
        setSchoolId(data.schoolId);
      }
    };

    fetchUserData();
  }, []);

  const handleCreate = async () => {
    setError("");

    if (!clubName.trim() || !description.trim()) {
      setError("Both club name and description are required.");
      return;
    }

    try {
      const user = auth.currentUser;

      await addDoc(collection(firestore, "clubs"), {
        name: clubName.trim(),
        description: description.trim(),
        schoolId,
        teacherId: user.uid,
        studentIds: [],
        createdAt: serverTimestamp(),
      });

      alert("Club created successfully!");
      router.push("/teacher/dashboard");
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white p-8">
      <h1 className="text-3xl font-bold mb-6">📘 Create a Club</h1>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      <div className="max-w-lg bg-white/5 p-6 rounded-xl space-y-4">
        <input
          type="text"
          placeholder="Club Name"
          className="w-full p-3 rounded text-black"
          value={clubName}
          onChange={(e) => setClubName(e.target.value)}
        />
        <textarea
          placeholder="Club Description"
          className="w-full p-3 rounded text-black h-32"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button
          onClick={handleCreate}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded"
        >
          Create Club
        </button>
      </div>
    </div>
  );
}
