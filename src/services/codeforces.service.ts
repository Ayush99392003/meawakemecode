import { Problem } from "../types/index.js";
import { ProblemService } from "./problem.service.js";
import { ProgressService } from "./progress.service.js";

export interface CFSubmission {
  id: number;
  contestId: number;
  creationTimeSeconds: number;
  problem: {
    contestId: number;
    index: string;
    name: string;
  };
  verdict: string; // "OK", "WRONG_ANSWER", etc.
}

export interface CFSyncResult {
  handle: string;
  totalSubmissionsChecked: number;
  acceptedSubmissions: number;
  verifiedCount: number;
  autoSolvedProblemIds: string[];
}

export class CodeforcesService {
  private static lastCallTimes = new Map<string, number>();
  private minIntervalMs = 2000; // 2 seconds rate limit per handle

  constructor(
    private problemService: ProblemService,
    private progressService: ProgressService,
    private fetchFn: typeof fetch = fetch
  ) {}

  async syncUserHandle(userId: string, handle: string): Promise<CFSyncResult> {
    const cleanHandle = handle.trim();
    if (!cleanHandle) {
      throw new Error("Codeforces handle cannot be empty");
    }

    // Rate limiting check
    const now = Date.now();
    const lastCall = CodeforcesService.lastCallTimes.get(cleanHandle) || 0;
    if (now - lastCall < this.minIntervalMs) {
      const waitTime = Math.ceil((this.minIntervalMs - (now - lastCall)) / 1000);
      throw new Error(`Codeforces rate limit: Please wait ${waitTime}s before syncing again.`);
    }
    CodeforcesService.lastCallTimes.set(cleanHandle, now);

    const url = `https://codeforces.com/api/user.status?handle=${encodeURIComponent(
      cleanHandle
    )}&from=1&count=100`;

    const response = await this.fetchFn(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch Codeforces data: HTTP ${response.status}`);
    }

    const payload = (await response.json()) as { status: string; result?: CFSubmission[] };
    if (payload.status !== "OK" || !Array.isArray(payload.result)) {
      throw new Error("Invalid response format from Codeforces API");
    }

    const submissions = payload.result;
    const acceptedMap = new Map<string, number>(); // externalId -> earliest solved timestamp

    for (const sub of submissions) {
      if (sub.verdict === "OK" && sub.problem?.contestId && sub.problem?.index) {
        const externalId = `${sub.problem.contestId}${sub.problem.index.toUpperCase()}`;
        const solvedAt = sub.creationTimeSeconds * 1000;
        if (!acceptedMap.has(externalId) || solvedAt < acceptedMap.get(externalId)!) {
          acceptedMap.set(externalId, solvedAt);
        }
      }
    }

    // Get all CF problems from our catalog
    const allCfProblems = await this.problemService.listProblems({ platform: "CF" });
    const autoSolvedProblemIds: string[] = [];

    for (const problem of allCfProblems) {
      if (acceptedMap.has(problem.externalId)) {
        const solvedAtIso = new Date(acceptedMap.get(problem.externalId)!).toISOString();
        await this.progressService.updateProblemProgress({
          userId,
          problemId: problem.id,
          status: "solved",
          solvedAt: solvedAtIso,
        });
        autoSolvedProblemIds.push(problem.id);
      }
    }

    return {
      handle: cleanHandle,
      totalSubmissionsChecked: submissions.length,
      acceptedSubmissions: acceptedMap.size,
      verifiedCount: autoSolvedProblemIds.length,
      autoSolvedProblemIds,
    };
  }
}

