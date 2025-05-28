// --- SignupPage (pages/signup/page.js) ---
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, provider, firestore } from "../../firebase";
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
        schoolIds: [],
        clubIds: [],
        createdAt: serverTimestamp(),
      });

      if (role === "admin") router.push("/admin/dashboard");
      else if (role === "teacher") router.push("/join-school");
      else router.push("/student/dashboard");
    } catch (err) {
      console.error("Google signup error", err);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#0D1B2A] via-[#1e2746] to-[#111b32] text-[#F7F7FF]">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-lg text-center">
        <h1 className="text-3xl font-bold mb-6 font-poppins">Sign Up</h1>
        {error && <p className="text-red-400 mb-4">{error}</p>}

        <div className="mb-6 text-left">
          <label className="block mb-2 font-semibold">Select your role:</label>
          <select
            className="w-full p-3 rounded bg-white/10 text-white"
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
          className="w-full py-3 bg-white text-[#0D1B2A] rounded-lg flex justify-center items-center gap-2 hover:bg-gray-100 transition"
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