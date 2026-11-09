import http from "node:http";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
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

// 1. Lightweight HTTP server for Cloud Health Checks (Render, Railway, Koyeb, Fly.io)
const PORT = process.env.PORT || 8080;
const server = http.createServer((req, res) => {
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "healthy",
        service: "meawakemecode-email-worker",
        timestamp: new Date().toISOString(),
      })
    );
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.listen(PORT, () => {
  console.log(`[Health Server] Listening on port ${PORT} (health check active)`);
});

console.log("==================================================");
console.log("⚡ meawakemecode Real-time Email Dispatcher Daemon");
console.log("Listening for incoming `email_requests` (status: pending)...");
console.log("==================================================");

const queueRef = collection(db, "email_requests");
const q = query(queueRef, where("status", "==", "pending"));

// In-flight tracking to prevent duplicate dispatch in real-time listeners
const inFlight = new Set();

onSnapshot(
  q,
  async (snapshot) => {
    if (snapshot.empty) return;

    for (const docChange of snapshot.docChanges()) {
      if (docChange.type === "added" || docChange.type === "modified") {
        const docSnap = docChange.doc;
        const reqId = docSnap.id;
        const data = docSnap.data();

        if (data.status !== "pending" || inFlight.has(reqId)) continue;
        inFlight.add(reqId);

        const to = data.to;
        const type = data.type;
        const payload = data.payload || {};
        const docRef = doc(db, "email_requests", reqId);

        console.log(`\n[Realtime Worker] 📨 New request detected: ${reqId}`);
        console.log(`[Realtime Worker] Recipient: ${to} | Type: ${type}`);

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
            result = await sendWelcomeNotification(to);
          }

          if (result.success) {
            await updateDoc(docRef, {
              status: "sent",
              messageId: result.messageId || null,
              processedAt: serverTimestamp(),
            });
            console.log(`[Realtime Worker] ✅ Sent to ${to}. MessageId: ${result.messageId}`);
          } else {
            await updateDoc(docRef, {
              status: "failed",
              error: result.error || "Unknown delivery failure",
              processedAt: serverTimestamp(),
            });
            console.error(`[Realtime Worker] ❌ Delivery failed to ${to}:`, result.error);
          }
        } catch (err) {
          console.error(`[Realtime Worker] ❌ Exception for ${reqId}:`, err);
          try {
            await updateDoc(docRef, {
              status: "failed",
              error: err?.message || String(err),
              processedAt: serverTimestamp(),
            });
          } catch {}
        } finally {
          inFlight.delete(reqId);
        }
      }
    }
  },
  (err) => {
    console.error("[Realtime Worker] Firestore onSnapshot listener error:", err);
  }
);
