"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, firestore } from "@/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { secureLog, secureError } from "@/utils/logger";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      secureLog("Auth timeout reached, setting loading to false");
      setLoading(false);
      setInitialized(true);
    }, 5000); // 5 second timeout

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      secureLog("Auth state changed:", firebaseUser ? "User logged in" : "No user");
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          secureLog("Fetching user data for:", firebaseUser.uid);
          const userDoc = await getDoc(doc(firestore, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = { ...userDoc.data(), uid: firebaseUser.uid };
            secureLog("User data fetched:", userData);
            
            // Sync photoURL from Firebase Auth if it's different
            if (firebaseUser.photoURL && userData.photoURL !== firebaseUser.photoURL) {
              secureLog("Updating photoURL in Firestore");
              secureLog("Old photoURL:", userData.photoURL);
              secureLog("New photoURL:", firebaseUser.photoURL);
              
              // Modify Google profile picture URL to be more reliable
              let modifiedPhotoURL = firebaseUser.photoURL;
              if (firebaseUser.photoURL.includes('lh3.googleusercontent.com')) {
                // Remove size parameter and use a more reliable format
                modifiedPhotoURL = firebaseUser.photoURL.replace(/=s\d+-c$/, '=s400-c');
                secureLog("Modified photoURL:", modifiedPhotoURL);
              }
              
              try {
                await updateDoc(doc(firestore, "users", firebaseUser.uid), {
                  photoURL: modifiedPhotoURL
                });
                userData.photoURL = modifiedPhotoURL;
                secureLog("PhotoURL updated successfully");
              } catch (error) {
                secureError("Error updating photoURL:", error);
              }
            } else {
              secureLog("PhotoURL sync check:", {
                firebasePhotoURL: firebaseUser.photoURL,
                firestorePhotoURL: userData.photoURL,
                needsUpdate: firebaseUser.photoURL && userData.photoURL !== firebaseUser.photoURL
              });
            }
            
            setUserData(userData);
          } else {
            secureLog("User document does not exist");
            setUserData(null);
          }
        } catch (error) {
          secureError("Error fetching user data:", error);
          setUserData(null);
        }
      } else {
        secureLog("No user logged in");
        setUserData(null);
      }
      
      setLoading(false);
      setInitialized(true);
      clearTimeout(timeoutId);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

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