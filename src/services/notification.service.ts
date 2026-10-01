import { UserProfile, EmailType, EmailLog, Problem } from "../types/index.js";
import { StreakService } from "./streak.service.js";
import { ProgressService } from "./progress.service.js";
import { CurriculumService } from "./curriculum.service.js";
import { ProblemService } from "./problem.service.js";
import { EmailTemplateService } from "./email-template.service.js";
import { getFirestoreDb } from "../db/firestore.js";

export interface EmailDispatchPayload {
  to: string;
  subject: string;
  type: EmailType;
  body: string;
  html?: string;
  text?: string;
  deepLink: string;
}

export type EmailSenderFunction = (
  payload: EmailDispatchPayload
) => Promise<{ success: boolean; messageId?: string; error?: string }>;

export class NotificationService {
  private logCollection = "email_logs";

  constructor(
    private progressService: ProgressService,
    private curriculumService: CurriculumService,
    private db: any = getFirestoreDb(),
    private emailSender: EmailSenderFunction = async () => ({
      success: true,
      messageId: "mock_msg_id",
    }),
    private problemService?: ProblemService
  ) {}

  getIdempotencyKey(userId: string, type: EmailType, dateStr: string): string {
    return `${userId}_${type}_${dateStr}`;
  }

  async hasAlreadySent(idempotencyKey: string): Promise<boolean> {
    const doc = await this.db.collection(this.logCollection).doc(idempotencyKey).get();
    return doc.exists && doc.data()?.status === "sent";
  }

  async recordLog(
    idempotencyKey: string,
    userId: string,
    type: EmailType,
    status: "sent" | "failed"
  ): Promise<void> {
    const log: EmailLog = {
      id: idempotencyKey,
      userId,
      type,
      sentAt: new Date().toISOString(),
      status,
      idempotencyKey,
    };
    await this.db.collection(this.logCollection).doc(idempotencyKey).set(log);
  }

  async evaluateAndSendForUser(
    user: UserProfile,
    referenceDate: Date = new Date(),
    baseUrl: string = "https://interviewprep.app"
  ): Promise<{ sent: EmailType[]; skipped: EmailType[] }> {
    const sent: EmailType[] = [];
    const skipped: EmailType[] = [];

    // Guard: Unverified users or unsubscribed users never receive reminders
    if (!user.verifiedAt || user.subscriptionStatus === "unsubscribed") {
      return { sent, skipped };
    }

    const localDateStr = StreakService.getLocalDateString(referenceDate, user.timezone);
    const localTimeStr = this.getLocalTimeString(referenceDate, user.timezone); // "HH:mm"

    const completedDayNumbers = await this.progressService.getAllCompletedDayNumbers(user.id);
    const nextDayNumber = this.curriculumService.findFirstIncompleteDay(completedDayNumbers);

    const streaks = await this.progressService.getUserStreaks(
      user.id,
      user.timezone,
      referenceDate
    );

    // 1. Daily Reminder Check with Complete Problem Itinerary
    if (user.reminderPrefs.daily) {
      const userReminderHour = parseInt(user.reminderTime.split(":")[0], 10);
      const currentLocalHour = parseInt(localTimeStr.split(":")[0], 10);

      if (userReminderHour === currentLocalHour) {
        const idempKey = this.getIdempotencyKey(user.id, "daily_reminder", localDateStr);
        const alreadySent = await this.hasAlreadySent(idempKey);

        if (!alreadySent) {
          const day = await this.curriculumService.getDayByNumber(nextDayNumber);
          const problems: Problem[] = [];

          if (day && this.problemService) {
            for (const pid of day.problemIds) {
              const prob = await this.problemService.getProblemById(pid);
              if (prob) problems.push(prob);
            }
          }

          let subject = `Day ${nextDayNumber} is waiting for you!`;
          let body = `Keep your momentum going! Day ${nextDayNumber} theory and 5 handpicked problems are ready.`;
          let html: string | undefined;
          let text: string | undefined;

          if (day && problems.length > 0) {
            const formatted = EmailTemplateService.buildDailyItineraryEmail(
              user,
              day,
              problems,
              streaks,
              baseUrl
            );
            subject = formatted.subject;
            html = formatted.html;
            text = formatted.text;
            body = text;
          }

          const res = await this.emailSender({
            to: user.email,
            type: "daily_reminder",
            subject,
            body,
            html,
            text,
            deepLink: `${baseUrl}/day/${nextDayNumber}`,
          });

          if (res.success) {
            await this.recordLog(idempKey, user.id, "daily_reminder", "sent");
            sent.push("daily_reminder");
          } else {
            await this.recordLog(idempKey, user.id, "daily_reminder", "failed");
          }
        } else {
          skipped.push("daily_reminder");
        }
      }
    }

    // 2. Streak At Risk Warning (between 19:00 - 21:00 if streak >= 3 and 0 solves today)
    const solvedToday = streaks.lastActiveLocalDate === localDateStr;

    if (
      user.reminderPrefs.streakWarning !== false &&
      streaks.currentStreak >= 3 &&
      !solvedToday
    ) {
      const currentLocalHour = parseInt(localTimeStr.split(":")[0], 10);
      if (currentLocalHour >= 19 && currentLocalHour <= 21) {
        const idempKey = this.getIdempotencyKey(user.id, "streak_at_risk", localDateStr);
        const alreadySent = await this.hasAlreadySent(idempKey);

        if (!alreadySent) {
          const res = await this.emailSender({
            to: user.email,
            type: "streak_at_risk",
            subject: `Your ${streaks.currentStreak}-day streak is at risk!`,
            body: `Don't let your hard work break. Solve 1 problem today to keep your streak alive!`,
            deepLink: `${baseUrl}/day/${nextDayNumber}`,
          });

          if (res.success) {
            await this.recordLog(idempKey, user.id, "streak_at_risk", "sent");
            sent.push("streak_at_risk");
          }
        } else {
          skipped.push("streak_at_risk");
        }
      }
    }

    // 3. Inactivity Nudge: Day 1 and Day 3 only (never nag indefinitely)
    if (user.reminderPrefs.nudges && streaks.lastActiveLocalDate) {
      const lastDate = new Date(streaks.lastActiveLocalDate + "T00:00:00Z");
      const todayDate = new Date(localDateStr + "T00:00:00Z");
      const daysInactive = Math.round(
        (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysInactive === 1) {
        const idempKey = this.getIdempotencyKey(user.id, "nudge_day1", localDateStr);
        if (!(await this.hasAlreadySent(idempKey))) {
          await this.emailSender({
            to: user.email,
            type: "nudge_day1",
            subject: "Quick check-in on your interview prep",
            body: `We noticed you took a break yesterday. Ready to dive back into Day ${nextDayNumber}?`,
            deepLink: `${baseUrl}/day/${nextDayNumber}`,
          });
          await this.recordLog(idempKey, user.id, "nudge_day1", "sent");
          sent.push("nudge_day1");
        }
      } else if (daysInactive === 3) {
        const idempKey = this.getIdempotencyKey(user.id, "nudge_day3", localDateStr);
        if (!(await this.hasAlreadySent(idempKey))) {
          await this.emailSender({
            to: user.email,
            type: "nudge_day3",
            subject: "Still preparing? We're here when you're ready",
            body: "No spam, this is our final reminder. Your progress is saved whenever you choose to return.",
            deepLink: `${baseUrl}/day/${nextDayNumber}`,
          });
          await this.recordLog(idempKey, user.id, "nudge_day3", "sent");
          sent.push("nudge_day3");
        }
      }
    }

    return { sent, skipped };
  }

  private getLocalTimeString(date: Date, timezone: string): string {
    try {
      const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      return formatter.format(date); // "HH:mm"
    } catch {
      return date.toISOString().split("T")[1].slice(0, 5);
    }
  }
}
