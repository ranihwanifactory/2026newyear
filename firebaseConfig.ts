
// Fix: Using standard modular Firebase SDK components for v9+
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDFgGnY4UR2HmBihj-uJYs33gLctaxrJ00",
  authDomain: "korpol-4eb9a.firebaseapp.com",
  projectId: "korpol-4eb9a",
  storageBucket: "korpol-4eb9a.firebasestorage.app",
  messagingSenderId: "1047092230990",
  appId: "1:1047092230990:web:257a0b31ab4da08cbd3c1f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;