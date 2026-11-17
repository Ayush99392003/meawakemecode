import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const RENDER_WORKER_URL = process.env.RENDER_WORKER_URL || 'https://meawakemecode.onrender.com';
const ADMIN_KEY = process.env.ADMIN_KEY || process.env.CRON_SECRET || 'meawakemecode_analytics_dataset_key_2026';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBs6Hp-7fEo7xwHU7S3HkEn3p-LelaJtBU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "meawakemecode-8a35b.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "meawakemecode-8a35b",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "meawakemecode-8a35b.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "577622195531",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:577622195531:web:967a25fcda6ccf1b26bcce",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fetchBehavioralDataset() {
  console.log(`\n======================================================`);
  console.log(`📡 PULLING ANONYMOUS BEHAVIORAL DATASET (Option B)`);
  console.log(`Target: Firestore (behavioral_dataset) & Render API`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`======================================================\n`);

  let records = [];

  // 1. Try Direct Firestore collection query first (instant, guaranteed access)
  try {
    const colRef = collection(db, 'behavioral_dataset');
    const q = query(colRef, limit(2000));
    const snap = await getDocs(q);
    records = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    console.log(`✅ [Firestore Connection] Successfully queried ${records.length} telemetry records from Firestore.`);
  } catch (err) {
    console.warn(`[Firestore Query Warning] Trying Render API fallback:`, err.message);
  }

  // 2. Try Render API if Firestore query was empty
  if (records.length === 0) {
    try {
      const datasetRes = await fetch(`${RENDER_WORKER_URL}/api/analytics/dataset?key=${ADMIN_KEY}&limit=2000`);
      if (datasetRes.ok) {
        const json = await datasetRes.json();
        records = json.records || [];
      }
    } catch (err) {
      console.warn(`[API Query Warning]:`, err.message);
    }
  }

  // 3. Compute Pattern Analytics
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
    if (r.eventType === 'trash_warning_viewed') warningsIssued++;
    if (r.eventType === 'trash_quota_salvaged') warningsSalvaged++;
    if (r.eventType === 'trash_roast_opened') roastsRead++;
    if (r.eventType === 'trash_badge_assigned' && r.tier && tierCounts[r.tier] !== undefined) {
      tierCounts[r.tier]++;
    }
    if (r.eventType === 'problem_solved' && typeof r.localHour === 'number') {
      hourlySolves[r.localHour]++;
    }
    if (r.eventType === 'focus_mode_toggled') focusToggles++;
    if (r.eventType === 'mcq_category_finished') {
      mcqTotalCorrect += Number(r.correct) || 0;
      mcqTotalCount += Number(r.total) || 0;
    }
  }

  const salvageRate = warningsIssued > 0 ? Math.round((warningsSalvaged / warningsIssued) * 100) : 0;
  const mcqAccuracy = mcqTotalCount > 0 ? Math.round((mcqTotalCorrect / mcqTotalCount) * 100) : 0;

  console.log(`\n📊 ── BEHAVIORAL PATTERN SUMMARY ──`);
  console.log(`   Sample Records Extracted: ${records.length}`);
  console.log(`   Unique Anonymous Learners: ${cohorts.size}`);
  console.log(`\n   🗑️ Trash Badge Effect (Reverse Accountability):`);
  console.log(`      • Warnings Issued: ${warningsIssued}`);
  console.log(`      • Quota Salvaged Before Midnight: ${warningsSalvaged}`);
  console.log(`      • Urgency Salvage Rate: ${salvageRate}%`);
  console.log(`      • Roast Messages Read: ${roastsRead}`);
  console.log(`      • Tier Escalation:`, tierCounts);
  console.log(`\n   👁️ Focus Mode:`);
  console.log(`      • Total Focus Mode Toggles: ${focusToggles}`);
  console.log(`\n   ⚡ MCQ Performance:`);
  console.log(`      • Overall Accuracy: ${mcqAccuracy}% across ${mcqTotalCount} answered questions`);

  // 4. Save expanding dataset to disk
  const outputDir = path.join(rootDir, 'data', 'telemetry');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `dataset_${dateStr}.json`;
  const filePath = path.join(outputDir, filename);

  fs.writeFileSync(
    filePath,
    JSON.stringify(
      {
        extractedAt: new Date().toISOString(),
        totalCount: records.length,
        uniqueCohorts: cohorts.size,
        summary: {
          salvageRatePercent: salvageRate,
          tierCounts,
          mcqAccuracyPercent: mcqAccuracy,
          hourlySolves,
        },
        records,
      },
      null,
      2
    ),
    'utf-8'
  );

  console.log(`\n💾 Saved snapshot dataset to:`);
  console.log(`   ${filePath}`);
  console.log(`\n======================================================\n`);
}

fetchBehavioralDataset();

