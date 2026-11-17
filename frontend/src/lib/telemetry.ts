'use client';

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const RENDER_WORKER_URL = 'https://meawakemecode.onrender.com';
const ANON_ID_KEY = 'dsa_anon_device_id_v1';

/**
 * Get or create a persistent anonymous device identifier.
 * Completely random UUID - zero association with personal info or email.
 */
export function getAnonymousId(): string {
  if (typeof window === 'undefined') return 'server_render';
  try {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      id = 'anon_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  } catch {
    return 'anon_ephemeral_' + Math.random().toString(36).substring(2, 8);
  }
}

export type TelemetryEventType =
  | 'trash_warning_viewed'
  | 'trash_quota_salvaged'
  | 'trash_badge_assigned'
  | 'trash_roast_opened'
  | 'trash_badge_redeemed'
  | 'focus_mode_toggled'
  | 'theory_module_read'
  | 'problem_solved'
  | 'mcq_category_finished'
  | 'day_completed';

export interface TelemetryPayload {
  eventType: TelemetryEventType;
  metadata?: Record<string, any>;
}

/**
 * Silently records an anonymous behavioral telemetry event to the expanding dataset.
 * Guaranteed non-blocking and zero PII.
 */
export async function trackBehavioralEvent(
  eventType: TelemetryEventType,
  metadata: Record<string, any> = {}
): Promise<void> {
  if (typeof window === 'undefined') return;

  const now = new Date();
  const localHour = now.getHours();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const isMobile = window.innerWidth < 768;

  const eventRecord = {
    anonId: getAnonymousId(),
    eventType,
    localHour,
    localMinute: now.getMinutes(),
    timezone,
    device: isMobile ? 'mobile' : 'desktop',
    clientTimestamp: now.toISOString(),
    ...metadata,
  };

  // 1. Direct write to Firestore collection 'behavioral_dataset'
  try {
    if (db) {
      const colRef = collection(db, 'behavioral_dataset');
      addDoc(colRef, {
        ...eventRecord,
        recordedAt: serverTimestamp(),
      }).catch(() => {});
    }
  } catch {
    // Silent failover
  }

  // 2. Beacon to Render worker ingest endpoint
  try {
    const blob = new Blob([JSON.stringify(eventRecord)], { type: 'application/json' });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`${RENDER_WORKER_URL}/api/analytics/ingest`, blob);
    } else {
      fetch(`${RENDER_WORKER_URL}/api/analytics/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventRecord),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Non-blocking
  }
}

// ── Specific Helper Hooks ──

/**
 * When the user sees a pre-midnight trash badge warning banner
 */
export function trackTrashWarningViewed(dayNumber: number, hoursLeft: number, currentStreak: number) {
  trackBehavioralEvent('trash_warning_viewed', {
    dayNumber,
    hoursLeft,
    currentStreak,
  });
}

/**
 * When a user successfully finishes all 5 problems before midnight to prevent getting the trash badge
 */
export function trackTrashQuotaSalvaged(dayNumber: number, solvedCount: number) {
  trackBehavioralEvent('trash_quota_salvaged', {
    dayNumber,
    solvedCount,
    salvagedAtHour: new Date().getHours(),
  });
}

/**
 * When a user enters/holds a trash tier penalty
 */
export function trackTrashBadgeAssigned(tier: string, missedCount: number, daysBehind: number) {
  trackBehavioralEvent('trash_badge_assigned', {
    tier,
    missedCount,
    daysBehind,
  });
}

/**
 * When a user clicks to read their harsh roast
 */
export function trackTrashRoastOpened(tier: string) {
  trackBehavioralEvent('trash_roast_opened', {
    tier,
  });
}

/**
 * When a user completes their missed penalty day and clears their badge
 */
export function trackTrashBadgeRedeemed(clearedDay: number) {
  trackBehavioralEvent('trash_badge_redeemed', {
    clearedDay,
    redeemedAtHour: new Date().getHours(),
  });
}

/**
 * When Focus Mode is toggled
 */
export function trackFocusModeToggle(enabled: boolean, page: string, activeTab?: string) {
  trackBehavioralEvent('focus_mode_toggled', {
    enabled,
    page,
    activeTab,
  });
}

/**
 * When a theory module is read
 */
export function trackTheoryModuleRead(dayNumber: number, module: 'dsa' | 'cs' | 'system_design') {
  trackBehavioralEvent('theory_module_read', {
    dayNumber,
    module,
  });
}

/**
 * When a problem is solved
 */
export function trackProblemSolved(dayNumber: number, problemId: string, difficulty?: string) {
  trackBehavioralEvent('problem_solved', {
    dayNumber,
    problemId,
    difficulty: difficulty || 'unknown',
  });
}

/**
 * When an MCQ category is finished
 */
export function trackMcqCategoryFinished(
  dayNumber: number,
  category: string,
  correct: number,
  total: number
) {
  trackBehavioralEvent('mcq_category_finished', {
    dayNumber,
    category,
    correct,
    total,
    accuracyPercent: total > 0 ? Math.round((correct / total) * 100) : 0,
  });
}
