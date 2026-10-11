import daysData from '@/data/curriculum/days_30.json';
import problemsData from '@/data/problems/problems_catalog.json';
import libraryData from '@/data/library/library_catalog.json';
import csDailyData from '@/data/curriculum/cs_fundamentals_daily.json';
import sdDailyData from '@/data/curriculum/system_design_daily.json';
import dsaMcqsData from '@/data/mcqs/all_30_days_mcqs.json';
import csMcqsData from '@/data/mcqs/cs_fundamentals_daily_mcqs.json';
import sdMcqsData from '@/data/mcqs/system_design_daily_mcqs.json';

// Types matching the data
export interface DayData {
  id: string;
  number: number;
  theme: string;
  summary: string;
  strictOrder: number;
  problemIds: string[];
}

export interface ProblemData {
  id: string;
  platform: 'LC' | 'CF';
  externalId: string;
  title: string;
  url: string;
  difficulty: string;
  tags: string[];
  hint: string | null;
  expectedTimeComplexity: string | null;
  expectedSpaceComplexity: string | null;
  expectedPattern: string | null;
}

export interface LibraryPageData {
  slug: string;
  section: string;
  title: string;
  orderIndex: number;
  tags: string[];
  readTimeMinutes: number;
  content: string;
  interviewQuestions: Array<{ q: string; a: string }>;
}

export interface CsDailyModule {
  dayNumber: number;
  dsaTheme: string;
  title: string;
  domain: string;
  summary: string;
  mentalModel: string;
  details: string;
  failureCase: string;
  interviewQuestions: Array<{ q: string; a: string }>;
}

export interface SystemDesignDailyModule {
  dayNumber: number;
  dsaTheme: string;
  title: string;
  summary: string;
  architecture: string;
  tradeoffs: string;
  interviewQuestions: Array<{ q: string; a: string }>;
}

export interface McqOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface McqQuestion {
  id: string;
  dayId: string;
  category?: 'dsa' | 'cs_fundamentals' | 'system_design';
  topic: string;
  question: string;
  codeSnippet?: string | null;
  options: McqOption[];
  correctOption: 'A' | 'B' | 'C' | 'D' | string;
  detailedExplanation: string;
  difficulty: 'easy' | 'medium' | 'hard' | string;
  orderIndex: number;
}

// Typed exports
export const days: DayData[] = daysData as DayData[];
export const problems: ProblemData[] = problemsData as ProblemData[];
export const libraryPages: LibraryPageData[] = libraryData as LibraryPageData[];
export const csDailyModules: CsDailyModule[] = csDailyData as CsDailyModule[];
export const sdDailyModules: SystemDesignDailyModule[] = sdDailyData as SystemDesignDailyModule[];
export const dsaMcqs: McqQuestion[] = dsaMcqsData as McqQuestion[];
export const csMcqs: McqQuestion[] = csMcqsData as McqQuestion[];
export const sdMcqs: McqQuestion[] = sdMcqsData as McqQuestion[];

// Lookup helpers
const problemsMap = new Map<string, ProblemData>();
problems.forEach((p) => problemsMap.set(p.id, p));

const daysMap = new Map<number, DayData>();
days.forEach((d) => daysMap.set(d.number, d));

const csDailyMap = new Map<number, CsDailyModule>();
csDailyModules.forEach((m) => csDailyMap.set(m.dayNumber, m));

const sdDailyMap = new Map<number, SystemDesignDailyModule>();
sdDailyModules.forEach((m) => sdDailyMap.set(m.dayNumber, m));

export function getProblemById(id: string): ProblemData | undefined {
  return problemsMap.get(id);
}

export function getDayByNumber(num: number): DayData | undefined {
  return daysMap.get(num);
}

export function getProblemsForDay(dayNumber: number): ProblemData[] {
  const day = getDayByNumber(dayNumber);
  if (!day) return [];
  return day.problemIds
    .map((id) => getProblemById(id))
    .filter((p): p is ProblemData => !!p);
}

export function getCsModuleForDay(dayNumber: number): CsDailyModule | undefined {
  return csDailyMap.get(dayNumber);
}

export function getSystemDesignModuleForDay(dayNumber: number): SystemDesignDailyModule | undefined {
  return sdDailyMap.get(dayNumber);
}

export function getMcqsForDay(dayNumber: number): {
  dsa: McqQuestion[];
  cs: McqQuestion[];
  systemDesign: McqQuestion[];
  total: number;
} {
  const dayTag = `day_${dayNumber}`;
  const dayDsa = dsaMcqs.filter((q) => q.dayId === dayTag);
  const dayCs = csMcqs.filter((q) => q.dayId === dayTag);
  const daySd = sdMcqs.filter((q) => q.dayId === dayTag);

  return {
    dsa: dayDsa,
    cs: dayCs,
    systemDesign: daySd,
    total: dayDsa.length + dayCs.length + daySd.length,
  };
}

export function getLibraryBySection(section: string): LibraryPageData[] {
  return libraryPages
    .filter((p) => p.section === section)
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  problems.forEach((p) => p.tags.forEach((t) => tags.add(t)));
  return Array.from(tags).sort();
}

export const TOTAL_DAYS = 30;
export const PROBLEMS_PER_DAY = 5;
export const TOTAL_PROBLEMS = TOTAL_DAYS * PROBLEMS_PER_DAY;
