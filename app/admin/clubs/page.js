"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, firestore } from "../../../firebase";
import {
  getDocs,
  collection,
  query,
  where,
  deleteDoc,
  updateDoc,
  addDoc,
  doc,
  getDoc,
} from "firebase/firestore";

export default function AdminClubManager() {
  const [schoolId, setSchoolId] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [newClub, setNewClub] = useState({ name: "", description: "" });
  const [editingClubId, setEditingClubId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return router.push("/login");

      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      const userData = userDoc.data();

      if (userData?.role !== "admin") return router.push("/");

      setSchoolId(userData.schoolId);

      const q = query(collection(firestore, "clubs"), where("schoolId", "==", userData.schoolId));
      const snap = await getDocs(q);
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setClubs(list);
      setFiltered(list);
    };

    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this club?")) return;
    await deleteDoc(doc(firestore, "clubs", id));
    setClubs((prev) => prev.filter((c) => c.id !== id));
    setFiltered((prev) => prev.filter((c) => c.id !== id));
  };

  const handleEdit = (id) => {
    setEditingClubId(id);
  };

  const handleSaveEdit = async (id, name, description) => {
    await updateDoc(doc(firestore, "clubs", id), { name, description });
    setEditingClubId(null);
    setClubs((prev) =>
      prev.map((club) => (club.id === id ? { ...club, name, description } : club))
    );
    setFiltered((prev) =>
      prev.map((club) => (club.id === id ? { ...club, name, description } : club))
    );
  };

  const handleSearch = (text) => {
    setSearch(text);
    setFiltered(clubs.filter((c) => c.name.toLowerCase().includes(text.toLowerCase())));
  };

  const handleCreate = async () => {
    if (!newClub.name || !newClub.description) return;
    const docRef = await addDoc(collection(firestore, "clubs"), {
      ...newClub,
      schoolId,
      teacherId: "admin", // you can change this
      studentIds: [],
      createdAt: Date.now(),
    });
    const clubObj = { id: docRef.id, ...newClub };
    setClubs([clubObj, ...clubs]);
    setFiltered([clubObj, ...filtered]);
    setNewClub({ name: "", description: "" });
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white p-6">
      <h1 className="text-3xl font-bold mb-6">📘 Manage Clubs</h1>

      {/* Create New Club */}
      <div className="bg-white/10 p-4 rounded-lg mb-6 space-y-2 max-w-xl">
        <h2 className="text-lg font-semibold">➕ Create New Club</h2>
        <input
          placeholder="Club Name"
          value={newClub.name}
          onChange={(e) => setNewClub((prev) => ({ ...prev, name: e.target.value }))}
          className="w-full p-2 rounded text-black"
        />
        <textarea
          placeholder="Description"
          value={newClub.description}
          onChange={(e) => setNewClub((prev) => ({ ...prev, description: e.target.value }))}
          className="w-full p-2 rounded text-black"
        />
        <button onClick={handleCreate} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white">
          Create Club
        </button>
      </div>

      {/* Search */}
      <input
        placeholder="Search clubs..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        className="mb-4 p-2 rounded text-black w-full max-w-md"
      />

      {/* Club List */}
      <div className="space-y-4">
        {filtered.map((club) => (
          <div key={club.id} className="bg-white/10 p-4 rounded-xl shadow-md">
            {editingClubId === club.id ? (
              <div className="space-y-2">
                <input
                  value={club.name}
                  onChange={(e) =>
                    setFiltered((prev) =>
                      prev.map((c) => (c.id === club.id ? { ...c, name: e.target.value } : c))
                    )
                  }
                  className="w-full p-2 rounded text-black"
                />
                <textarea
                  value={club.description}
                  onChange={(e) =>
                    setFiltered((prev) =>
                      prev.map((c) => (c.id === club.id ? { ...c, description: e.target.value } : c))
                    )
                  }
                  className="w-full p-2 rounded text-black"
                />
                <button
                  onClick={() => handleSaveEdit(club.id, club.name, club.description)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-1 rounded text-white mt-1"
                >
                  Save
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold">{club.name}</h2>
                <p className="text-sm text-gray-300 mb-2">{club.description}</p>
                <div className="flex gap-4 mt-2">
                  <button
                    onClick={() => handleEdit(club.id)}
                    className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(club.id)}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => router.push(`/admin/clubs/${club.id}`)}
                    className="bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded text-white"
                  >
                    View Members
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
