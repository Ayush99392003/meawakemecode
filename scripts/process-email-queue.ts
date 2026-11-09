import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  sendBadgeNotification,
  sendTrashWarningNotification,
  sendToughLoveNotification,
  sendWelcomeNotification,
} from "../dist/services/dispatcher.js";

const firebaseConfig = {
  apiKey: "AIzaSyBs6Hp-7fEo7xwHU7S3HkEn3p-LelaJtBU",
  authDomain: "meawakemecode-8a35b.firebaseapp.com",
  projectId: "meawakemecode-8a35b",
  storageBucket: "meawakemecode-8a35b.firebasestorage.app",
  messagingSenderId: "577622195531",
  appId: "1:577622195531:web:967a25fcda6ccf1b26bcce",
  measurementId: "G-42ZTKQ8BVQ",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function processQueue() {
  console.log("[Email Worker] Polling `email_requests` collection in Firestore...");
  const queueRef = collection(db, "email_requests");
  const q = query(queueRef, where("status", "==", "pending"));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    console.log("[Email Worker] No pending email requests.");
    return;
  }

  console.log(`[Email Worker] Found ${snapshot.size} pending email request(s).`);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const docRef = doc(db, "email_requests", docSnap.id);
    const to = data.to;
    const type = data.type;
    const payload = data.payload || {};

    console.log(`[Email Worker] Processing request ${docSnap.id} for ${to} (${type})...`);

    try {
      let result;
      if (type === "welcome" || payload.type === "welcome" || payload.type === "sync_welcome") {
        result = await sendWelcomeNotification(to);
      } else if (type === "badge") {
        result = await sendBadgeNotification(
          to,
          payload.badgeTitle || "Day Milestone Badge",
          payload.badgeType || "day",
          payload
        );
      } else if (type === "trash_warning") {
        result = await sendTrashWarningNotification(
          to,
          payload.dayNumber || 1,
          payload.hoursLeft || 3,
          payload.currentStreak || 0
        );
      } else if (type === "accountability") {
        result = await sendToughLoveNotification(
          to,
          payload.missedDay || 1,
          payload.missedCount || 1,
          payload.roastQuote
        );
      } else {
        // Default daily or sync confirmation
        result = await sendWelcomeNotification(to);
      }

      if (result.success) {
        await updateDoc(docRef, {
          status: "sent",
          messageId: result.messageId || null,
          processedAt: serverTimestamp(),
        });
        console.log(`[Email Worker] Successfully sent to ${to}. MessageId: ${result.messageId}`);
      } else {
        await updateDoc(docRef, {
          status: "failed",
          error: result.error || "Unknown error",
          processedAt: serverTimestamp(),
        });
        console.error(`[Email Worker] Failed to send to ${to}:`, result.error);
      }
    } catch (err: any) {
      console.error(`[Email Worker] Error processing ${docSnap.id}:`, err);
      await updateDoc(docRef, {
        status: "failed",
        error: err?.message || String(err),
        processedAt: serverTimestamp(),
      });
    }
  }
}

processQueue()
  .then(() => {
    console.log("[Email Worker] Completed queue sweep.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("[Email Worker] Fatal error:", err);
    process.exit(1);
  });

