# 30-Day Technical Interview Prep Platform: Master Architecture, Component Roadmap & Testing Strategy

---

## 1. Executive Summary & Core Architectural Principles

### 1.1 Purpose
A high-yield, structured 30-day interview preparation platform designed around daily thematic immersion (Arrays, Two Pointers, Binary Search, DP, Trees, Graphs, etc.). Each day delivers:
- **Theory & Patterns**: Concept breakdown, standard templates, "when to use / when not to use", and language-specific nuances.
- **Handpicked Problems**: 3 LeetCode problems (1 Easy, 1 Medium, 1 Med/Hard) + 2 Codeforces problems (1000–1300 and 1300–1600 ratings).
- **Interactive MCQ Assessment**: Knowledge check questions with detailed answer explanations, dry runs, and edge-case justifications.
- **Reference Library**: Complete CS fundamentals (OS, DBMS, Computer Networks, OOP, System Design) to ensure zero context switching.
- **Progress Tracking & Motivation Engine**: Local-first guest state, passwordless sync, Codeforces auto-verification, streaks, and intelligent non-nagging email reminders.

### 1.2 Core Architectural Principles
1. **Content as Data, Not Hardcoded Logic**: Day curriculums, problem catalogues, theory lessons, MCQs, and library articles reside in the database and MDX store. Content updates require zero code redeployment.
2. **Backend-First & Isolated Component Verification**: Every backend component, domain service, database schema, and test suite must be fully built, verified, and passing before frontend UI binding begins.
3. **Optimistic & Resilient Sync**: Guest-first operation with an idempotent merge pipeline when users authenticate via passwordless magic links.
4. **Zero-Fluff, Rate-Limited Integrations**: External API syncs (such as Codeforces submission checks) are queued, cached, and rate-limited to avoid API bans.

---

## 2. System Architecture & Tech Stack Selection

| Layer | Recommended Technology | Justification |
| :--- | :--- | :--- |
| **Runtime & Language** | Node.js (v22+ LTS) / TypeScript | Strict type safety, shared domain models across services and tests. |
| **Database** | Google Cloud Firestore | NoSQL document database, real-time sync, offline persistence, subcollections per user (`users/{uid}/progress/{problemId}`). |
| **Auth** | Firebase Authentication | Passwordless email magic-link, session tokens, seamless guest-to-authenticated linking. |
| **Backend & Cloud Execution** | Firebase Cloud Functions / Node.js TypeScript Services | Serverless functions for Codeforces sync, cron scheduler (Cloud Scheduler), and API endpoints. |
| **Local Testing Harness** | Vitest + Firebase Local Emulator Suite / Mock Engine | Ultra-fast unit testing, isolated Firestore document testing per component without external cloud dependencies. |

---

## 3. Data Model Specification

```
                                +-------------------+
                                |       User        |
                                +-------------------+
                                          |
          +-------------------------------+-------------------------------+
          |                               |                               |
          v                               v                               v
+-------------------+           +-------------------+           +-------------------+
|     Progress      |           |    DayProgress    |           |     Bookmark      |
+-------------------+           +-------------------+           +-------------------+
          |                               |
          v                               v
+-------------------+           +-------------------+           +-------------------+
|      Problem      | <-------+ |        Day        |           |    LibraryPage    |
+-------------------+           +-------------------+           +-------------------+
          |                               |                               |
          | (DayProblem link)             |                               v
          +-------------------------------+                     +-------------------+
                                          |                     |  LibraryProgress  |
                                          v                     +-------------------+
                                +-------------------+
                                |    DayQuestion    | (MCQs with solutions)
                                +-------------------+
                                          |
                                          v
                                +-------------------+
                                |    UserMCQAttempt |
                                +-------------------+
```

### Detailed Entities

1. **User**:
   - `id`: UUID (Primary Key)
   - `email`: String (Unique, Indexed)
   - `verifiedAt`: DateTime?
   - `timezone`: String (Default: 'UTC')
   - `preferredLanguage`: Enum (`java`, `cpp`, `python`)
   - `reminderTime`: String (e.g., "20:00")
   - `reminderPrefs`: JSON (`{ daily: boolean, nudges: boolean, weeklyDigest: boolean }`)
   - `cfHandle`: String?
   - `strictMode`: Boolean (Default: false)
   - `createdAt`, `updatedAt`: DateTime

2. **LoginToken / Session**:
   - `id`: UUID
   - `userId`: UUID (FK -> User)
   - `tokenHash`: String (Unique, Indexed)
   - `expiresAt`: DateTime (15-min TTL)
   - `usedAt`: DateTime?

3. **Day**:
   - `id`: UUID
   - `number`: Integer (Unique, 1–30)
   - `theme`: String (e.g., "Two Pointers & Sliding Window")
   - `summary`: Text
   - `theoryContent`: Text / Path (MDX)
   - `strictOrder`: Integer

4. **Problem**:
   - `id`: UUID
   - `platform`: Enum (`LC`, `CF`)
   - `externalId`: String (e.g., "15", "1850A")
   - `title`: String
   - `url`: String
   - `difficulty`: String (LC: Easy/Med/Hard; CF: rating "1000", "1400")
   - `tags`: String[]
   - `hint`: Text?
   - `expectedTimeComplexity`: String?
   - `expectedSpaceComplexity`: String?
   - `expectedPattern`: String?
   - `status`: Enum (`active`, `broken_link`, `archived`)
   - `lastCheckedAt`: DateTime?

5. **DayProblem** (Join Entity for Problem Reusability):
   - `id`: UUID
   - `dayId`: UUID (FK -> Day)
   - `problemId`: UUID (FK -> Problem)
   - `orderIndex`: Integer (1 to 5)

6. **DayQuestion (MCQ Question & Solution Engine)**:
   - `id`: UUID
   - `dayId`: UUID? (FK -> Day, optional for library-level MCQs)
   - `topic`: String
   - `question`: Text
   - `codeSnippet`: Text? (Optional code block in Java/C++/Python)
   - `options`: JSONB (`[{ "key": "A", "text": "..." }, ...]`)
   - `correctOption`: String ("A", "B", "C", or "D")
   - `detailedExplanation`: Text (Deep breakdown of why the correct option is right and others are traps)
   - `difficulty`: Enum (`easy`, `medium`, `hard`)
   - `orderIndex`: Integer

7. **UserMCQAttempt**:
   - `id`: UUID
   - `userId`: UUID (FK -> User)
   - `questionId`: UUID (FK -> DayQuestion)
   - `selectedOption`: String
   - `isCorrect`: Boolean
   - `attemptedAt`: DateTime

8. **Progress**:
   - `id`: UUID
   - `userId`: UUID (FK -> User)
   - `problemId`: UUID (FK -> Problem)
   - `status`: Enum (`not_started`, `started`, `solved`, `revisit`)
   - `solvedAt`: DateTime?
   - `attemptsCount`: Integer (Default: 0)
   - `personalTimeSeconds`: Integer?
   - `personalNote`: Text?

9. **DayProgress**:
   - `id`: UUID
   - `userId`: UUID (FK -> User)
   - `dayId`: UUID (FK -> Day)
   - `completedAt`: DateTime?

10. **Bookmark**:
    - `id`: UUID
    - `userId`: UUID (FK -> User)
    - `itemType`: Enum (`problem`, `day`, `library_page`)
    - `itemId`: String (UUID or Slug)
    - `label`: String?
    - `createdAt`: DateTime

11. **LibraryPage**:
    - `slug`: String (Primary Key, e.g., "dsa/binary-trees")
    - `section`: Enum (`dsa`, `os`, `dbms`, `cn`, `oop`, `system_design`)
    - `title`: String
    - `orderIndex`: Integer
    - `tags`: String[]
    - `readTimeMinutes`: Integer
    - `content`: Text (MDX)
    - `interviewQuestions`: JSONB (`[{ "q": "...", "a": "..." }]`)

12. **LibraryProgress**:
    - `id`: UUID
    - `userId`: UUID (FK -> User)
    - `slug`: String (FK -> LibraryPage)
    - `readAt`: DateTime

13. **EmailLog**:
    - `id`: UUID
    - `userId`: UUID (FK -> User)
    - `type`: Enum (`magic_link`, `daily_reminder`, `nudge_day1`, `nudge_day3`, `streak_at_risk`, `weekly_digest`, `completion`)
    - `sentAt`: DateTime
    - `status`: Enum (`sent`, `failed`, `bounced`)
    - `idempotencyKey`: String (Unique index: `userId_type_windowDate`)

---

## 4. Component-by-Component Implementation Roadmap

Each backend component is self-contained with its own domain logic, data access, validation schema, API routes, and automated test suite.

```
+---------------------------------------------------------------------------------------------------------+
|                                    PHASE 1: FOUNDATION & SEEDING                                        |
+---------------------------------------------------------------------------------------------------------+
| [Component 1] Core Database, Migrations & Test Database Fixtures                                        |
| [Component 2] Problem Catalogue Engine (CRUD, JSON Seed Importer & URL Health Checker)                 |
| [Component 3] 30-Day Curriculum & Day Mapping Service                                                   |
+---------------------------------------------------------------------------------------------------------+
                                                     |
                                                     v
+---------------------------------------------------------------------------------------------------------+
|                                  PHASE 2: ASSESSMENT & PROGRESS ENGINE                                  |
+---------------------------------------------------------------------------------------------------------+
| [Component 4] MCQ Assessment Engine (Questions, Answer Evaluation & Explanations)                       |
| [Component 5] Progress Tracking & Streak Calculator Service (Timezone-Aware)                            |
| [Component 6] Codeforces Sync & Verification Service (Public API Poller with Rate Limiter)              |
| [Component 7] Bookmarking & Spaced Revisit Queue Service                                                |
+---------------------------------------------------------------------------------------------------------+
                                                     |
                                                     v
+---------------------------------------------------------------------------------------------------------+
|                               PHASE 3: AUTH, MERGE & NOTIFICATIONS ENGINE                               |
+---------------------------------------------------------------------------------------------------------+
| [Component 8] Passwordless Magic-Link Auth & Guest-to-User State Merge Pipeline                         |
| [Component 9] Library & CS Fundamentals Content Service (Full-Text Search & Progress)                   |
| [Component 10] Notification Scheduler & Email Dispatch Engine (15-min Cron, Resend, Idempotency)        |
| [Component 11] Admin Management API & Platform Analytics                                                |
+---------------------------------------------------------------------------------------------------------+
                                                     |
                                                     v
+---------------------------------------------------------------------------------------------------------+
|                                 PHASE 4: FRONTEND UI & INTEGRATION                                      |
+---------------------------------------------------------------------------------------------------------+
| [Component 12] Sheet Grid & Day View UI with MDX & Language Tabs (Java/C++/Python)                      |
| [Component 13] Interactive MCQ Assessment UI & Problem Checkbox Components                              |
| [Component 14] User Dashboard, Bookmarks Hub, Global Search & Settings                                  |
| [Component 15] Admin Panel & End-to-End System Polish                                                   |
+---------------------------------------------------------------------------------------------------------+
```

---

## 5. Detailed Component Specifications & Testing Strategies

### Component 1: Core Database, Migrations & Test Harness
- **Scope**: Set up PostgreSQL connection, Prisma/Drizzle schema definitions, database migrations, connection pooling, and test database runner.
- **Key Deliverables**:
  - `prisma/schema.prisma` or Drizzle schemas for all 13 entities.
  - Initial database migration scripts.
  - Test fixture utilities (`createTestUser`, `clearDatabase`, `seedBaselineDays`).
- **Testing Strategy**:
  - Migration integrity tests.
  - Foreign key and cascade deletion tests (e.g. deleting a user removes progress, bookmarks, and attempts).
  - Unique constraint verification on `(dayId, problemId)` and `idempotencyKey`.

### Component 2: Problem Catalogue Engine & Seeder
- **Scope**: Admin CRUD for problems, JSON seed pipeline, platform metadata validation (LeetCode vs Codeforces format validation), and automated HTTP link health verification.
- **Key Deliverables**:
  - `ProblemService`: `createProblem`, `updateProblem`, `getProblemById`, `queryProblems(filter)`.
  - `ProblemSeedService`: Bulk import from structured JSON files with deduplication.
  - `LinkHealthService`: Automated HTTP status checker with concurrency throttling.
- **Testing Strategy**:
  - Unit tests for Codeforces regex validation (`^\d+[A-Z]\d*$` e.g., `1850A`).
  - Integration test for JSON importer checking duplicate URL handling.
  - Mocked HTTP client testing for broken link detection (200 OK vs 404/500).

### Component 3: 30-Day Curriculum & Day Mapping Service
- **Scope**: Expose Day list (1–30), day metadata (theme, summary, theory reference), DayProblem ordering (5 problems per day: 3 LC, 2 CF), and strict-mode day unlock rules.
- **Key Deliverables**:
  - `DayService`: `getAllDays`, `getDayByNumber(n)`, `getProblemsForDay(dayId)`.
  - Strict-mode unlock validator: determines whether Day N can be accessed based on Day N-1 completion state.
- **Testing Strategy**:
  - Verify every Day contains exactly 5 problem slots in seeded data.
  - Strict mode unit tests: Day 2 is locked when Day 1 incomplete; unlocked when Day 1 is complete.
  - Verify free mode always returns all days as accessible.

### Component 4: MCQ Assessment Engine (Questions & Solutions)
- **Scope**: Provide conceptual quizzes per day/topic. Evaluates user submissions, records attempts, calculates scores, and returns comprehensive explanations.
- **Key Deliverables**:
  - `DayQuestion` CRUD and JSON seeder for curriculum questions.
  - `MCQService`:
    - `getQuestionsForDay(dayId)` (omitting `correctOption` and `detailedExplanation` before submission).
    - `submitAnswer(userId, questionId, selectedOption)`: returns `{ isCorrect, correctOption, detailedExplanation }` and records `UserMCQAttempt`.
    - `getUserDayScore(userId, dayId)`.
- **Testing Strategy**:
  - Unit test verifying question responses hide the correct answer from client payloads.
  - Submission evaluation tests (correct answer returns true, wrong option returns false + explanation).
  - Score aggregation tests for multi-question assessments.

### Component 5: Progress Tracking & Timezone-Aware Streak Calculator
- **Scope**: Problem state machine (`not_started` -> `started` -> `solved` -> `revisit`). Auto-completion of Day when all 5 problems are solved. Calculation of current streak and longest streak using user's local timezone.
- **Key Deliverables**:
  - `ProgressService`: `markProblemStatus`, `recordTimeSpent`, `saveNote`.
  - `StreakService`:
    - Timezone-offset date normalizer.
    - Consecutive active day calculator (checks if >= 1 problem solved per local day).
    - Longest streak tracker.
- **Testing Strategy**:
  - State machine transition tests.
  - Day auto-completion trigger: ticking the 5th problem automatically creates a `DayProgress` record.
  - Edge-case streak tests: crossing midnight in UTC+5:30 vs UTC-8:00, gap of 1 day resetting current streak, same-day multiple solves counting as 1 streak day.

### Component 6: Codeforces Sync & Verification Service
- **Scope**: Optional automatic verification for users who register their Codeforces handle. Calls the public Codeforces API (`user.status`), checks for `VERDICT: OK`, matches contestId + index, and auto-marks matching problems as solved.
- **Key Deliverables**:
  - `CodeforcesClient`: Axios/fetch client with 2-second rate-limiting per handle and in-memory/Redis caching.
  - `CodeforcesSyncService`: matches CF submission `problem.contestId` + `problem.index` against active database problems, marks `solved` in `Progress` with submission timestamp.
- **Testing Strategy**:
  - Mocked CF API responses (Accepted, Wrong Answer, Compilation Error).
  - Rate-limit enforcement tests.
  - Verify non-CF problems are unaffected by sync.

### Component 7: Bookmarking & Spaced Revisit Queue Service
- **Scope**: Generic bookmarking across problems, days, and library pages. Separate spaced-repetition "Revisit" queue for problems marked for revision.
- **Key Deliverables**:
  - `BookmarkService`: `toggleBookmark(userId, itemType, itemId, label)`, `listBookmarks(userId, filters)`.
  - `RevisitService`: `getPendingRevisits(userId, olderThanDays: 7)`.
- **Testing Strategy**:
  - Star toggle idempotency tests.
  - Polymorphic ID validation (ensures valid problem/day/library IDs).
  - Revisit list filters correctly by age (>= 7 days since marked).

### Component 8: Passwordless Auth & Guest-to-User State Merge Engine
- **Scope**: Email-only login using single-use 15-minute magic links and 6-digit OTPs. High-integrity merge engine that takes localStorage state (from guest) and merges with database upon first login, resolving conflicts using the latest timestamp.
- **Key Deliverables**:
  - `AuthService`: `generateMagicLink(email)`, `verifyToken(tokenHash)`.
  - `MergeService`: `mergeGuestState(userId, guestPayload: { progress, bookmarks, notes, mcqAttempts })`.
- **Testing Strategy**:
  - Token expiry tests (valid at 14 mins, rejected at 16 mins).
  - Single-use validation (subsequent attempts with the same token fail).
  - Conflict resolution test: guest problem solved at 10:00 AM vs cloud solved at 11:00 AM -> keeps cloud; guest solved at 2:00 PM vs cloud solved at 11:00 AM -> overwrites with guest.

### Component 9: Library & CS Fundamentals Content Service
- **Scope**: Serves structured theory pages across DSA, OS, DBMS, Computer Networks, OOP, and System Design. Integrated full-text search with filtering by section and tags.
- **Key Deliverables**:
  - `LibraryService`: `getPageBySlug(slug)`, `listSectionPages(section)`, `markPageAsRead(userId, slug)`.
  - `SearchService`: Full-text search across library titles, content, problems, and day themes.
- **Testing Strategy**:
  - Search ranking and tag filtering tests.
  - Read completion percentage calculations per section.
  - Cross-linking validation: verifying all related problem IDs referenced in library front matter exist in the database.

### Component 10: Notification Scheduler & Email Dispatch Engine
- **Scope**: 15-minute cron worker checking user reminder windows, active streaks, and inactive days. Dispatches emails via Resend with guaranteed idempotency and unsubscribe compliance.
- **Key Deliverables**:
  - `SchedulerService`: cron tick every 15 minutes.
  - `ReminderEvaluator`:
    - Daily reminder (scheduled at user's local `reminderTime`).
    - Streak-at-risk warning (sent at 8 PM local time if streak >= 3 and 0 solves today).
    - Inactivity nudge: Day 1 and Day 3 inactivity triggers, then stops.
    - Weekly Sunday digest.
  - `EmailDispatcher`: Resend SDK wrapper recording `EmailLog` with unique idempotency keys.
- **Testing Strategy**:
  - Idempotency test: duplicate cron execution within the same window does not send duplicate emails.
  - Inactivity window tests: verifies no email is sent on Day 2, Day 4+, or to unsubscribed users.
  - Timezone window test: 8 PM reminder fires only when user's local time matches the current 15-minute slot.

### Component 11: Admin Management API & Platform Analytics
- **Scope**: Admin endpoints for day configuration, problem reassignment, broadcast announcements, email delivery inspection, and platform funnel metrics.
- **Key Deliverables**:
  - Admin auth guard (`role: 'admin'`).
  - Day & Problem CRUD API.
  - Link health report API.
  - Funnel metrics API (User signups, Day 1 completion, Day 7 retention, Day 30 finish).
- **Testing Strategy**:
  - Unauthorized access blocked (403 for non-admin users).
  - Content versioning and audit trail logging.
  - Analytical aggregation queries accuracy tests.

---

## 6. Implementation Timeline & Milestone Schedule

```
========================================================================================================
TIMELINE OVERVIEW: 100% TESTED BACKEND FIRST -> FRONTEND UI BINDING
========================================================================================================
Phase 1: Database & Foundation          [Components 1 - 3]   -> Schema, Seed, 30-Day Plan, Problems
Phase 2: Assessments & Progress Core    [Components 4 - 7]   -> MCQs, Streaks, CF Sync, Bookmarks
Phase 3: Auth, Sync & Notifications     [Components 8 - 11]  -> Magic Link, Merge, Library, Emails, Admin
Phase 4: Frontend UI & Interactive App  [Components 12 - 15] -> Sheet, Day Page, Tabs, MCQs, Dashboard
========================================================================================================
```

| Phase & Milestone | Focus Components | Key Backend Deliverables | Testing & Verification Gate |
| :--- | :--- | :--- | :--- |
| **Milestone 1**<br>Core Schema & Problem Seeder | **Component 1**<br>**Component 2** | • Database schemas & migrations<br>• Problem CRUD API<br>• JSON bulk seeder<br>• Link health checker service | `100% Passing (7 tests)`<br>• Format validation<br>• Link checker mock test<br>• Seeder integrity test |
| **Milestone 2**<br>30-Day Curriculum & MCQ Engine | **Component 3**<br>**Component 4** | • Day curriculum mapping (1–30)<br>• Strict mode gating logic<br>• MCQ question CRUD & answer verification<br>• Explanation delivery engine | `100% Passing (10 tests)`<br>• 5-problem slot invariant<br>• Answer hiding & score validation<br>• Explanation delivery test |
| **Milestone 3**<br>Progress, Streaks & CF Sync | **Component 5**<br>**Component 6**<br>**Component 7** | • Problem state transitions<br>• Timezone-aware streak engine<br>• Codeforces submission sync worker<br>• Bookmarks & spaced revisit service | `100% Passing (10 tests)`<br>• Timezone streak calculations<br>• CF rate limiter & parser<br>• Bookmark & revisit queue tests |
| **Milestone 4**<br>Auth, Merge & Email Scheduler | **Component 8**<br>**Component 9**<br>**Component 10**<br>**Component 11** | • Magic-link / OTP authentication<br>• Guest-to-cloud merge engine<br>• Library & search service<br>• 15-min cron & Resend email engine<br>• Admin metrics & link dashboard | `100% Passing (15 tests)`<br>• Merge conflict resolution tests<br>• Full-text search precision<br>• Email idempotency & cron window tests |
| **Milestone 5**<br>Frontend Day View & Language Tabs | **Component 12**<br>**Component 13** | • 30-Day grid page<br>• Day view with MDX theory<br>• Language tabs (Java, C++, Python)<br>• Interactive MCQ quiz component<br>• Problem solve & done checkboxes | `Integration UI & E2E Tests`<br>• Fast language tab switching<br>• Instant optimistic ticks<br>• MCQ solution reveal on submit |
| **Milestone 6**<br>Dashboard, Search & Final Polish | **Component 14**<br>**Component 15** | • User dashboard (streaks, ring, stats)<br>• Global search modal (`Cmd+K`)<br>• Admin management portal<br>• Mobile responsive polish | `Full E2E Flow Validation`<br>• Guest-to-signup onboarding loop<br>• Zero console errors<br>• Lighthouse score > 90 on mobile |

> **Current Backend Verification Status**: **42 / 42 Tests Passing (100% Coverage across Components 1 through 11)**. Ready for Frontend UI Binding.

---

## 7. Execution Protocol

1. **Step-by-Step Backend Build**: Every single component will be created with its TypeScript types, domain service, database access logic, route handlers, and unit/integration tests.
2. **Explicit User Approval Gates**: Before moving from one milestone to the next, test output will be presented to confirm 100% verification.
3. **No Premature Frontend Work**: Frontend code will only be implemented once all corresponding backend APIs and services are verified and tested.

