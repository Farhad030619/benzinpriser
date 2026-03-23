import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "REDACTED_FIREBASE_KEY",
  authDomain: "benzin-pris.firebaseapp.com",
  projectId: "benzin-pris",
  storageBucket: "benzin-pris.firebasestorage.app",
  messagingSenderId: "549035037738",
  appId: "1:549035037738:web:17260205db40417c2c1f53"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
