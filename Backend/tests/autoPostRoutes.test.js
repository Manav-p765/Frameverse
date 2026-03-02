import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import { connectDB, closeDB, clearDB } from "./db.setup.js";

// 1. Mock the auth middleware
jest.unstable_mockModule("../middleware.js", () => ({
    isLoggedIn: (req, res, next) => {
        req.userId = "000000000000000000000001"; // Mock user ID
        next();
    },
}));

// 2. Mock the worker so /run endpoint doesn't actually trigger real external calls
jest.unstable_mockModule("../workers/autoPost.worker.js", () => ({
    processUser: jest.fn().mockResolvedValue(),
    startAutoPostWorker: jest.fn(),
}));

// 3. Dynamically import routes and models after mocking
const { default: autoPostRoutes } = await import("../routes/autoPostRoutes.js");
const { default: AutoPostSettings } = await import("../models/autoPostSettings.js");
const { default: ConnectedAccount } = await import("../models/connectedAccount.js");
const { default: DailyStats } = await import("../models/dailyStats.js");

// Setup Express app for testing
const app = express();
app.use(express.json());
app.use("/api/autopost", autoPostRoutes);

const UID = "000000000000000000000001";

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

describe("AutoPost API Routes", () => {
    describe("GET /api/autopost/settings", () => {
        it("should return default settings if none exist", async () => {
            const res = await request(app).get("/api/autopost/settings");

            expect(res.status).toBe(200);
            expect(res.body.settings.enabled).toBe(false);
            expect(res.body.settings.postTime).toBe("09:00");
            expect(res.body.settings.timezone).toBe("Asia/Kolkata");
            expect(res.body.accounts).toEqual([]);
        });

        it("should return saved settings and accounts", async () => {
            // Seed DB
            await AutoPostSettings.create({
                user: UID,
                enabled: true,
                postTime: "14:30",
                timezone: "America/New_York",
                selectedApps: ["github"],
            });
            await ConnectedAccount.create({
                user: UID,
                platform: "github",
                username: "test-github",
            });

            const res = await request(app).get("/api/autopost/settings");

            expect(res.status).toBe(200);
            expect(res.body.settings.enabled).toBe(true);
            expect(res.body.settings.postTime).toBe("14:30");
            expect(res.body.settings.timezone).toBe("America/New_York");
            expect(res.body.accounts).toHaveLength(1);
            expect(res.body.accounts[0].platform).toBe("github");
            expect(res.body.accounts[0].username).toBe("test-github");
        });
    });

    describe("PUT /api/autopost/settings", () => {
        it("should save settings and sync connected accounts", async () => {
            const payload = {
                enabled: true,
                postTime: "10:00",
                timezone: "UTC",
                selectedApps: ["github", "leetcode"],
                githubUsername: "gh-user",
                leetcodeUsername: "lc-user",
            };

            const res = await request(app).put("/api/autopost/settings").send(payload);
            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Settings updated successfully");

            // Verify DB settings
            const settings = await AutoPostSettings.findOne({ user: UID });
            expect(settings.enabled).toBe(true);
            expect(settings.postTime).toBe("10:00");
            expect(settings.timezone).toBe("UTC");

            // Verify DB accounts
            const accounts = await ConnectedAccount.find({ user: UID });
            expect(accounts).toHaveLength(2);
            expect(accounts.map(a => a.platform)).toEqual(expect.arrayContaining(["github", "leetcode"]));
        });

        it("should delete unconnected accounts when fields are cleared", async () => {
            // Seed existing account
            await ConnectedAccount.create({ user: UID, platform: "github", username: "gh-user" });

            const payload = {
                enabled: false,
                githubUsername: "", // Clearing github
                leetcodeUsername: "lc-user", // Adding leetcode
            };

            await request(app).put("/api/autopost/settings").send(payload);

            const accounts = await ConnectedAccount.find({ user: UID });
            expect(accounts).toHaveLength(1);
            expect(accounts[0].platform).toBe("leetcode");
            expect(accounts[0].username).toBe("lc-user");
        });
    });

    describe("GET /api/autopost/stats/today", () => {
        it("should return empty object if no stats ever recorded", async () => {
            const res = await request(app).get("/api/autopost/stats/today");
            expect(res.status).toBe(200);
            expect(res.body.stats).toBeNull();
        });

        it("should return partial stats carrying over streak if no activity today", async () => {
            await DailyStats.create({
                user: UID,
                date: "2026-03-01", // Yesterday
                githubCommits: 5,
                streakCount: 3,
                longestStreak: 5,
            });

            const res = await request(app).get("/api/autopost/stats/today");
            expect(res.status).toBe(200);

            // Should show 0 for today's commit but carry over streak metadata
            expect(res.body.stats.githubCommits).toBe(0);
            expect(res.body.stats.streakCount).toBe(3);
            expect(res.body.stats.longestStreak).toBe(5);
        });
    });

    describe("POST /api/autopost/run", () => {
        it("should trigger processUser and return manual run results", async () => {
            // Since processUser is mocked entirely, it won't actually create a DailyStats in the DB.
            // But we can verify it was called.
            const { processUser } = await import("../workers/autoPost.worker.js");

            const res = await request(app).post("/api/autopost/run");
            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Manual run completed");
            expect(processUser).toHaveBeenCalledWith(UID);
        });
    });
});
