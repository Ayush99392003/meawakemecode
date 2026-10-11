import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import type { Analytics } from "firebase/analytics";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBs6Hp-7fEo7xwHU7S3HkEn3p-LelaJtBU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "meawakemecode-8a35b.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "meawakemecode-8a35b",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "meawakemecode-8a35b.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "577622195531",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:577622195531:web:967a25fcda6ccf1b26bcce",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-42ZTKQ8BVQ",
};

// Initialize Firebase App singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Safe Analytics Loader for client-side
let analyticsInstance: Analytics | null = null;
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window !== "undefined" && !analyticsInstance) {
    const { getAnalytics, isSupported } = await import("firebase/analytics");
    if (await isSupported()) {
      analyticsInstance = getAnalytics(app);
    }
  }
  return analyticsInstance;
}

