"use client";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "./AuthContext";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export default function DashboardTopBar({ title = "StudyHub" }) {
  const { userData } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Redirect to welcome page after successful logout
      router.push("/welcome");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Debug logging
  useEffect(() => {
    if (userData) {
      console.log("DashboardTopBar - userData:", userData);
      console.log("DashboardTopBar - photoURL:", userData.photoURL);
      setImageError(false); // Reset error state when userData changes
    }
  }, [userData]);

  return (
    <header className="bg-background border-b border-border px-6 py-4 mb-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <Image
              src="/logo.png"
              alt="StudyHub Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>
          
          {/* Admin Navigation Links */}
          {userData?.role === "admin" && (
            <nav className="flex space-x-6">
              <Link
                href="/admin/dashboard"
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/clubs"
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
              >
                Manage Clubs
              </Link>
              <Link
                href="/admin/students"
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
              >
                Students
              </Link>
            </nav>
          )}

          {/* Student Navigation Links */}
          {userData?.role === "student" && (
            <nav className="flex space-x-6">
              <Link
                href="/student/dashboard"
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/student/explore-clubs"
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
              >
                Explore Clubs
              </Link>
            </nav>
          )}

          {/* Teacher Navigation Links */}
          {userData?.role === "teacher" && (
            <nav className="flex space-x-6">
              <Link
                href="/teacher/dashboard"
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/teacher/clubs"
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
              >
                My Clubs
              </Link>
              <Link
                href="/teacher/create-club"
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
              >
                Create Club
              </Link>
            </nav>
          )}
        </div>

        {userData && (
          <div className="flex items-center space-x-4">
            {/* Calendar Icon */}
            <button
              onClick={() => router.push("/calendar")}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="View Calendar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="text-right">
                  <div className="text-sm font-medium text-left">{userData.displayName || userData.email}</div>
                  <div className="text-xs text-muted-foreground capitalize">{userData.role}</div>
                </div>
                
                {/* Profile Picture */}
                {userData.photoURL && !imageError ? (
                  <img
                    src={userData.photoURL}
                    alt="Profile"
                    className="w-8 h-8 rounded-full border border-border"
                    onLoad={() => {
                      // Profile loaded successfully
                    }}
                    onError={() => {
                      setImageError(true);
                    }}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold border border-border">
                    {getInitials(userData.displayName || userData.email)}
                  </div>
                )}
                
                {/* Dropdown Arrow */}
                <svg
                  className={`w-4 h-4 text-muted-foreground transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b border-border">
                      <div className="text-sm font-medium">{userData.displayName || userData.email}</div>
                      <div className="text-xs text-muted-foreground capitalize">{userData.role}</div>
                    </div>
                    
                    <Link
                      href="/settings"
                      className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </Link>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
