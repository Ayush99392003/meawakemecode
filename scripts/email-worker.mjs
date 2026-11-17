import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  sendBadgeNotification,
  sendTrashWarningNotification,
  sendToughLoveNotification,
  sendWelcomeNotification,
  sendDailyItineraryNotification,
} from "../dist/services/dispatcher.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// -------------------------------------------------------------
// 1. Load Local Curriculum & Problem Catalogs (Fail-safe lookup)
// -------------------------------------------------------------
let daysCatalog = [];
let problemsMap = new Map();

try {
  const daysPath = path.join(rootDir, "data", "curriculum", "days_30.json");
  if (fs.existsSync(daysPath)) {
    daysCatalog = JSON.parse(fs.readFileSync(daysPath, "utf-8"));
  }
  const problemsPath = path.join(rootDir, "data", "problems", "problems_catalog.json");
  if (fs.existsSync(problemsPath)) {
    const rawProblems = JSON.parse(fs.readFileSync(problemsPath, "utf-8"));
    for (const p of rawProblems) {
      problemsMap.set(p.id, p);
    }
  }
  console.log(`[Worker] 📚 Loaded ${daysCatalog.length} days and ${problemsMap.size} problems into memory.`);
} catch (err) {
  console.warn("[Worker] Warning loading local curriculum catalog:", err.message);
}

function getDayItinerary(dayNumber) {
  const num = Number(dayNumber) || 1;
  const dayMeta = daysCatalog.find((d) => d.number === num) || {
    id: `day_${num}`,
    number: num,
    theme: `Day ${num} Mastery`,
    summary: `Complete today's 5 curated problems to maintain your engineering streak.`,
    problemIds: [],
  };

  const problems = [];
  if (Array.isArray(dayMeta.problemIds)) {
    for (const pid of dayMeta.problemIds) {
      const prob = problemsMap.get(pid);
      if (prob) {
        problems.push({
          title: prob.title,
          platform: prob.platform,
          difficulty: prob.difficulty,
          url: prob.url,
          expectedTimeComplexity: prob.expectedTimeComplexity || null,
        });
      }
    }
  }

  // Fallback problems if local catalog isn't populated
  if (problems.length === 0) {
    problems.push(
      { title: "Two Sum", platform: "LC", difficulty: "Easy", url: "https://leetcode.com/problems/two-sum/", expectedTimeComplexity: "O(N)" },
      { title: "Contains Duplicate", platform: "LC", difficulty: "Easy", url: "https://leetcode.com/problems/contains-duplicate/", expectedTimeComplexity: "O(N)" },
      { title: "Group Anagrams", platform: "LC", difficulty: "Medium", url: "https://leetcode.com/problems/group-anagrams/", expectedTimeComplexity: "O(N * K log K)" },
      { title: "Watermelon", platform: "CF", difficulty: "800", url: "https://codeforces.com/problemset/problem/4/A", expectedTimeComplexity: "O(1)" },
      { title: "Next Round", platform: "CF", difficulty: "800", url: "https://codeforces.com/problemset/problem/158/A", expectedTimeComplexity: "O(N)" }
    );
  }

  return { day: dayMeta, problems };
}

// -------------------------------------------------------------
// 2. Firebase Initialization
// -------------------------------------------------------------
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

const inFlight = new Set();
let lastSweepStats = { at: new Date().toISOString(), processed: 0, errors: 0 };
let lastCronStats = { at: null, usersEvaluated: 0, emailsSent: 0, skipped: 0 };

// -------------------------------------------------------------
// 3. User Progress & Timezone Helpers
// -------------------------------------------------------------
function getLocalTimeInfo(timezone = "Asia/Kolkata", date = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const partMap = {};
    for (const p of parts) partMap[p.type] = p.value;

    const localDateStr = `${partMap.year}-${partMap.month}-${partMap.day}`;
    const localHour = parseInt(partMap.hour, 10);
    const localMinute = parseInt(partMap.minute, 10);

    return { localDateStr, localHour, localMinute };
  } catch (err) {
    const iso = date.toISOString();
    return {
      localDateStr: iso.split("T")[0],
      localHour: date.getUTCHours(),
      localMinute: date.getUTCMinutes(),
    };
  }
}

function calculateNextDay(dayCompletions = {}) {
  for (let i = 1; i <= 30; i++) {
    if (!dayCompletions[i] && !dayCompletions[String(i)]) {
      return i;
    }
  }
  return 30; // Completed all 30 days
}

function calculateStreak(dayCompletions = {}) {
  let streak = 0;
  for (let i = 1; i <= 30; i++) {
    if (dayCompletions[i] || dayCompletions[String(i)]) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// -------------------------------------------------------------
// 4. Automated Hourly Clock-Ticked Scheduler
// -------------------------------------------------------------
async function runHourlyScheduledSweep(options = {}) {
  const { force = false, dryRun = false, targetEmail = null } = options;
  const runAt = new Date();
  console.log(`\n[Clock Engine] ⏰ Running hourly email evaluation at ${runAt.toISOString()} (force: ${force}, dryRun: ${dryRun})...`);

  let usersEvaluated = 0;
  let emailsSent = 0;
  let skipped = 0;
  const dispatchResults = [];

  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    usersEvaluated = usersSnapshot.size;

    for (const userDoc of usersSnapshot.docs) {
      const uData = userDoc.data();
      const email = (uData.email || "").trim().toLowerCase();
      if (!email || !email.includes("@")) continue;

      if (targetEmail && email !== targetEmail.trim().toLowerCase()) {
        continue;
      }

      if (uData.subscriptionStatus === "unsubscribed") {
        skipped++;
        continue;
      }

      const timezone = uData.timezone || "Asia/Kolkata";
      const { localDateStr, localHour } = getLocalTimeInfo(timezone, runAt);

      // Check configured reminder time (defaults to 09:00 AM)
      const userReminderHour = uData.reminderTime
        ? parseInt(String(uData.reminderTime).split(":")[0], 10)
        : 9;

      const isReminderHour = localHour === userReminderHour;
      const nextDay = calculateNextDay(uData.dayCompletions || {});
      const streakCount = calculateStreak(uData.dayCompletions || {});

      // --- A. Daily Curriculum Itinerary ---
      const dailyIdempKey = `${userDoc.id}_daily_${localDateStr}`;
      const logRef = doc(db, "email_logs", dailyIdempKey);

      let alreadySentToday = false;
      if (!force) {
        try {
          const existingLog = await getDoc(logRef);
          alreadySentToday = existingLog.exists() && existingLog.data()?.status === "sent";
        } catch {}
      }

      if ((isReminderHour && !alreadySentToday) || force) {
        if (dryRun) {
          dispatchResults.push({ email, action: "would_send_itinerary", day: nextDay, streak: streakCount, timezone });
          emailsSent++;
        } else {
          console.log(`[Clock Engine] 🚀 Sending Day ${nextDay} Itinerary to ${email} (localHour: ${localHour}, streak: ${streakCount})...`);
          const { day, problems } = getDayItinerary(nextDay);
          const result = await sendDailyItineraryNotification(email, day, problems, {
            currentStreak: streakCount,
            longestStreak: streakCount,
          });

          if (result.success) {
            await setDoc(
              logRef,
              {
                userId: userDoc.id,
                email,
                type: "daily_reminder",
                dayNumber: nextDay,
                sentAt: serverTimestamp(),
                sentAtIso: new Date().toISOString(),
                status: "sent",
                messageId: result.messageId || null,
              },
              { merge: true }
            );
            emailsSent++;
            dispatchResults.push({ email, action: "sent_itinerary", day: nextDay, messageId: result.messageId });
          } else {
            console.error(`[Clock Engine] ❌ Failed to dispatch itinerary to ${email}:`, result.error);
            dispatchResults.push({ email, action: "failed_itinerary", error: result.error });
          }
        }
      } else {
        skipped++;
      }

      // --- B. Evening Streak At Risk Warning (8:00 PM local time) ---
      const isEveningHour = localHour === 20;
      const solvedToday = !!(uData.dayCompletions && uData.dayCompletions[nextDay]);
      const streakWarningKey = `${userDoc.id}_streak_risk_${localDateStr}`;
      const streakLogRef = doc(db, "email_logs", streakWarningKey);

      let streakWarnSent = false;
      if (!force) {
        try {
          const existingStreakLog = await getDoc(streakLogRef);
          streakWarnSent = existingStreakLog.exists() && existingStreakLog.data()?.status === "sent";
        } catch {}
      }

      if (isEveningHour && streakCount >= 2 && !solvedToday && !streakWarnSent) {
        if (!dryRun) {
          console.log(`[Clock Engine] 🔥 Sending Streak Warning to ${email} (Streak: ${streakCount})...`);
          const warnResult = await sendTrashWarningNotification(email, nextDay, 4, streakCount);
          if (warnResult.success) {
            await setDoc(
              streakLogRef,
              {
                userId: userDoc.id,
                email,
                type: "streak_at_risk",
                sentAt: serverTimestamp(),
                status: "sent",
                messageId: warnResult.messageId || null,
              },
              { merge: true }
            );
          }
        }
      }
    }

    lastCronStats = {
      at: runAt.toISOString(),
      usersEvaluated,
      emailsSent,
      skipped,
    };
    console.log(`[Clock Engine] Finished: Evaluated ${usersEvaluated} users | Sent: ${emailsSent} | Skipped: ${skipped}`);
    return { success: true, stats: lastCronStats, results: dispatchResults };
  } catch (err) {
    console.error("[Clock Engine] Error during scheduled evaluation:", err);
    return { success: false, error: err?.message || String(err) };
  }
}

// Internal clock scheduler: runs every 15 minutes
setInterval(() => {
  runHourlyScheduledSweep({ force: false, dryRun: false }).catch(() => {});
}, 15 * 60 * 1000);

// Immediate clock check 10 seconds after boot
setTimeout(() => {
  runHourlyScheduledSweep({ force: false, dryRun: false }).catch(() => {});
}, 10 * 1000);

// -------------------------------------------------------------
// 5. Real-Time Event Dispatcher (Firestore Queue Consumer)
// -------------------------------------------------------------
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
    } else if (type === "daily_reminder" || type === "itinerary") {
      const dayNum = payload.dayNumber || 1;
      const { day, problems } = getDayItinerary(dayNum);
      result = await sendDailyItineraryNotification(to, day, problems, {
        currentStreak: payload.currentStreak || 0,
        longestStreak: payload.longestStreak || 0,
      });
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

// Real-time onSnapshot listener
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

// Fallback polling every 5 seconds
setInterval(sweepQueue, 5000);

// -------------------------------------------------------------
// 6. HTTP API Server & Cron Endpoints
// -------------------------------------------------------------
const PORT = process.env.PORT || 8080;
const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = reqUrl.pathname;

  // Endpoint: Clock / Scheduler trigger (/cron/hourly)
  if (pathname === "/cron/hourly") {
    const force = reqUrl.searchParams.get("force") === "true";
    const dryRun = reqUrl.searchParams.get("dryRun") === "true";
    const targetEmail = reqUrl.searchParams.get("email");

    console.log(`[HTTP API] ⏰ Manual trigger for /cron/hourly (force: ${force}, dryRun: ${dryRun}, target: ${targetEmail || "all"})`);
    const results = await runHourlyScheduledSweep({ force, dryRun, targetEmail });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(results));
    return;
  }

  // Endpoint: Direct Itinerary Send (/api/send-itinerary)
  if (pathname === "/api/send-itinerary" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { email, dayNumber = 1, currentStreak = 0 } = JSON.parse(body || "{}");
        if (!email || !email.includes("@")) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: "Invalid recipient email" }));
          return;
        }

        console.log(`[HTTP API] 📨 Direct itinerary request: ${email} (Day ${dayNumber})`);
        const { day, problems } = getDayItinerary(dayNumber);
        const result = await sendDailyItineraryNotification(email, day, problems, {
          currentStreak,
          longestStreak: currentStreak,
        });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: err?.message || String(err) }));
      }
    });
    return;
  }

  // Endpoint: Direct Instant Email Send (/api/send-email)
  if (pathname === "/api/send-email" && req.method === "POST") {
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

  // -------------------------------------------------------------
  // Analytics & Behavioral Dataset Ingestion (Zero PII)
  // -------------------------------------------------------------
  if (pathname === "/api/analytics/ingest" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const eventData = JSON.parse(body || "{}");
        if (!eventData.eventType || !eventData.anonId) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: "Invalid telemetry payload" }));
          return;
        }

        // Store to Firestore 'behavioral_dataset'
        try {
          const colRef = collection(db, "behavioral_dataset");
          await addDoc(colRef, {
            ...eventData,
            serverReceivedAt: serverTimestamp(),
            serverIso: new Date().toISOString(),
          });
        } catch (dbErr) {
          console.warn("[Worker Analytics] Firestore write warning:", dbErr.message);
        }

        // Local Append Fail-safe
        try {
          const telemetryDir = path.join(rootDir, "data", "telemetry");
          if (!fs.existsSync(telemetryDir)) fs.mkdirSync(telemetryDir, { recursive: true });
          fs.appendFileSync(
            path.join(telemetryDir, "behavioral_events.jsonl"),
            JSON.stringify({ ...eventData, serverIso: new Date().toISOString() }) + "\n",
            "utf-8"
          );
        } catch {}

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: err?.message || String(err) }));
      }
    });
    return;
  }

  // -------------------------------------------------------------
  // Private Admin Dataset Export (Option B)
  // -------------------------------------------------------------
  if (pathname === "/api/analytics/dataset" && req.method === "GET") {
    const key = reqUrl.searchParams.get("key");
    const validKey = process.env.ADMIN_KEY || process.env.CRON_SECRET || "meawakemecode_analytics_dataset_key_2026";
    if (key !== validKey) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized: Invalid admin key" }));
      return;
    }

    const rowLimit = Math.min(Math.max(1, Number(reqUrl.searchParams.get("limit") || 1000)), 5000);
    const filterEvent = reqUrl.searchParams.get("event");
    const format = reqUrl.searchParams.get("format") || "json";

    try {
      const colRef = collection(db, "behavioral_dataset");
      let q = query(colRef, orderBy("clientTimestamp", "desc"), limit(rowLimit));
      if (filterEvent) {
        q = query(colRef, where("eventType", "==", filterEvent), limit(rowLimit));
      }

      const snap = await getDocs(q);
      const records = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (format === "csv") {
        if (records.length === 0) {
          res.writeHead(200, { "Content-Type": "text/csv" });
          res.end("id,anonId,eventType,clientTimestamp\n");
          return;
        }
        const headers = ["id", "anonId", "eventType", "clientTimestamp", "localHour", "device", "tier", "dayNumber", "problemId"];
        const csvRows = [headers.join(",")];
        for (const r of records) {
          const row = headers.map((h) => JSON.stringify(r[h] ?? "")).join(",");
          csvRows.push(row);
        }
        res.writeHead(200, {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="behavioral_dataset_${Date.now()}.csv"`,
        });
        res.end(csvRows.join("\n"));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ totalCount: records.length, records }));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: err?.message || String(err) }));
    }
    return;
  }

  // -------------------------------------------------------------
  // Private Admin Analytics Summary (Option B Pattern Insights)
  // -------------------------------------------------------------
  if (pathname === "/api/analytics/summary" && req.method === "GET") {
    const key = reqUrl.searchParams.get("key");
    const validKey = process.env.ADMIN_KEY || process.env.CRON_SECRET || "meawakemecode_analytics_dataset_key_2026";
    if (key !== validKey) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized: Invalid admin key" }));
      return;
    }

    try {
      const colRef = collection(db, "behavioral_dataset");
      const q = query(colRef, orderBy("clientTimestamp", "desc"), limit(2000));
      const snap = await getDocs(q);
      const records = snap.docs.map((d) => d.data());

      const cohorts = new Set();
      let warningsIssued = 0;
      let warningsSalvaged = 0;
      let roastsRead = 0;
      const tierCounts = { bronze: 0, silver: 0, gold: 0, dumpster: 0 };
      const hourlySolves = new Array(24).fill(0);
      let focusToggles = 0;
      let mcqTotalCorrect = 0;
      let mcqTotalCount = 0;

      for (const r of records) {
        if (r.anonId) cohorts.add(r.anonId);

        if (r.eventType === "trash_warning_viewed") warningsIssued++;
        if (r.eventType === "trash_quota_salvaged") warningsSalvaged++;
        if (r.eventType === "trash_roast_opened") roastsRead++;
        if (r.eventType === "trash_badge_assigned" && r.tier && tierCounts[r.tier] !== undefined) {
          tierCounts[r.tier]++;
        }
        if (r.eventType === "problem_solved" && typeof r.localHour === "number") {
          hourlySolves[r.localHour]++;
        }
        if (r.eventType === "focus_mode_toggled") focusToggles++;
        if (r.eventType === "mcq_category_finished") {
          mcqTotalCorrect += Number(r.correct) || 0;
          mcqTotalCount += Number(r.total) || 0;
        }
      }

      const salvageRate = warningsIssued > 0 ? Math.round((warningsSalvaged / warningsIssued) * 100) : 0;
      const mcqAccuracy = mcqTotalCount > 0 ? Math.round((mcqTotalCorrect / mcqTotalCount) * 100) : 0;

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "success",
          generatedAt: new Date().toISOString(),
          sampleSize: records.length,
          uniqueAnonymousLearners: cohorts.size,
          patterns: {
            trashBadgeEffect: {
              warningsIssued,
              warningsSalvaged,
              salvageRatePercent: salvageRate,
              roastsRead,
              tierDistribution: tierCounts,
              interpretation:
                salvageRate >= 60
                  ? "High urgency response: Majority of warned learners finish quota before midnight."
                  : "Moderate response: Consider advancing urgency notification earlier in the evening.",
            },
            focusModeAdoption: {
              totalToggles: focusToggles,
            },
            mcqPerformance: {
              totalAnswered: mcqTotalCount,
              overallAccuracyPercent: mcqAccuracy,
            },
            hourlyStudyHeatmap: hourlySolves,
          },
        })
      );
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: err?.message || String(err) }));
    }
    return;
  }

  if (pathname === "/process") {
    console.log("[Worker] Manual sweep requested via HTTP /process");
    const results = await sweepQueue();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", processedCount: results.length, results }));
    return;
  }

  if (pathname === "/health" || pathname === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "healthy",
        service: "meawakemecode-email-worker",
        lastSweep: lastSweepStats,
        lastCron: lastCronStats,
        inFlightCount: inFlight.size,
        smtpConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
        smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
        smtpPort: Number(process.env.SMTP_PORT) || 587,
        gmailWebAppConfigured: !!process.env.GMAIL_WEBAPP_URL,
        brevoConfigured: !!process.env.BREVO_API_KEY,
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log("==================================================");
  console.log("⚡ meawakemecode Autonomous Scheduled Email Daemon");
  console.log(`[Server] Listening on port ${PORT}`);
  console.log(`[SMTP Configured]: ${!!(process.env.SMTP_USER && process.env.SMTP_PASS)}`);
  console.log(`[Curriculum Catalog]: ${daysCatalog.length} days, ${problemsMap.size} problems`);
  console.log("==================================================");
});
