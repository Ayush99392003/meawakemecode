import crypto from "node:crypto";
import { UserProfile } from "../types/index.js";
import { getFirestoreDb } from "../db/firestore.js";

export interface MagicTokenRecord {
  tokenHash: string;
  userId: string;
  email: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

export class AuthService {
  private tokenCollection = "login_tokens";
  private userCollection = "users";

  constructor(private db: any = getFirestoreDb()) {}

  static hashToken(rawToken: string): string {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
  }

  async generateMagicLink(
    email: string,
    existingUserId?: string
  ): Promise<{ rawToken: string; expiresAt: string; userId: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const userId = existingUserId || `usr_${crypto.randomBytes(8).toString("hex")}`;
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = AuthService.hashToken(rawToken);

    // 15-minute TTL per spec
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    const record: MagicTokenRecord = {
      tokenHash,
      userId,
      email: cleanEmail,
      expiresAt,
      usedAt: null,
      createdAt: now,
    };

    await this.db.collection(this.tokenCollection).doc(tokenHash).set(record);

    return { rawToken, expiresAt, userId };
  }

  async verifyMagicToken(rawToken: string): Promise<{ userId: string; email: string }> {
    const tokenHash = AuthService.hashToken(rawToken);
    const docRef = this.db.collection(this.tokenCollection).doc(tokenHash);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error("Invalid or expired authentication link.");
    }

    const data = doc.data() as MagicTokenRecord;

    if (data.usedAt) {
      throw new Error("Authentication link has already been used.");
    }

    if (new Date(data.expiresAt).getTime() < Date.now()) {
      throw new Error("Authentication link has expired (15-minute validity).");
    }

    // Mark as used
    await docRef.update({ usedAt: new Date().toISOString() });

    // Ensure User profile exists or initialize defaults
    await this.ensureUserProfile(data.userId, data.email);

    return { userId: data.userId, email: data.email };
  }

  async ensureUserProfile(userId: string, email: string): Promise<UserProfile> {
    const userRef = this.db.collection(this.userCollection).doc(userId);
    const doc = await userRef.get();
    const now = new Date().toISOString();

    if (doc.exists) {
      const existing = doc.data() as UserProfile;
      if (!existing.verifiedAt) {
        await userRef.update({ verifiedAt: now, updatedAt: now });
        existing.verifiedAt = now;
      }
      return existing;
    }

    const newProfile: UserProfile = {
      id: userId,
      email: email.trim().toLowerCase(),
      verifiedAt: now,
      timezone: "UTC",
      preferredLanguage: "cpp",
      reminderTime: "20:00",
      reminderPrefs: {
        daily: true,
        nudges: true,
        weeklyDigest: true,
        streakWarning: true,
      },
      subscriptionStatus: "active",
      unsubscribeToken: crypto.randomBytes(16).toString("hex"),
      cfHandle: null,
      strictMode: false,
      createdAt: now,
      updatedAt: now,
    };

    await userRef.set(newProfile);
    return newProfile;
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const doc = await this.db.collection(this.userCollection).doc(userId).get();
    if (!doc.exists) return null;
    return doc.data() as UserProfile;
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const userRef = this.db.collection(this.userCollection).doc(userId);
    const doc = await userRef.get();
    if (!doc.exists) throw new Error(`User '${userId}' not found.`);

    const updated = {
      ...doc.data(),
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await userRef.set(updated, { merge: true });
    return updated as UserProfile;
  }
}

