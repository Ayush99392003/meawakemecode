export type ProblemStatus = 'not_started' | 'started' | 'solved' | 'revisit';
export interface ProblemProgress {
    problemId: string;
    status: ProblemStatus;
    solvedAt: string | null;
    startedAt: string | null;
    note: string | null;
    isLate: boolean;
    updatedAt: string;
}
export interface DayCompletion {
    dayNumber: number;
    completedAt: string;
    isLate: boolean;
}
export interface ProgressState {
    problems: Record<string, ProblemProgress>;
    dayCompletions: Record<number, DayCompletion>;
    theoryRead: Record<number, boolean>;
    csTheoryRead: Record<number, boolean>;
    systemDesignRead: Record<number, boolean>;
    mcqAnswers: Record<string, string>;
    startDate: string | null;
    streakFreezeUsed?: Record<number, boolean>;
    startProblem: (problemId: string) => void;
    solveProblem: (problemId: string, dayNumber: number) => void;
    unsolveProblem: (problemId: string) => void;
    markRevisit: (problemId: string) => void;
    setNote: (problemId: string, note: string) => void;
    completeDay: (dayNumber: number, isLate?: boolean) => void;
    markTheoryRead: (dayNumber: number) => void;
    markCsTheoryRead: (dayNumber: number) => void;
    markSystemDesignRead: (dayNumber: number) => void;
    saveMcqAnswer: (questionId: string, answer: string) => void;
    setStartDate: (date: string) => void;
    mergeState: (cloudState: Partial<ProgressState>) => void;
    getSolvedCountForDay: (problemIds: string[]) => number;
    isDayComplete: (dayNumber: number) => boolean;
    reset: () => void;
}
export declare const useProgressStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<ProgressState>, "setState" | "persist"> & {
    setState(partial: ProgressState | Partial<ProgressState> | ((state: ProgressState) => ProgressState | Partial<ProgressState>), replace?: false | undefined): unknown;
    setState(state: ProgressState | ((state: ProgressState) => ProgressState), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<ProgressState, unknown, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: ProgressState) => void) => () => void;
        onFinishHydration: (fn: (state: ProgressState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<ProgressState, unknown, unknown>>;
    };
}>;
