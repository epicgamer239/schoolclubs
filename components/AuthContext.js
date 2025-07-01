"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, firestore } from "@/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log("Auth timeout reached, setting loading to false");
      setLoading(false);
    }, 5000); // 5 second timeout

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser ? "User logged in" : "No user");
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          console.log("Fetching user data for:", firebaseUser.uid);
          const userDoc = await getDoc(doc(firestore, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = { ...userDoc.data(), uid: firebaseUser.uid };
            console.log("User data fetched:", userData);
            
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
            } else {
              console.log("PhotoURL sync check:", {
                firebasePhotoURL: firebaseUser.photoURL,
                firestorePhotoURL: userData.photoURL,
                needsUpdate: firebaseUser.photoURL && userData.photoURL !== firebaseUser.photoURL
              });
            }
            
            setUserData(userData);
          } else {
            console.log("User document does not exist");
            setUserData(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData(null);
        }
      } else {
        console.log("No user, setting userData to null");
        setUserData(null);
      }
      
      console.log("Setting loading to false");
      setLoading(false);
      clearTimeout(timeoutId);
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const value = {
    user,
    userData,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 