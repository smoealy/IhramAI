// firebase/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCZLugtBQK8eSKdoS2wcZlzxQQ8G2g-yR8",
  authDomain: "ihram-ai.firebaseapp.com",
  projectId: "ihram-ai",
  storageBucket: "ihram-ai.firebasestorage.app",
  messagingSenderId: "486268863536",
  appId: "1:486268863536:web:35f62a29794ab934f519f5",
  measurementId: "G-Y9DZ0332T4"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Sign in anonymously when Firebase loads
signInAnonymously(auth).catch(console.error);
