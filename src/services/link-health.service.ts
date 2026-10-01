import { ProblemService } from "./problem.service.js";

export interface LinkCheckResult {
  problemId: string;
  url: string;
  status: "active" | "broken_link";
  statusCode?: number;
  error?: string;
}

export type FetchFunction = (url: string, options?: any) => Promise<{ status: number; ok: boolean }>;

export class LinkHealthService {
  constructor(
    private problemService: ProblemService,
    private fetchFn: FetchFunction = fetch
  ) {}

  async checkSingleUrl(url: string, timeoutMs: number = 8000): Promise<{ status: "active" | "broken_link"; statusCode?: number; error?: string }> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await this.fetchFn(url, {
        method: "HEAD",
        signal: controller.signal,
        headers: {
          "User-Agent": "InterviewPrepPlatform-LinkChecker/1.0",
        },
      });
      clearTimeout(timer);

      // Status 200-399 or 403 (LeetCode/Cloudflare bot-guard might return 403 to HEAD requests, which means the page exists)
      if (response.status < 400 || response.status === 403) {
        return { status: "active", statusCode: response.status };
      }

      if (response.status === 404 || response.status === 410) {
        return { status: "broken_link", statusCode: response.status };
      }

      return { status: "broken_link", statusCode: response.status, error: `HTTP ${response.status}` };
    } catch (err: any) {
      return { status: "broken_link", error: err.message || "Network error" };
    }
  }

  async verifyAndUpdateProblem(problemId: string): Promise<LinkCheckResult> {
    const problem = await this.problemService.getProblemById(problemId);
    if (!problem) {
      throw new Error(`Problem ${problemId} not found`);
    }

    const check = await this.checkSingleUrl(problem.url);
    if (check.status !== problem.status) {
      await this.problemService.updateProblem(problemId, {
        status: check.status,
      });
    }

    return {
      problemId,
      url: problem.url,
      ...check,
    };
  }

  async runBatchHealthCheck(limit: number = 50): Promise<LinkCheckResult[]> {
    const problems = await this.problemService.listProblems();
    const toCheck = problems.slice(0, limit);
    const results: LinkCheckResult[] = [];

    for (const p of toCheck) {
      const result = await this.verifyAndUpdateProblem(p.id);
      results.push(result);
    }

    return results;
  }
}

