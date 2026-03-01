import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { connectDB, closeDB, clearDB } from "./db.setup.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

// 1. Mock dependencies
jest.unstable_mockModule("node-cron", () => ({
    default: {
        schedule: jest.fn(),
    },
}));

jest.unstable_mockModule("../services/activity/github.service.js", () => ({
    getTodayCommits: jest.fn().mockResolvedValue(5),
}));

jest.unstable_mockModule("../services/activity/leetcode.service.js", () => ({
    getTodayLeetCodeSolved: jest.fn().mockResolvedValue(2),
}));

jest.unstable_mockModule("../services/ai/generateCaption.js", () => ({
    generateCaption: jest.fn().mockResolvedValue("Test generated caption"),
}));

jest.unstable_mockModule("../services/media/generateImage.js", () => ({
    generateStatsImage: jest.fn().mockResolvedValue({ url: "https://res.cloudinary.com/test-image-url.png", public_id: "test" }),
}));

const { default: cron } = await import("node-cron");
const { startAutoPostWorker, processUser } = await import("../workers/autoPost.worker.js");
const { default: AutoPostSettings } = await import("../models/autoPostSettings.js");
const { default: DailyStats } = await import("../models/dailyStats.js");
const { default: ConnectedAccount } = await import("../models/connectedAccount.js");
const { default: Post } = await import("../models/post.js");

const UID = new mongoose.Types.ObjectId().toString();

beforeAll(async () => {
    await connectDB();
});

afterEach(async () => {
    await clearDB();
    jest.clearAllMocks();
});

afterAll(async () => {
    await closeDB();
});

describe("autoPost.worker.js", () => {
    describe("startAutoPostWorker()", () => {
        it("should initialize node-cron on the */5 * * * * schedule", () => {
            startAutoPostWorker();
            expect(cron.schedule).toHaveBeenCalledWith("*/5 * * * *", expect.any(Function));
        });
    });

    describe("processUser() Pipeline", () => {
        it("should skip if user has already posted today (idempotency)", async () => {
            const today = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD");
            await DailyStats.create({
                user: UID,
                date: today,
                posted: true, // Already posted
            });

            await processUser(UID);

            // Verify no new Post was created
            const posts = await Post.find({ owner: UID });
            expect(posts.length).toBe(0);
        });

        it("should fetch stats, generate content, create Post, and mark DailyStats as posted", async () => {
            // Setup Settings
            await AutoPostSettings.create({
                user: UID,
                enabled: true,
                selectedApps: ["github", "leetcode"],
            });

            await ConnectedAccount.create({ user: UID, platform: "github", username: "gh-user" });
            await ConnectedAccount.create({ user: UID, platform: "leetcode", username: "lc-user" });

            await processUser(UID);

            // 1. Verify DailyStats created and marked posted: true
            const today = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD");
            const stat = await DailyStats.findOne({ user: UID, date: today });

            expect(stat).toBeTruthy();
            expect(stat.githubCommits).toBe(5);
            expect(stat.leetcodeSolved).toBe(2);
            expect(stat.caption).toBe("Test generated caption");
            expect(stat.imageUrl).toBe("https://res.cloudinary.com/test-image-url.png");
            expect(stat.posted).toBe(true);
            expect(stat.streakCount).toBe(1); // First day

            // 2. Verify Frameverse Post created
            const post = await Post.findOne({ owner: UID, postType: "auto-progress" });
            expect(post).toBeTruthy();
            expect(post.description).toBe("Test generated caption");
            expect(post.image.url).toBe("https://res.cloudinary.com/test-image-url.png");
        });
    });
});
