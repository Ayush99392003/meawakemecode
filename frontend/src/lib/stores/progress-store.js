"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useProgressStore = void 0;
const zustand_1 = require("zustand");
const middleware_1 = require("zustand/middleware");
const STORAGE_KEY = 'dsa-sheet-progress-v1';
exports.useProgressStore = (0, zustand_1.create)()((0, middleware_1.persist)((set, get) => ({
    problems: {},
    dayCompletions: {},
    theoryRead: {},
    csTheoryRead: {},
    systemDesignRead: {},
    mcqAnswers: {},
    startDate: null,
    startProblem: (problemId) => {
        const now = new Date().toISOString();
        set((state) => ({
            problems: {
                ...state.problems,
                [problemId]: {
                    ...state.problems[problemId],
                    problemId,
                    status: state.problems[problemId]?.status === 'solved' ? 'solved' : 'started',
                    startedAt: state.problems[problemId]?.startedAt ?? now,
                    solvedAt: state.problems[problemId]?.solvedAt ?? null,
                    note: state.problems[problemId]?.note ?? null,
                    isLate: state.problems[problemId]?.isLate ?? false,
                    updatedAt: now,
                },
            },
        }));
    },
    solveProblem: (problemId, dayNumber) => {
        const now = new Date().toISOString();
        const state = get();
        const currentDay = state.startDate ? getCurrentDayNumber(state.startDate) : 1;
        const isLate = dayNumber < currentDay;
        set((s) => ({
            problems: {
                ...s.problems,
                [problemId]: {
                    problemId,
                    status: 'solved',
                    solvedAt: now,
                    startedAt: s.problems[problemId]?.startedAt ?? now,
                    note: s.problems[problemId]?.note ?? null,
                    isLate,
                    updatedAt: now,
                },
            },
        }));
    },
    unsolveProblem: (problemId) => {
        const now = new Date().toISOString();
        set((state) => ({
            problems: {
                ...state.problems,
                [problemId]: {
                    ...state.problems[problemId],
                    problemId,
                    status: 'started',
                    solvedAt: null,
                    isLate: false,
                    updatedAt: now,
                },
            },
        }));
    },
    markRevisit: (problemId) => {
        const now = new Date().toISOString();
        set((state) => ({
            problems: {
                ...state.problems,
                [problemId]: {
                    ...state.problems[problemId],
                    problemId,
                    status: 'revisit',
                    updatedAt: now,
                },
            },
        }));
    },
    setNote: (problemId, note) => {
        const now = new Date().toISOString();
        set((state) => ({
            problems: {
                ...state.problems,
                [problemId]: {
                    ...state.problems[problemId],
                    problemId,
                    status: state.problems[problemId]?.status ?? 'not_started',
                    solvedAt: state.problems[problemId]?.solvedAt ?? null,
                    startedAt: state.problems[problemId]?.startedAt ?? null,
                    note,
                    isLate: state.problems[problemId]?.isLate ?? false,
                    updatedAt: now,
                },
            },
        }));
    },
    completeDay: (dayNumber, isLate = false) => {
        const now = new Date().toISOString();
        set((state) => ({
            dayCompletions: {
                ...state.dayCompletions,
                [dayNumber]: { dayNumber, completedAt: now, isLate },
            },
        }));
    },
    markTheoryRead: (dayNumber) => {
        set((state) => ({
            theoryRead: { ...state.theoryRead, [dayNumber]: true },
        }));
    },
    markCsTheoryRead: (dayNumber) => {
        set((state) => ({
            csTheoryRead: { ...state.csTheoryRead, [dayNumber]: true },
        }));
    },
    markSystemDesignRead: (dayNumber) => {
        set((state) => ({
            systemDesignRead: { ...state.systemDesignRead, [dayNumber]: true },
        }));
    },
    saveMcqAnswer: (questionId, answer) => {
        set((state) => ({
            mcqAnswers: { ...state.mcqAnswers, [questionId]: answer },
        }));
    },
    setStartDate: (date) => set({ startDate: date }),
    mergeState: (cloudState) => {
        set((current) => {
            const mergedProblems = { ...current.problems };
            if (cloudState.problems) {
                for (const [id, prob] of Object.entries(cloudState.problems)) {
                    if (prob.status === 'solved' || !mergedProblems[id]) {
                        mergedProblems[id] = prob;
                    }
                }
            }
            return {
                ...current,
                problems: mergedProblems,
                dayCompletions: { ...cloudState.dayCompletions, ...current.dayCompletions },
                theoryRead: { ...cloudState.theoryRead, ...current.theoryRead },
                csTheoryRead: { ...cloudState.csTheoryRead, ...current.csTheoryRead },
                systemDesignRead: { ...cloudState.systemDesignRead, ...current.systemDesignRead },
                mcqAnswers: { ...cloudState.mcqAnswers, ...current.mcqAnswers },
                startDate: current.startDate || cloudState.startDate || null,
            };
        });
    },
    getSolvedCountForDay: (problemIds) => {
        const problems = get().problems;
        return problemIds.filter((id) => problems[id]?.status === 'solved').length;
    },
    isDayComplete: (dayNumber) => !!get().dayCompletions[dayNumber],
    reset: () => set({
        problems: {},
        dayCompletions: {},
        theoryRead: {},
        csTheoryRead: {},
        systemDesignRead: {},
        mcqAnswers: {},
        startDate: null,
    }),
}), {
    name: STORAGE_KEY,
    storage: (0, middleware_1.createJSONStorage)(() => localStorage),
    version: 1,
}));
function getCurrentDayNumber(startDate) {
    const start = new Date(startDate);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.min(Math.max(diffDays + 1, 1), 30);
}
