import mongoose from "mongoose";
import { connectDB, closeDB, clearDB } from "./db.setup.js";
import DailyStats from "../models/dailyStats.js";
import { calculateStreak } from "../utils/streak.util.js";

const UID = new mongoose.Types.ObjectId().toString();

beforeAll(async () => {
    await connectDB();
});

afterEach(async () => {
    await clearDB();
});

afterAll(async () => {
    await closeDB();
});

describe("calculateStreak", () => {
    it("should return 0 streak for a new user with no stats", async () => {
        const { streakCount, longestStreak } = await calculateStreak(UID, "2026-03-01");
        expect(streakCount).toBe(0);
        expect(longestStreak).toBe(0);
    });

    it("should calculate streak correctly for consecutive days ending today", async () => {
        await DailyStats.insertMany([
            { user: UID, date: "2026-02-28", githubCommits: 5, leetcodeSolved: 0 },
            { user: UID, date: "2026-03-01", githubCommits: 0, leetcodeSolved: 1 },
            { user: UID, date: "2026-03-02", githubCommits: 10, leetcodeSolved: 2 },
        ]);

        const { streakCount, longestStreak } = await calculateStreak(UID, "2026-03-02");
        expect(streakCount).toBe(3);
        expect(longestStreak).toBe(3);
    });

    it("should handle missing days (gap) and return only current streak", async () => {
        await DailyStats.insertMany([
            { user: UID, date: "2026-02-25", githubCommits: 5, leetcodeSolved: 0 },
            { user: UID, date: "2026-02-26", githubCommits: 5, leetcodeSolved: 0 },
            // Gap on 2026-02-27
            { user: UID, date: "2026-02-28", githubCommits: 0, leetcodeSolved: 1 },
            { user: UID, date: "2026-03-01", githubCommits: 2, leetcodeSolved: 0 },
            { user: UID, date: "2026-03-02", githubCommits: 10, leetcodeSolved: 2 },
        ]);

        const { streakCount, longestStreak } = await calculateStreak(UID, "2026-03-02");

        // Streak from 28th to 2nd is 3 days
        expect(streakCount).toBe(3);

        // Longest streak is still 3 days 
        expect(longestStreak).toBe(3);
    });

    it("should carry over yesterday's streak if today has no activity yet", async () => {
        await DailyStats.insertMany([
            { user: UID, date: "2026-02-28", githubCommits: 5, leetcodeSolved: 0 },
            { user: UID, date: "2026-03-01", githubCommits: 0, leetcodeSolved: 1 },
            // No activity recorded yet for 2026-03-02
        ]);

        const { streakCount, longestStreak } = await calculateStreak(UID, "2026-03-02");

        // It should count backwards from yesterday (03-01), giving 2
        expect(streakCount).toBe(2);
        expect(longestStreak).toBe(2);
    });

    it("should break the streak if neither today nor yesterday has activity", async () => {
        await DailyStats.insertMany([
            { user: UID, date: "2026-02-27", githubCommits: 5, leetcodeSolved: 0 },
            { user: UID, date: "2026-02-28", githubCommits: 0, leetcodeSolved: 1 },
            // Missed 03-01 and 03-02
        ]);

        const { streakCount, longestStreak } = await calculateStreak(UID, "2026-03-02");

        expect(streakCount).toBe(0); // broken
        expect(longestStreak).toBe(2); // previous longest is preserved
    });

    it("should ignore days with 0 commits and 0 solved problems", async () => {
        await DailyStats.insertMany([
            { user: UID, date: "2026-02-28", githubCommits: 5, leetcodeSolved: 0 }, // Active
            { user: UID, date: "2026-03-01", githubCommits: 0, leetcodeSolved: 0 }, // Inactive (should not count)
            { user: UID, date: "2026-03-02", githubCommits: 2, leetcodeSolved: 0 }, // Active
        ]);

        const { streakCount, longestStreak } = await calculateStreak(UID, "2026-03-02");

        // The streak is broken on 03-01, so current streak is just 03-02 = 1
        expect(streakCount).toBe(1);
        expect(longestStreak).toBe(1);
    });
});
