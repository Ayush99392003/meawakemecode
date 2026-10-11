"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTrashBadge = calculateTrashBadge;
const ROASTS = {
    bronze: {
        title: 'WEAK DISCIPLINE: COMFORT ADDICT',
        subtitle: '1 Missed Day · The Downward Spiral Has Begun',
        quotes: [
            'You talked a big game about clearing FAANG interviews, but couldn\'t even sit down for 45 minutes today. Pathetic.',
            'You gave in to laziness at the very first hurdle. The engineer who takes your dream offer solved 5 problems while you were rotting on social media.',
            'One skipped day is how every failed goal in your life started. Stop lying to yourself that you\'ll "double up tomorrow".',
            'You had 24 hours today and chose Netflix and doomscrolling over your own career. Look in the mirror and own your failure.',
        ],
    },
    silver: {
        title: 'EXCUSE MACHINE: CHRONIC SLACKER',
        subtitle: '2-3 Missed Days · Standards Evaporating Into Thin Air',
        quotes: [
            'You are actively betraying your own future. You are comfortable being completely average, and that is why you will remain stuck.',
            'Look at yourself: 3 days completely skipped. You have zero consistency. If your technical interview were tomorrow, you would fail miserably and you know it.',
            'You had hours to play games, scroll feeds, and make excuses, but zero minutes to write code. Stop complaining about the job market when you refuse to do the work.',
            'Every single hour you waste pretending to be busy, a hungry competitor is mastering the exact System Design concepts you just abandoned.',
        ],
    },
    gold: {
        title: 'CAREER GHOST: PROFESSIONAL QUITTER',
        subtitle: '4-6 Missed Days · One Step Away From Complete Failure',
        quotes: [
            'You are a professional quitter. You get excited, buy prep materials, hype yourself up, and vanish the moment real effort is demanded.',
            'Almost an entire week thrown directly into the trash. You are not "exhausted" or "busy"—you simply lack the spine and discipline to finish what you started.',
            'Nobody is coming to save your career. Nobody is going to hire your potential. Right now, your resume is just empty promises and broken streaks.',
            'You\'re proving every skeptic right. You wanted the salary, the prestige, and the title, but you weren\'t willing to sweat for even 5 days.',
        ],
    },
    dumpster: {
        title: 'ABSOLUTE TRASH: NOT WORKING ON YOURSELF',
        subtitle: '7+ Missed Days · Complete Surrender & Total Self-Delusion',
        quotes: [
            'CERTIFIED DUMPSTER FIRE: You have completely surrendered. You are NOT working on yourself. You are merely a spectator watching others succeed.',
            'You made grand promises to yourself and threw them into the trash. In 6 months you will be in the exact same miserable spot, making the exact same pathetic excuses.',
            'All talk, zero execution, zero discipline. You are comfortable losing. Burn this badge immediately by opening a compiler, or accept that you just didn\'t have what it takes.',
            'Harsh truth: You don\'t want to be an elite software engineer. You just like daydreaming about it. Close your excuses, open Day 1, and prove this wrong.',
        ],
    },
};
/**
 * Calculates the reverse accountability status based on user's start date
 * and completed days.
 */
function calculateTrashBadge(dayCompletions, startDate) {
    if (!startDate) {
        return {
            hasTrashBadge: false,
            tier: 'none',
            title: 'Clean Slate',
            subtitle: 'Commit to start your 30-day streak',
            roastMessage: 'Start Day 1 to prove your commitment.',
            missedDays: [],
            missedCount: 0,
            streakBroken: false,
            cleanStreakDays: 0,
            daysBehind: 0,
            redemptionSteps: ['Begin Day 1'],
        };
    }
    const start = new Date(startDate);
    const now = new Date();
    const dayDiff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const expectedDayNumber = Math.min(Math.max(dayDiff + 1, 1), 30);
    // Find all previous days (1 to expectedDayNumber - 1) that were NOT completed
    const missedDays = [];
    for (let d = 1; d < expectedDayNumber; d++) {
        if (!dayCompletions[d]) {
            missedDays.push(d);
        }
    }
    const missedCount = missedDays.length;
    const daysBehind = Math.max(0, expectedDayNumber - Object.keys(dayCompletions).length);
    // Determine tier
    let tier = 'none';
    if (missedCount >= 7) {
        tier = 'dumpster';
    }
    else if (missedCount >= 4) {
        tier = 'gold';
    }
    else if (missedCount >= 2) {
        tier = 'silver';
    }
    else if (missedCount === 1) {
        tier = 'bronze';
    }
    if (tier === 'none') {
        return {
            hasTrashBadge: false,
            tier: 'none',
            title: 'Zero Slacking · Clean Record',
            subtitle: 'You are actively working on yourself every single day.',
            roastMessage: 'Zero missed days. Keep the momentum locked in.',
            missedDays: [],
            missedCount: 0,
            streakBroken: false,
            cleanStreakDays: Object.keys(dayCompletions).length,
            daysBehind: 0,
            redemptionSteps: ['Keep your daily streak alive today.'],
        };
    }
    const tierData = ROASTS[tier];
    // Deterministic pick based on missedCount to avoid hydration mismatch
    const quoteIndex = (missedCount + expectedDayNumber) % tierData.quotes.length;
    const roastMessage = tierData.quotes[quoteIndex];
    return {
        hasTrashBadge: true,
        tier,
        title: tierData.title,
        subtitle: tierData.subtitle,
        roastMessage,
        missedDays,
        missedCount,
        streakBroken: true,
        cleanStreakDays: 0,
        daysBehind,
        redemptionSteps: [
            `Stop talking: Solve the 5 coding problems on abandoned Day ${missedDays[0]} right now.`,
            `Hit your mandatory Day ${expectedDayNumber} quota before midnight or earn an even worse badge.`,
            `Backsolve all ${missedCount} skipped days with zero excuses to incinerate this Trash Badge forever.`,
        ],
    };
}
