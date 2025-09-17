import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, sendEmailVerification, fetchSignInMethodsForEmail } from "firebase/auth";
import { getFirestore, enableNetwork, disableNetwork, connectFirestoreEmulator, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBzq-f8k6Ul2TnG7qGM-Trnufx-pzXEHj4",
  authDomain: "clubs-39030.firebaseapp.com",
  projectId: "clubs-39030",
  storageBucket: "clubs-39030.firebasestorage.app",
  messagingSenderId: "209554226350",
  appId: "1:209554226350:web:b65b5185f413efec31c13f",
  measurementId: "G-MK6H5C9KC0"
};

const app = initializeApp(firebaseConfig);

// Only initialize analytics on the client side
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const firestore = getFirestore(app);

// Enable Firestore offline persistence for better caching
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(firestore).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all features required for persistence
      console.warn('Firestore persistence failed: Browser not supported');
    }
  });
}

export { auth, provider, firestore, createUserWithEmailAndPassword, sendEmailVerification, fetchSignInMethodsForEmail, analytics };
export default app;
