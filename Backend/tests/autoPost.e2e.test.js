import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { connectDB, closeDB, clearDB } from "./db.setup.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

// Setup complete mocks for all external services
jest.unstable_mockModule("../services/activity/github.service.js", () => ({
    getTodayCommits: jest.fn().mockResolvedValue(12),
}));

jest.unstable_mockModule("../services/activity/leetcode.service.js", () => ({
    getTodayLeetCodeSolved: jest.fn().mockResolvedValue(3),
}));

jest.unstable_mockModule("../services/ai/generateCaption.js", () => ({
    generateCaption: jest.fn().mockResolvedValue("E2E Test Caption"),
}));

jest.unstable_mockModule("../services/media/generateImage.js", () => ({
    generateStatsImage: jest.fn().mockResolvedValue({ url: "https://res.cloudinary.com/e2e-image.png", public_id: "e2e_mock" }),
}));

// Import models and worker AFTER mocking
const { processUser } = await import("../workers/autoPost.worker.js");
const { default: User } = await import("../models/user.js");
const { default: AutoPostSettings } = await import("../models/autoPostSettings.js");
const { default: ConnectedAccount } = await import("../models/connectedAccount.js");
const { default: DailyStats } = await import("../models/dailyStats.js");
const { default: Post } = await import("../models/post.js");

beforeAll(async () => {
    await connectDB();
});

afterAll(async () => {
    await closeDB();
});

describe("AutoPost End-to-End Flow", () => {
    it("should successfully execute the full pipeline for an eligible user", async () => {
        // 1. Create a mock user
        const user = await User.create({
            username: "e2e_user",
            email: "e2e@test.com",
            password: "password123", // normally hashed, fine for mock
        });

        const UID = user._id.toString();

        // 2. Enable AutoPost and connect integrations
        await AutoPostSettings.create({
            user: UID,
            enabled: true,
            selectedApps: ["github", "leetcode"],
            timezone: "Asia/Kolkata",
        });

        await ConnectedAccount.create({ user: UID, platform: "github", username: "gh-e2e" });
        await ConnectedAccount.create({ user: UID, platform: "leetcode", username: "lc-e2e" });

        // 3. Pre-seed a previous streak to verify streak accumulation
        await DailyStats.create({
            user: UID,
            date: dayjs().tz("Asia/Kolkata").subtract(1, "day").format("YYYY-MM-DD"), // Yesterday
            githubCommits: 5,
            leetcodeSolved: 1,
            streakCount: 4,      // Entering day 5
            longestStreak: 4,
            posted: true,
        });

        // 4. TRIGGER THE WORKER for this user
        await processUser(UID);

        // 5. Verify the entire database state has been correctly mutated

        const today = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD");

        // A. Verify DailyStats was created with correct data
        const newStat = await DailyStats.findOne({ user: UID, date: today });
        expect(newStat).toBeTruthy();
        expect(newStat.githubCommits).toBe(12); // From mock
        expect(newStat.leetcodeSolved).toBe(3);   // From mock

        // B. Verify Streak logic applied correctly
        expect(newStat.streakCount).toBe(2);      // yesterday + today
        expect(newStat.longestStreak).toBe(2);    // updated

        // C. Verify content generation
        expect(newStat.caption).toBe("E2E Test Caption");
        expect(newStat.imageUrl).toBe("https://res.cloudinary.com/e2e-image.png");

        // D. Verify idempotency flag
        expect(newStat.posted).toBe(true);

        // E. Verify the actual Post was created in the main feed
        const post = await Post.findOne({ owner: UID, postType: "auto-progress" });
        expect(post).toBeTruthy();
        expect(post.description).toBe("E2E Test Caption");
        expect(post.image.url).toBe("https://res.cloudinary.com/e2e-image.png");

        // F. Verify Idempotency (running again does nothing)
        const initialPostCount = await Post.countDocuments();
        await processUser(UID); // Second run
        const newPostCount = await Post.countDocuments();
        expect(newPostCount).toBe(initialPostCount); // Should not increase
    }, 15000); // Give e2e test 15 seconds timeout
});
