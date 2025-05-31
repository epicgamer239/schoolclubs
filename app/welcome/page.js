// File: app/page.js

"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0D1B2A] via-[#1e2746] to-[#111b32] text-white flex flex-col">
      {/* ──── NAVBAR ────────────────────────────────────────────────────────────── */}
      <header className="w-full py-6 px-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">StudyHub</h1>
        <nav className="space-x-4">
          <Link
            href="/login"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition font-medium"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg transition font-medium"
          >
            Sign Up
          </Link>
        </nav>
      </header>

      {/* ──── HERO SECTION ──────────────────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col justify-center items-center text-center px-6">
        <h2 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight">
          Empower Your School’s <br />
          <span className="text-teal-400">Clubs & Communities</span>
        </h2>
        <p className="max-w-2xl text-gray-300 mb-8 text-lg">
          Join, create, and manage clubs seamlessly. Whether you’re a student, teacher, or admin,
          StudyHub provides a one-stop platform to connect, collaborate, and thrive together.
        </p>
        <div className="flex space-x-4">
          <Link
            href="/signup"
            className="px-6 py-3 bg-teal-500 hover:bg-teal-600 rounded-lg text-white font-semibold transition"
          >
            Get Started
          </Link>
          <Link
            href="/student/clubs"
            className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg text-white font-semibold transition"
          >
            Explore Clubs
          </Link>
        </div>
      </section>

      {/* ──── FEATURES SECTION ──────────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <h3 className="text-3xl font-bold text-center mb-12">Platform Highlights</h3>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature Card 1 */}
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-lg flex flex-col items-center text-center">
            <div className="bg-teal-500 p-4 rounded-full mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2a9.93 9.93 0 00-7.07 2.93A10 10 0 1012 2zm0 18a8 8 0 118-8 8.009 8.009 0 01-8 8z" />
                <path d="M12 6a6 6 0 100 12 6 6 0 000-12zm0 10a4 4 0 114-4 4.005 4.005 0 01-4 4z" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-2">Centralized Club Management</h4>
            <p className="text-gray-300">
              Admins and teachers can create, edit, and organize clubs in one place—no more scattered spreadsheets.
            </p>
          </div>

          {/* Feature Card 2 */}
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-lg flex flex-col items-center text-center">
            <div className="bg-teal-500 p-4 rounded-full mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 7a5 5 0 105 5 5.006 5.006 0 00-5-5zm0 8a3 3 0 113-3 3.003 3.003 0 01-3 3z" />
                <path d="M17 19a9 9 0 10-10 0v1h10z" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-2">Seamless Member Collaboration</h4>
            <p className="text-gray-300">
              Students can browse, join, and leave clubs with a single click. Stay connected with your community.
            </p>
          </div>

          {/* Feature Card 3 */}
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-lg flex flex-col items-center text-center">
            <div className="bg-teal-500 p-4 rounded-full mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 3H5a2 2 0 00-2 2v14l4-4h12a2 2 0 002-2V5a2 2 0 00-2-2z" />
                <path d="M7 9h10v2H7zm0 4h7v2H7z" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-2">Instant Messaging & Updates</h4>
            <p className="text-gray-300">
              Club leaders can send announcements and messages to members—keep everyone on the same page.
            </p>
          </div>
        </div>
      </section>

      {/* ──── CALL-TO-ACTION BANNER ─────────────────────────────────────────────── */}
      <section className="bg-white/10 backdrop-blur-sm py-16 px-6 text-center rounded-t-3xl">
        <h3 className="text-3xl font-bold mb-4">Ready to Elevate Your School Experience?</h3>
        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
          Whether you’re leading a club or just looking to discover new groups, StudyHub has you covered. Join hundreds
          of students and staff who are already enjoying seamless club management.
        </p>
        <Link
          href="/signup"
          className="px-8 py-4 bg-teal-500 hover:bg-teal-600 rounded-xl text-white font-semibold text-lg transition"
        >
          Get Started for Free
        </Link>
      </section>

      {/* ──── FOOTER ──────────────────────────────────────────────────────────────── */}
      <footer className="bg-[#111b32] py-6 text-center text-gray-400">
        <p>© {new Date().getFullYear()} StudyHub. All rights reserved.</p>
        <div className="mt-2 space-x-4">
          <Link href="/privacy" className="hover:text-white transition">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-white transition">
            Terms of Service
          </Link>
        </div>
      </footer>
    </main>
  );
}
