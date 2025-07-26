// firebase.js
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBzq-f8k6Ul2TnG7qGM-Trnufx-pzXEHj4",
  authDomain: "clubs-39030.firebaseapp.com",
  projectId: "clubs-39030",
  storageBucket: "clubs-39030.firebasestorage.app",
  messagingSenderId: "209554226350",
  appId: "1:209554226350:web:b65b5185f413efec31c13f",
  measurementId: "G-MK6H5C9KC0"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const firestore = getFirestore(app);
const storage = getStorage(app);

// Set local persistence so the user stays logged in after refresh
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Firebase Auth Persistence Error:", error);
});

export { auth, provider, firestore, storage, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail };
