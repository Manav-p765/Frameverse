import DailyStats from "../models/dailyStats.js";

/**
 * Calculate the current streak and longest streak for a user.
 *
 * A "streak day" is a DailyStats record where at least one stat > 0.
 * The current streak counts consecutive days backward from todayDate.
 * If today has no activity, the streak starts from yesterday.
 *
 * @param {string} userId   — Mongoose ObjectId as string
 * @param {string} todayDate — YYYY-MM-DD (timezone-safe, caller provides)
 * @returns {Promise<{ streakCount: number, longestStreak: number }>}
 */
export async function calculateStreak(userId, todayDate) {
    // Fetch all active days for this user, sorted newest first
    const records = await DailyStats.find(
        {
            user: userId,
            $or: [
                { githubCommits: { $gt: 0 } },
                { leetcodeSolved: { $gt: 0 } },
            ],
        },
        { date: 1, _id: 0 }
    )
        .sort({ date: -1 })
        .lean();

    if (records.length === 0) {
        return { streakCount: 0, longestStreak: 0 };
    }

    // Build a Set of active date strings for O(1) lookup
    const activeDays = new Set(records.map((r) => r.date));

    // ── Current streak ──
    // Start from today; if today has no activity, start from yesterday
    let cursor = new Date(todayDate + "T00:00:00Z");
    if (!activeDays.has(todayDate)) {
        cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    let streakCount = 0;
    while (true) {
        const dateStr = cursor.toISOString().slice(0, 10);
        if (activeDays.has(dateStr)) {
            streakCount++;
            cursor.setUTCDate(cursor.getUTCDate() - 1);
        } else {
            break;
        }
    }

    // ── Longest streak ──
    // Walk all active dates chronologically and track longest run
    const sortedDates = [...activeDays].sort();
    let longestStreak = 1;
    let currentRun = 1;

    for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1] + "T00:00:00Z");
        const curr = new Date(sortedDates[i] + "T00:00:00Z");
        const diffDays = (curr - prev) / 86400000;

        if (diffDays === 1) {
            currentRun++;
            longestStreak = Math.max(longestStreak, currentRun);
        } else {
            currentRun = 1;
        }
    }

    // Current streak might be the longest
    longestStreak = Math.max(longestStreak, streakCount);

    return { streakCount, longestStreak };
}
