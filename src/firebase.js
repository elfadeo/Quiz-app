// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your actual configuration
const firebaseConfig = {
  apiKey: "AIzaSyB3tBhExB2M4ZNyIvVarfprVS_hLG229JA",
  authDomain: "quiz-app-a1168.firebaseapp.com",
  projectId: "quiz-app-a1168",
  storageBucket: "quiz-app-a1168.firebasestorage.app",
  messagingSenderId: "935420381424",
  appId: "1:935420381424:web:73f6f53fc32a0b60419a35",
  measurementId: "G-NX08KLN859"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export the Database (Firestore)
export const db = getFirestore(app);