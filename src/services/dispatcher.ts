import { createSmtpSender } from "./mailer.service.js";
import { EmailTemplateService } from "./email-template.service.js";

const sender = createSmtpSender();

export async function sendBadgeNotification(
  toEmail: string,
  badgeTitle: string,
  badgeType: "day" | "week" | "streak",
  details: { dayNumber?: number; streakCount?: number; weekNumber?: number; totalSolved?: number }
) {
  const email = EmailTemplateService.buildBadgeEarnedEmail(toEmail, badgeTitle, badgeType, details);
  console.log(`[Email Dispatcher] Sending Badge Earned Email to ${toEmail}: ${email.subject}`);
  return await sender({
    to: toEmail,
    subject: email.subject,
    type: "streak_freeze_earned",
    body: email.text,
    html: email.html,
    text: email.text,
    deepLink: "https://meawakemecode-8a35b.web.app/me",
  });
}

export async function sendTrashWarningNotification(
  toEmail: string,
  dayNumber: number,
  hoursLeft: number = 3,
  currentStreak: number = 0
) {
  const email = EmailTemplateService.buildTrashBadgeWarningEmail(toEmail, dayNumber, hoursLeft, currentStreak);
  console.log(`[Email Dispatcher] Sending Trash Warning Email to ${toEmail}: ${email.subject}`);
  return await sender({
    to: toEmail,
    subject: email.subject,
    type: "daily_reminder",
    body: email.text,
    html: email.html,
    text: email.text,
    deepLink: `https://meawakemecode-8a35b.web.app/day/${dayNumber}`,
  });
}

export async function sendToughLoveNotification(
  toEmail: string,
  missedDay: number,
  missedCount: number = 1,
  roastQuote?: string
) {
  const defaultQuote =
    roastQuote ||
    "You had hours to doomscroll, play games, and make excuses, but zero minutes to write code. Stop complaining about the job market when you refuse to do the work.";
  const email = EmailTemplateService.buildToughLoveAccountabilityEmail(toEmail, missedDay, missedCount, defaultQuote);
  console.log(`[Email Dispatcher] Sending Tough Love Email to ${toEmail}: ${email.subject}`);
  return await sender({
    to: toEmail,
    subject: email.subject,
    type: "inactivity_nudge",
    body: email.text,
    html: email.html,
    text: email.text,
    deepLink: `https://meawakemecode-8a35b.web.app/day/${missedDay}`,
  });
}

export async function sendWelcomeNotification(toEmail: string) {
  const email = EmailTemplateService.buildWelcomeEmail(toEmail);
  console.log(`[Email Dispatcher] Sending Welcome Email to ${toEmail}: ${email.subject}`);
  return await sender({
    to: toEmail,
    subject: email.subject,
    type: "welcome_onboarding",
    body: email.text,
    html: email.html,
    text: email.text,
    deepLink: "https://meawakemecode-8a35b.web.app/day/1",
  });
}

export async function sendDailyItineraryNotification(
  toEmail: string,
  day: { number: number; theme: string; summary: string },
  problems: Array<{ title: string; platform: string; difficulty: string; url: string; expectedTimeComplexity?: string | null }>,
  streaks: { currentStreak: number; longestStreak: number } = { currentStreak: 0, longestStreak: 0 }
) {
  const email = EmailTemplateService.buildDailyItineraryEmail(
    { email: toEmail },
    day,
    problems,
    streaks,
    process.env.APP_BASE_URL || "https://meawakemecode-8a35b.web.app"
  );
  console.log(`[Email Dispatcher] Sending Daily Itinerary Email to ${toEmail}: ${email.subject}`);
  return await sender({
    to: toEmail,
    subject: email.subject,
    type: "daily_reminder",
    body: email.text,
    html: email.html,
    text: email.text,
    deepLink: `https://meawakemecode-8a35b.web.app/day/${day.number}`,
  });
}



