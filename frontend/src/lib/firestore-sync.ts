import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProgressState } from "./stores/progress-store";

export interface FullSyncPayload {
  email: string;
  updatedAt: any;
  problems: ProgressState["problems"];
  dayCompletions: ProgressState["dayCompletions"];
  theoryRead: ProgressState["theoryRead"];
  csTheoryRead: ProgressState["csTheoryRead"];
  systemDesignRead: ProgressState["systemDesignRead"];
  mcqAnswers: ProgressState["mcqAnswers"];
  startDate: string | null;
  streakFreezeUsed: ProgressState["streakFreezeUsed"];
}

/** Sanitize email address to valid Firestore document ID */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase().replace(/[.#$[\]]/g, "_");
}

/**
 * Sync complete progress state to Firestore
 */
export async function syncProgressToFirestore(
  identifier: string,
  progress: ProgressState
): Promise<boolean> {
  if (!identifier || !identifier.includes("@") || !db) return false;
  try {
    const docId = sanitizeEmail(identifier);
    const userRef = doc(db, "users", docId);

    const payload: FullSyncPayload = {
      email: identifier.trim().toLowerCase(),
      updatedAt: serverTimestamp(),
      problems: progress.problems || {},
      dayCompletions: progress.dayCompletions || {},
      theoryRead: progress.theoryRead || {},
      csTheoryRead: progress.csTheoryRead || {},
      systemDesignRead: progress.systemDesignRead || {},
      mcqAnswers: progress.mcqAnswers || {},
      startDate: progress.startDate || null,
      streakFreezeUsed: progress.streakFreezeUsed || {},
    };

    await setDoc(userRef, payload, { merge: true });
    return true;
  } catch (error) {
    console.error("Failed to sync progress to Firestore:", error);
    return false;
  }
}

/**
 * Load complete progress state from Firestore
 */
export async function loadProgressFromFirestore(
  identifier: string
): Promise<Partial<ProgressState> | null> {
  if (!identifier || !identifier.includes("@") || !db) return null;
  try {
    const docId = sanitizeEmail(identifier);
    const userRef = doc(db, "users", docId);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();
      return {
        problems: data.problems || {},
        dayCompletions: data.dayCompletions || {},
        theoryRead: data.theoryRead || {},
        csTheoryRead: data.csTheoryRead || {},
        systemDesignRead: data.systemDesignRead || {},
        mcqAnswers: data.mcqAnswers || {},
        startDate: data.startDate || null,
        streakFreezeUsed: data.streakFreezeUsed || {},
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch progress from Firestore:", error);
    return null;
  }
}

/**
 * Merge cloud progress non-destructively into local progress
 */
export function mergeProgressStates(
  local: ProgressState,
  cloud: Partial<ProgressState>
): ProgressState {
  // Merge problems (solved takes precedence)
  const mergedProblems = { ...local.problems };
  if (cloud.problems) {
    for (const [id, prob] of Object.entries(cloud.problems)) {
      if (prob.status === "solved" || !mergedProblems[id]) {
        mergedProblems[id] = prob;
      }
    }
  }

  // Merge day completions
  const mergedCompletions = {
    ...cloud.dayCompletions,
    ...local.dayCompletions,
  };

  // Merge theory reads
  const mergedTheory = {
    ...cloud.theoryRead,
    ...local.theoryRead,
  };

  const mergedCsTheory = {
    ...cloud.csTheoryRead,
    ...local.csTheoryRead,
  };

  const mergedSdTheory = {
    ...cloud.systemDesignRead,
    ...local.systemDesignRead,
  };

  const mergedMcqs = {
    ...cloud.mcqAnswers,
    ...local.mcqAnswers,
  };

  // Keep earlier start date
  let mergedStart = local.startDate;
  if (cloud.startDate) {
    if (!mergedStart || new Date(cloud.startDate) < new Date(mergedStart)) {
      mergedStart = cloud.startDate;
    }
  }

  return {
    ...local,
    problems: mergedProblems,
    dayCompletions: mergedCompletions,
    theoryRead: mergedTheory,
    csTheoryRead: mergedCsTheory,
    systemDesignRead: mergedSdTheory,
    mcqAnswers: mergedMcqs,
    startDate: mergedStart,
  };
}

export const RENDER_WORKER_URL = "https://meawakemecode.onrender.com";

/**
 * Queue or immediately dispatch an email via Render backend API with Firestore fallback
 */
export async function queueEmailRequest(
  recipient: string,
  type: "daily" | "badge" | "trash_warning" | "accountability" | "welcome",
  payload: Record<string, any>
): Promise<boolean> {
  const cleanTo = recipient.trim().toLowerCase();
  if (!cleanTo || !cleanTo.includes("@")) return false;

  // 1. Direct instantaneous dispatch via Render Worker API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${RENDER_WORKER_URL}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: cleanTo, type, payload }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        console.log(`[Mail Client] Dispatched instantly via Render worker: ${data.messageId}`);
        return true;
      }
    }
  } catch (err) {
    console.warn("[Mail Client] Direct Render dispatch skipped, queueing to Firestore:", err);
  }

  // 2. Fallback: Save to Firestore email_requests collection
  if (!db) return false;
  try {
    const queueRef = collection(db, "email_requests");
    await addDoc(queueRef, {
      to: cleanTo,
      type,
      payload,
      status: "pending",
      requestedAt: serverTimestamp(),
      createdAtIso: new Date().toISOString(),
    });

    // Background trigger for Render worker
    fetch(`${RENDER_WORKER_URL}/process`, { method: "GET" }).catch(() => {});
    return true;
  } catch (err) {
    console.error("Failed to queue email request in Firestore:", err);
    return false;
  }
}
