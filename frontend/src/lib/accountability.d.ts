import { type DayCompletion } from './stores/progress-store';
export type TrashTier = 'none' | 'bronze' | 'silver' | 'gold' | 'dumpster';
export interface TrashBadgeInfo {
    hasTrashBadge: boolean;
    tier: TrashTier;
    title: string;
    subtitle: string;
    roastMessage: string;
    missedDays: number[];
    missedCount: number;
    streakBroken: boolean;
    cleanStreakDays: number;
    daysBehind: number;
    redemptionSteps: string[];
}
/**
 * Calculates the reverse accountability status based on user's start date
 * and completed days.
 */
export declare function calculateTrashBadge(dayCompletions: Record<number, DayCompletion>, startDate: string | null): TrashBadgeInfo;
