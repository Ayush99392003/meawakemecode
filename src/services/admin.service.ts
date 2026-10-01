import { ProblemService } from "./problem.service.js";
import { CurriculumService } from "./curriculum.service.js";
import { getFirestoreDb } from "../db/firestore.js";

export interface FunnelMetrics {
  totalRegisteredUsers: number;
  usersCompletedDay1: number;
  usersCompletedDay7: number;
  usersCompletedDay30: number;
  brokenProblemsCount: number;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  postedAt: string;
}

export class AdminService {
  constructor(
    private problemService: ProblemService,
    private curriculumService: CurriculumService,
    private db: any = getFirestoreDb()
  ) {}

  async createAnnouncement(title: string, message: string): Promise<Announcement> {
    const id = `ann_${Date.now()}`;
    const announcement: Announcement = {
      id,
      title,
      message,
      postedAt: new Date().toISOString(),
    };

    await this.db.collection("announcements").doc(id).set(announcement);
    return announcement;
  }

  async getPlatformFunnelMetrics(): Promise<FunnelMetrics> {
    const usersSnap = await this.db.collection("users").get();
    const totalRegisteredUsers = usersSnap.docs.length;

    let usersCompletedDay1 = 0;
    let usersCompletedDay7 = 0;
    let usersCompletedDay30 = 0;

    for (const userDoc of usersSnap.docs) {
      const dayProgSnap = await this.db
        .collection("users")
        .doc(userDoc.id)
        .collection("day_progress")
        .get();

      const dayIds = new Set(dayProgSnap.docs.map((d: any) => d.id));
      if (dayIds.has("day_1")) usersCompletedDay1++;
      if (dayIds.has("day_7")) usersCompletedDay7++;
      if (dayIds.has("day_30")) usersCompletedDay30++;
    }

    const brokenProblems = await this.problemService.listProblems({ status: "broken_link" });

    return {
      totalRegisteredUsers,
      usersCompletedDay1,
      usersCompletedDay7,
      usersCompletedDay30,
      brokenProblemsCount: brokenProblems.length,
    };
  }
}

