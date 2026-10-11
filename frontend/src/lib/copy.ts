// Microcopy library — warm, encouraging, never guilt-inducing
// One file for easy editing and consistent tone

export const greetings = {
  newUser: "Welcome. 30 days, 5 problems a day. Start with Day 1.",
  active: (day: number) => `Day ${day} of 30. Let's get it done.`,
  behind: (day: number) => `Welcome back. Today is Day ${day}. Start with one problem.`,
  doneToday: (day: number) => `Day ${day} done. See you tomorrow.`,
  allDone: "You did it. 30 days, 150 problems. What a journey.",
} as const;

export const streakMessages = {
  milestone3: "3 days straight. Building momentum.",
  milestone7: "A full week. You've earned a streak freeze ❄️",
  milestone14: "Two weeks of consistency. That's rare.",
  milestone21: "Three weeks. You're in the top tier.",
  milestone30: "30 days. Every single one. Legendary.",
} as const;

export const dayComplete = {
  praise: [
    "Solid work today.",
    "Another day in the books.",
    "Clean sweep.",
    "That's the way.",
    "Five for five.",
    "Consistent. Keep it going.",
    "Done and done.",
    "One more day closer.",
  ] as const,
  
  getPraise: () => {
    const idx = Math.floor(Math.random() * dayComplete.praise.length);
    return dayComplete.praise[idx];
  },
} as const;

export const weekComplete = {
  message: (week: number, daysLeft: number) =>
    `Week ${week} cleared${daysLeft > 0 ? `, ${daysLeft} days to go` : ''}`,
} as const;

export const missedDay = {
  message: (day: number) =>
    `You missed Day ${day}. Streak reset. Today is a new start.`,
} as const;

export const locked = {
  message: (currentDay: number) =>
    `Locked. Finish Day ${currentDay} first.`,
  peekAvailable: "You can read the theory, but problems are locked.",
} as const;

export const hints = {
  tryFirst: "Try for 20 minutes first",
} as const;

export const empty = {
  bookmarks: "Nothing saved yet. Tap the star on anything to keep it here.",
  search: "Search for problems, days, or library topics.",
  notes: "Add a note about your approach or key insight.",
} as const;

export const offline = {
  banner: "Progress is saved on this device.",
  sync: "You're offline. Changes will sync when you reconnect.",
} as const;

export const guest = {
  banner: "Progress is saved on this device only. Add your email to keep it safe.",
  button: "Save progress",
} as const;

export const encouragement = [
  "Small steps, big results.",
  "Every problem solved is a problem understood.",
  "Consistency beats intensity.",
  "You're building something permanent.",
  "The only way out is through.",
  "Trust the process.",
  "One problem at a time.",
  "You're closer than you think.",
] as const;

export function getRandomEncouragement(): string {
  const idx = Math.floor(Math.random() * encouragement.length);
  return encouragement[idx];
}
