import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';

const VITE_FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;

const firebaseConfig = {
  apiKey: VITE_FIREBASE_API_KEY,
  authDomain: "mindvault-58de1.firebaseapp.com",
  projectId: "mindvault-58de1",
  storageBucket: "mindvault-58de1.firebasestorage.app",
  messagingSenderId: "736388504307",
  appId: "1:736388504307:web:5f900bba7b7dab0086f586",
  measurementId: "G-3RHWKYCYK8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup, onAuthStateChanged, signOut };