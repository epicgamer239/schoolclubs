"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, provider, firestore } from "@firebase";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function SignupPage() {
  const [role, setRole] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleGoogleSignup = async () => {
    if (!role) return setError("Please select a role before signing up.");

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = doc(firestore, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const existing = userSnap.data();
        return router.push(`/${existing.role}/dashboard`);
      }

      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
        role,
        schoolId: null,
        clubIds: [],
        createdAt: serverTimestamp(),
      });

      if (role === "admin") router.push("/admin/dashboard");
      else if (role === "teacher") router.push("/join-school");
      else router.push("/student/join-school");
    } catch (err) {
      console.error("Google signup error", err);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#F9F9F9] via-[#DCEEFF] to-[#A9D6E5] text-[#0D1B2A]">
      <div className="max-w-md w-full bg-white shadow-lg p-8 rounded-2xl border border-gray-200 text-center">
        <h1 className="text-3xl font-bold mb-6 font-poppins">Sign Up</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="mb-6 text-left">
          <label className="block mb-2 font-semibold">Select your role:</label>
          <select
            className="w-full p-3 rounded border border-gray-300"
            value={role}
            onChange={(e) => { setRole(e.target.value); setError(null); }}
          >
            <option value="">-- Choose a role --</option>
            <option value="admin">School Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
        </div>

        <button
          onClick={handleGoogleSignup}
          className="w-full py-3 bg-[#0D1B2A] text-white rounded-lg flex justify-center items-center gap-2 hover:bg-[#1e2746] transition"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google logo"
            className="w-5 h-5"
          />
          Continue with Google
        </button>
      </div>
    </div>
  );
}
