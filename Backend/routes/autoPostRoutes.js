import express from "express";
import { isLoggedIn as authorize } from "../middleware.js";
import AutoPostSettings from "../models/autoPostSettings.js";
import DailyStats from "../models/dailyStats.js";
import ConnectedAccount from "../models/connectedAccount.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import tz from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(tz);

const router = express.Router();

/**
 * @desc Get user's auto-post settings and connected accounts
 * @route GET /api/autopost/settings
 */
router.get("/settings", authorize, async (req, res) => {
    try {
        const userId = req.userId;

        // Fetch settings (or default)
        let settings = await AutoPostSettings.findOne({ user: userId }).lean();
        if (!settings) {
            settings = {
                enabled: false,
                postTime: "09:00",
                timezone: "Asia/Kolkata",
                selectedApps: [],
            };
        }

        // Fetch connected accounts
        const accounts = await ConnectedAccount.find({ user: userId }).lean();

        res.json({ settings, accounts });
    } catch (error) {
        console.error("GET /settings error:", error);
        res.status(500).json({ message: "Server error fetching auto-post settings" });
    }
});

/**
 * @desc Update user's auto-post settings and connected accounts
 * @route PUT /api/autopost/settings
 * @body { enabled, postTime, timezone, selectedApps, githubUsername, leetcodeUsername }
 */
router.put("/settings", authorize, async (req, res) => {
    try {
        const userId = req.userId;
        const { enabled, postTime, timezone, selectedApps, githubUsername, leetcodeUsername } = req.body;

        // Update or create settings
        const settings = await AutoPostSettings.findOneAndUpdate(
            { user: userId },
            { enabled, postTime, timezone, selectedApps: selectedApps || [] },
            { new: true, upsert: true }
        );

        // Sync connected accounts
        const accountsToKeep = [];

        // GitHub
        if (githubUsername?.trim()) {
            await ConnectedAccount.findOneAndUpdate(
                { user: userId, platform: "github" },
                { username: githubUsername.trim() },
                { upsert: true }
            );
            accountsToKeep.push("github");
        } else {
            await ConnectedAccount.findOneAndDelete({ user: userId, platform: "github" });
        }

        // LeetCode
        if (leetcodeUsername?.trim()) {
            await ConnectedAccount.findOneAndUpdate(
                { user: userId, platform: "leetcode" },
                { username: leetcodeUsername.trim() },
                { upsert: true }
            );
            accountsToKeep.push("leetcode");
        } else {
            await ConnectedAccount.findOneAndDelete({ user: userId, platform: "leetcode" });
        }

        // Clean up any other orphaned accounts if they somehow unchecked them
        await ConnectedAccount.deleteMany({
            user: userId,
            platform: { $nin: accountsToKeep }
        });

        res.json({ message: "Settings updated successfully", settings });
    } catch (error) {
        console.error("PUT /settings error:", error);
        res.status(500).json({ message: "Server error saving auto-post settings" });
    }
});

/**
 * @desc Get today's stats/preview for the user
 * @route GET /api/autopost/stats/today
 */
router.get("/stats/today", authorize, async (req, res) => {
    try {
        const userId = req.userId;

        // To get the streak reliably even if today has no activity, we query the latest record
        const latestStat = await DailyStats.findOne({ user: userId }).sort({ date: -1 }).lean();

        if (!latestStat) {
            return res.json({ stats: null });
        }

        const todayDate = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD");

        // If the latest record is today, return it directly
        if (latestStat.date === todayDate) {
            return res.json({ stats: latestStat });
        }

        // Otherwise, there's no activity yet today. We just return a mockup with the streaks from past
        res.json({
            stats: {
                githubCommits: 0,
                leetcodeSolved: 0,
                streakCount: latestStat.streakCount, // Carry over streak to display
                longestStreak: latestStat.longestStreak,
                caption: null,
                imageUrl: null,
                posted: false,
                updatedAt: latestStat.updatedAt
            }
        });

    } catch (error) {
        console.error("GET /stats/today error:", error);
        res.status(500).json({ message: "Server error fetching today's stats" });
    }
});

/**
 * @desc Trigger manual auto-post generation (Run Now)
 * @route POST /api/autopost/run
 */
router.post("/run", authorize, async (req, res) => {
    try {
        const userId = req.userId;

        // To avoid duplicating the massive processUser logic here, we dynamically 
        // invoke the worker process manually if possible. But since the worker uses 
        // processUser privately, let's export processUser from autoPost.worker.js

        const { processUser } = await import("../workers/autoPost.worker.js");

        await processUser(userId, { isManual: true });

        const today = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD");

        const updatedStats = await DailyStats.findOne({ user: userId, date: today }).lean();

        res.json({ message: "Manual run completed", stats: updatedStats });
    } catch (error) {
        console.error("POST /run error:", error);
        res.status(500).json({ message: "Server error executing run now" });
    }
});

export default router;
