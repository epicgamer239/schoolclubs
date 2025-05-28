"use client";
import { useEffect, useState } from "react";
import { auth, firestore } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function DashboardTopBar({ title = "StudyHub" }) {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      setUserData({
        name: user.displayName || user.email,
        photo: user.photoURL,
        role: userDoc.data()?.role || "unknown",
      });
    };

    fetchUser();
  }, []);

  return (
    <header className="bg-white/10 backdrop-blur-md text-white px-6 py-4 flex justify-between items-center shadow-lg mb-8 rounded-xl border border-white/10">
      <h1 className="text-2xl font-bold">{title}</h1>

      {userData && (
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm font-semibold">{userData.name}</div>
            <div className="text-xs text-gray-300 capitalize">{userData.role}</div>
          </div>
          {userData.photo && (
            <img
              src={userData.photo}
              alt="Profile"
              className="w-10 h-10 rounded-full border-2 border-white"
            />
          )}
        </div>
      )}
    </header>
  );
}
