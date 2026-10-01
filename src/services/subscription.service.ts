import { UserProfile, UserReminderPrefs } from "../types/index.js";
import { getFirestoreDb } from "../db/firestore.js";

export class SubscriptionService {
  private collectionName = "users";

  constructor(private db: any = getFirestoreDb()) {}

  static isValidTimeFormat(timeStr: string): boolean {
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return regex.test(timeStr);
  }

  static isValidTimezone(tz: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Subscribes a user to daily reminders at their chosen time and timezone.
   */
  async subscribeToReminders(
    userId: string,
    options: {
      reminderTime: string; // e.g. "08:30" or "20:00"
      timezone: string; // e.g. "Asia/Kolkata", "America/New_York"
      daily?: boolean;
      nudges?: boolean;
      weeklyDigest?: boolean;
      streakWarning?: boolean;
    }
  ): Promise<UserProfile> {
    if (!SubscriptionService.isValidTimeFormat(options.reminderTime)) {
      throw new Error(`Invalid reminder time format: '${options.reminderTime}'. Must be HH:mm (24-hour).`);
    }

    if (!SubscriptionService.isValidTimezone(options.timezone)) {
      throw new Error(`Invalid IANA timezone: '${options.timezone}'.`);
    }

    const userRef = this.db.collection(this.collectionName).doc(userId);
    const doc = await userRef.get();

    if (!doc.exists) {
      throw new Error(`User '${userId}' not found.`);
    }

    const currentData = doc.data() as UserProfile;
    const now = new Date().toISOString();

    const updatedPrefs: UserReminderPrefs = {
      ...currentData.reminderPrefs,
      daily: options.daily ?? true,
      nudges: options.nudges ?? currentData.reminderPrefs.nudges ?? true,
      weeklyDigest: options.weeklyDigest ?? currentData.reminderPrefs.weeklyDigest ?? true,
      streakWarning: options.streakWarning ?? currentData.reminderPrefs.streakWarning ?? true,
    };

    const updatedProfile: UserProfile = {
      ...currentData,
      reminderTime: options.reminderTime,
      timezone: options.timezone,
      reminderPrefs: updatedPrefs,
      subscriptionStatus: "active",
      updatedAt: now,
    };

    await userRef.set(updatedProfile, { merge: true });
    return updatedProfile;
  }

  /**
   * 1-Click unsubscribe from email reminders using secure verification token.
   */
  async unsubscribe(userId: string, token: string): Promise<{ success: boolean; message: string }> {
    const userRef = this.db.collection(this.collectionName).doc(userId);
    const doc = await userRef.get();

    if (!doc.exists) {
      throw new Error(`User not found.`);
    }

    const user = doc.data() as UserProfile;

    if (user.unsubscribeToken !== token) {
      throw new Error(`Invalid or expired unsubscribe token.`);
    }

    const updatedProfile = {
      ...user,
      subscriptionStatus: "unsubscribed",
      reminderPrefs: {
        ...user.reminderPrefs,
        daily: false,
        nudges: false,
        weeklyDigest: false,
        streakWarning: false,
      },
      updatedAt: new Date().toISOString(),
    };

    await userRef.set(updatedProfile, { merge: true });
    return { success: true, message: "Successfully unsubscribed from all email reminders." };
  }
}

