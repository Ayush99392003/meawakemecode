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

/**
 * Queue an email dispatch in Firestore `email_requests` collection
 */
export async function queueEmailRequest(
  recipient: string,
  type: "daily" | "badge" | "trash_warning" | "accountability" | "welcome",
  payload: Record<string, any>
): Promise<boolean> {
  if (!recipient || !recipient.includes("@") || !db) return false;
  try {
    const queueRef = collection(db, "email_requests");
    await addDoc(queueRef, {
      to: recipient.trim().toLowerCase(),
      type,
      payload,
      status: "pending",
      requestedAt: serverTimestamp(),
      createdAtIso: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error("Failed to queue email request in Firestore:", err);
    return false;
  }
}
