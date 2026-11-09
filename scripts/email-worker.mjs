import http from "node:http";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
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

const queueRef = collection(db, "email_requests");
const q = query(queueRef, where("status", "==", "pending"));

// In-flight tracking to prevent duplicate dispatch
const inFlight = new Set();
let lastSweepStats = { at: new Date().toISOString(), processed: 0, errors: 0 };

async function processSingleDoc(docSnap) {
  const reqId = docSnap.id;
  const data = docSnap.data();

  if (data.status !== "pending" || inFlight.has(reqId)) return null;
  inFlight.add(reqId);

  const to = data.to;
  const type = data.type;
  const payload = data.payload || {};
  const docRef = doc(db, "email_requests", reqId);

  console.log(`\n[Worker] 📨 Processing request: ${reqId} for ${to} (${type})`);

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
      console.log(`[Worker] ✅ Sent to ${to}. MessageId: ${result.messageId}`);
      return { id: reqId, to, status: "sent", messageId: result.messageId };
    } else {
      await updateDoc(docRef, {
        status: "failed",
        error: result.error || "Delivery error",
        processedAt: serverTimestamp(),
      });
      console.error(`[Worker] ❌ Failed to ${to}:`, result.error);
      return { id: reqId, to, status: "failed", error: result.error };
    }
  } catch (err) {
    console.error(`[Worker] ❌ Exception on ${reqId}:`, err);
    try {
      await updateDoc(docRef, {
        status: "failed",
        error: err?.message || String(err),
        processedAt: serverTimestamp(),
      });
    } catch {}
    return { id: reqId, to, status: "failed", error: err?.message };
  } finally {
    inFlight.delete(reqId);
  }
}

async function sweepQueue() {
  try {
    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];

    const results = [];
    for (const d of snapshot.docs) {
      const res = await processSingleDoc(d);
      if (res) results.push(res);
    }
    lastSweepStats = { at: new Date().toISOString(), processed: results.length, errors: 0 };
    return results;
  } catch (err) {
    console.error("[Worker] Sweep error:", err);
    lastSweepStats = { at: new Date().toISOString(), processed: 0, errors: 1 };
    return [];
  }
}

// 1. Real-time onSnapshot listener
onSnapshot(
  q,
  async (snapshot) => {
    if (snapshot.empty) return;
    for (const change of snapshot.docChanges()) {
      if (change.type === "added" || change.type === "modified") {
        await processSingleDoc(change.doc);
      }
    }
  },
  (err) => {
    console.error("[Worker] onSnapshot error:", err);
  }
);

// 2. Periodic polling every 5 seconds as fail-safe
setInterval(sweepQueue, 5000);

// 3. HTTP Server with CORS, /health, /process, and /api/send-email endpoints
const PORT = process.env.PORT || 8080;
const server = http.createServer(async (req, res) => {
  // Enable CORS for all incoming frontend requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/api/send-email" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { to, type, payload } = JSON.parse(body || "{}");
        if (!to || !to.includes("@")) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: "Invalid recipient email" }));
          return;
        }

        console.log(`\n[HTTP API] 📨 Direct dispatch request: ${to} (${type})`);
        let result;
        if (type === "welcome" || payload?.type === "welcome" || payload?.type === "sync_welcome") {
          result = await sendWelcomeNotification(to);
        } else if (type === "badge") {
          result = await sendBadgeNotification(
            to,
            payload?.badgeTitle || "Day Milestone Badge",
            payload?.badgeType || "day",
            payload || {}
          );
        } else if (type === "trash_warning") {
          result = await sendTrashWarningNotification(
            to,
            payload?.dayNumber || 1,
            payload?.hoursLeft || 3,
            payload?.currentStreak || 0
          );
        } else if (type === "accountability") {
          result = await sendToughLoveNotification(
            to,
            payload?.missedDay || 1,
            payload?.missedCount || 1,
            payload?.roastQuote
          );
        } else {
          result = await sendWelcomeNotification(to);
        }

        console.log(`[HTTP API] Result for ${to}:`, result);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (err) {
        console.error("[HTTP API] Error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: err?.message || String(err) }));
      }
    });
    return;
  }

  if (req.url === "/process") {
    console.log("[Worker] Manual sweep requested via HTTP /process");
    const results = await sweepQueue();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", processedCount: results.length, results }));
  } else if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "healthy",
        service: "meawakemecode-email-worker",
        lastSweep: lastSweepStats,
        inFlightCount: inFlight.size,
        smtpConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
        timestamp: new Date().toISOString(),
      })
    );
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.listen(PORT, () => {
  console.log("==================================================");
  console.log("⚡ meawakemecode Real-time Email Dispatcher Daemon");
  console.log(`[Health Server] Listening on port ${PORT}`);
  console.log(`[SMTP Configured]: ${!!(process.env.SMTP_USER && process.env.SMTP_PASS)}`);
  console.log("==================================================");
});
