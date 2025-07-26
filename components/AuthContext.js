"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, firestore } from "@/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { cacheUtils } from "../utils/cache";
import db from "../utils/database";

const AuthContext = createContext();
export { AuthContext };

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log("AuthProvider: Starting auth state listener");
    
    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log("Auth timeout reached, setting loading to false");
      setLoading(false);
      setInitialized(true);
    }, 3000); // Reduced to 3 seconds
    
    let unsubscribe;
    
    try {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log("Auth state changed:", firebaseUser ? `User logged in (${firebaseUser.uid})` : "No user");
        setUser(firebaseUser);
        
        if (firebaseUser) {
          try {
            console.log("Fetching user data for:", firebaseUser.uid);
            
            // Check cache for user data first
            const cachedUser = cacheUtils.getCachedUser(firebaseUser.uid);
            let userData;
            
            if (cachedUser) {
              userData = cachedUser;
              console.log("User data loaded from cache");
            } else {
              // Fetch user data with caching
              userData = await db.getDocument("users", firebaseUser.uid, true);
              console.log("User data fetched from database");
            }
            
            console.log("User data:", userData);
            console.log("User email verified:", firebaseUser.emailVerified);
            console.log("User has role:", !!userData.role);
            
            // Sync photoURL from Firebase Auth if it's different
            if (firebaseUser.photoURL && userData.photoURL !== firebaseUser.photoURL) {
              console.log("Updating photoURL in Firestore");
              console.log("Old photoURL:", userData.photoURL);
              console.log("New photoURL:", firebaseUser.photoURL);
              
              // Modify Google profile picture URL to be more reliable
              let modifiedPhotoURL = firebaseUser.photoURL;
              if (firebaseUser.photoURL.includes('lh3.googleusercontent.com')) {
                // Remove size parameter and use a more reliable format
                modifiedPhotoURL = firebaseUser.photoURL.replace(/=s\d+-c$/, '=s400-c');
                console.log("Modified photoURL:", modifiedPhotoURL);
              }
              
              try {
                await updateDoc(doc(firestore, "users", firebaseUser.uid), {
                  photoURL: modifiedPhotoURL
                });
                userData.photoURL = modifiedPhotoURL;
                console.log("PhotoURL updated successfully");
              } catch (error) {
                console.error("Error updating photoURL:", error);
              }
            }
            
            setUserData(userData);
          } catch (error) {
            console.error("Error fetching user data:", error);
            setUserData(null);
          }
        } else {
          console.log("No user logged in");
          setUserData(null);
        }
        
        console.log("Auth state change complete, setting loading to false");
        setLoading(false);
        setInitialized(true);
        clearTimeout(timeoutId);
      });
    } catch (error) {
      console.error("Error setting up auth state listener:", error);
      setLoading(false);
      setInitialized(true);
      clearTimeout(timeoutId);
    }

    return () => {
      console.log("AuthProvider: Cleaning up auth state listener");
      clearTimeout(timeoutId);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Check email verification status and handle navigation edge cases
  useEffect(() => {
    if (!user || loading) return;

    const currentPath = window.location.pathname;
    
    // Handle unverified users
    if (!user.emailVerified) {
      // Allow access to verification page and auth pages
      const allowedPaths = ['/verify-email', '/login', '/signup', '/welcome'];
      const isAllowedPath = allowedPaths.some(path => currentPath.startsWith(path));
      
      if (!isAllowedPath) {
        console.log("Redirecting unverified user to verify-email page");
        router.push('/verify-email');
      }
      return;
    }

    // Handle verified users without userData (incomplete signup)
    if (user.emailVerified && !userData) {
      // Allow access to role selection and auth pages
      const allowedPaths = ['/signup/role', '/login', '/signup', '/welcome'];
      const isAllowedPath = allowedPaths.some(path => currentPath.startsWith(path));
      
      if (!isAllowedPath) {
        console.log("Redirecting user without userData (incomplete signup) to role selection page");
        router.push('/signup/role');
      }
      return;
    }

    // Handle verified users without roles (incomplete setup)
    if (user.emailVerified && userData && !userData.role) {
      // Allow access to role selection and auth pages
      const allowedPaths = ['/signup/role', '/login', '/signup', '/welcome'];
      const isAllowedPath = allowedPaths.some(path => currentPath.startsWith(path));
      
      if (!isAllowedPath) {
        console.log("Redirecting user without role to role selection page");
        router.push('/signup/role');
      }
      return;
    }

    // Handle verified users with roles (complete setup)
    if (user.emailVerified && userData && userData.role) {
      // Redirect away from auth pages if user is fully set up
      const authPaths = ['/login', '/signup', '/verify-email', '/signup/role'];
      const isAuthPath = authPaths.some(path => currentPath.startsWith(path));
      
      if (isAuthPath) {
        console.log("Redirecting complete user to appropriate dashboard");
        if (userData.role === "admin") {
          router.push("/admin/dashboard");
        } else if (userData.role === "teacher") {
          router.push("/teacher/dashboard");
        } else if (userData.role === "student") {
          router.push("/student/dashboard");
        } else {
          router.push("/welcome");
        }
      }
    }
  }, [user, userData, loading, router]);

  const value = {
    user,
    userData,
    loading: loading || !initialized,
    initialized
  };

  

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 