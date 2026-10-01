/**
 * Core Domain Models for the 30-Day Technical Interview Prep Platform
 * Stored in Firestore
 */

export type Platform = "LC" | "CF";
export type ProblemStatus = "not_started" | "started" | "solved" | "revisit";
export type PreferredLanguage = "java" | "cpp" | "python";
export type BookmarkItemType = "problem" | "day" | "library_page";
export type LibrarySection = "dsa" | "os" | "dbms" | "cn" | "oop" | "system_design";
export type MCQOptionKey = "A" | "B" | "C" | "D";
export type QuestionDifficulty = "easy" | "medium" | "hard";
export type EmailType =
  | "magic_link"
  | "daily_reminder"
  | "nudge_day1"
  | "nudge_day3"
  | "streak_at_risk"
  | "weekly_digest"
  | "completion"
  | "streak_freeze_earned"
  | "inactivity_nudge"
  | "welcome_onboarding";

export interface TrashBadgeInfo {
  hasTrashBadge: boolean;
  tier: "none" | "bronze" | "silver" | "gold" | "diamond";
  title: string;
  subtitle: string;
  roast: string;
  icon: string;
  missedDaysCount: number;
}

export interface UserReminderPrefs {
  daily: boolean;
  nudges: boolean;
  weeklyDigest: boolean;
  streakWarning?: boolean;
}

export interface UserProfile {
  id: string; // Firebase Auth UID
  email: string;
  verifiedAt: string | null;
  timezone: string; // IANA timezone, e.g. "Asia/Kolkata", "America/New_York"
  preferredLanguage: PreferredLanguage;
  reminderTime: string; // "HH:mm" in 24h format, e.g. "20:00"
  reminderPrefs: UserReminderPrefs;
  subscriptionStatus: "active" | "unsubscribed";
  unsubscribeToken: string;
  cfHandle: string | null;
  strictMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Problem {
  id: string; // e.g., "lc_1", "cf_1850A"
  platform: Platform;
  externalId: string; // e.g., "1", "1850A"
  title: string;
  url: string;
  difficulty: string; // e.g., "Easy", "Medium", "Hard", or CF rating "1000", "1400"
  tags: string[];
  hint: string | null;
  expectedTimeComplexity: string | null;
  expectedSpaceComplexity: string | null;
  expectedPattern: string | null;
  status: "active" | "broken_link" | "archived";
  lastCheckedAt: string | null;
}

export interface Day {
  id: string; // "day_1", "day_2", ...
  number: number; // 1 to 30
  theme: string; // e.g. "Arrays & Hashing"
  summary: string;
  theoryContent: string; // MDX content or path
  strictOrder: number;
  problemIds: string[]; // exactly 5 problem IDs (3 LC + 2 CF)
}

export interface MCQOption {
  key: MCQOptionKey;
  text: string;
}

export interface DayQuestion {
  id: string;
  dayId: string;
  topic: string;
  question: string;
  codeSnippet: string | null;
  options: MCQOption[];
  correctOption: MCQOptionKey;
  detailedExplanation: string; // In-depth explanation of why the correct option is right and others are traps
  difficulty: QuestionDifficulty;
  orderIndex: number;
}

// Client-safe version of DayQuestion where answer and explanation are stripped until submitted
export type PublicDayQuestion = Omit<DayQuestion, "correctOption" | "detailedExplanation">;

export interface UserMCQAttempt {
  id: string;
  userId: string;
  questionId: string;
  selectedOption: MCQOptionKey;
  isCorrect: boolean;
  attemptedAt: string;
}

export interface UserProblemProgress {
  problemId: string;
  status: ProblemStatus;
  solvedAt: string | null;
  attemptsCount: number;
  personalTimeSeconds: number | null;
  personalNote: string | null;
  updatedAt: string;
}

export interface UserDayProgress {
  dayId: string;
  completedAt: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  itemType: BookmarkItemType;
  itemId: string;
  label: string | null;
  createdAt: string;
}

export interface LongQuestion {
  id: string;
  category: "dsa" | "system_design" | "cs_fundamentals";
  topic: string;
  title: string;
  difficulty: "medium" | "hard";
  scenario: string;
  requirements?: {
    functional: string[];
    nonFunctional: string[];
  };
  capacityEstimation?: string;
  detailedSolution: string;
  keyTradeoffs: string[];
}

export interface LibraryPage {
  slug: string; // e.g. "dsa/binary-search", "os/deadlocks"
  section: LibrarySection;
  title: string;
  orderIndex: number;
  tags: string[];
  readTimeMinutes: number;
  content: string; // MDX content
  interviewQuestions: Array<{ q: string; a: string }>;
}

export interface LibraryProgress {
  slug: string;
  readAt: string;
}

export interface EmailLog {
  id: string;
  userId: string;
  type: EmailType;
  sentAt: string;
  status: "sent" | "failed" | "bounced";
  idempotencyKey: string; // e.g. `${userId}_${type}_${dateString}`
}

