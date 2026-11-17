import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const RENDER_WORKER_URL = process.env.RENDER_WORKER_URL || 'https://meawakemecode.onrender.com';
const ADMIN_KEY = process.env.ADMIN_KEY || process.env.CRON_SECRET || 'meawakemecode_analytics_dataset_key_2026';

async function fetchBehavioralDataset() {
  console.log(`\n======================================================`);
  console.log(`📡 PULLING ANONYMOUS BEHAVIORAL DATASET (Option B)`);
  console.log(`Endpoint: ${RENDER_WORKER_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`======================================================\n`);

  // 1. Fetch live summary
  try {
    const summaryRes = await fetch(`${RENDER_WORKER_URL}/api/analytics/summary?key=${ADMIN_KEY}`);
    if (summaryRes.ok) {
      const summary = await summaryRes.json();
      console.log(`✅ [Summary Insights]`);
      console.log(`   Sample Records: ${summary.sampleSize}`);
      console.log(`   Unique Anonymous Learners: ${summary.uniqueAnonymousLearners}`);
      console.log(`\n   🔥 Trash Badge & Urgency Metrics:`);
      console.log(`      - Warnings Issued: ${summary.patterns.trashBadgeEffect.warningsIssued}`);
      console.log(`      - Quota Salvaged Before Midnight: ${summary.patterns.trashBadgeEffect.warningsSalvaged}`);
      console.log(`      - Salvage Success Rate: ${summary.patterns.trashBadgeEffect.salvageRatePercent}%`);
      console.log(`      - Roasts Read: ${summary.patterns.trashBadgeEffect.roastsRead}`);
      console.log(`      - Tier Breakdown:`, JSON.stringify(summary.patterns.trashBadgeEffect.tierDistribution));
      console.log(`      - Behavioral Analysis: ${summary.patterns.trashBadgeEffect.interpretation}`);
      console.log(`\n   👁️ Focus Mode Toggles: ${summary.patterns.focusModeAdoption.totalToggles}`);
      console.log(`   ⚡ MCQ Overall Accuracy: ${summary.patterns.mcqPerformance.overallAccuracyPercent}% (${summary.patterns.mcqPerformance.totalAnswered} questions)`);
    } else {
      console.warn(`⚠️ Could not fetch summary: ${summaryRes.status} ${summaryRes.statusText}`);
    }
  } catch (err) {
    console.warn(`[Summary Error]`, err.message);
  }

  // 2. Fetch full raw dataset
  try {
    console.log(`\n📥 Fetching raw dataset rows...`);
    const datasetRes = await fetch(`${RENDER_WORKER_URL}/api/analytics/dataset?key=${ADMIN_KEY}&limit=2000`);
    if (datasetRes.ok) {
      const dataset = await datasetRes.json();
      const outputDir = path.join(rootDir, 'data', 'telemetry');
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

      const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `dataset_${dateStr}.json`;
      const filePath = path.join(outputDir, filename);

      fs.writeFileSync(filePath, JSON.stringify(dataset, null, 2), 'utf-8');
      console.log(`💾 Saved ${dataset.totalCount || 0} dataset records to:`);
      console.log(`   ${filePath}`);
      console.log(`\n✅ Dataset extraction complete!`);
    } else {
      console.error(`❌ Dataset fetch failed: ${datasetRes.status}`);
    }
  } catch (err) {
    console.error(`❌ Dataset fetch error:`, err.message);
  }
}

fetchBehavioralDataset();
