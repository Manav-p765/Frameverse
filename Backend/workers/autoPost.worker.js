import cron from "node-cron";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import AutoPostSettings from "../models/autoPostSettings.js";
import DailyStats from "../models/dailyStats.js";
import ConnectedAccount from "../models/connectedAccount.js";
import Post from "../models/post.js";
import { getTodayCommits } from "../services/activity/github.service.js";
import { getTodayLeetCodeSolved } from "../services/activity/leetcode.service.js";
import { generateCaption } from "../services/ai/generateCaption.js";
import { generateStatsImage } from "../services/media/generateImage.js";
import { calculateStreak } from "../utils/streak.util.js";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Process a single user's auto post.
 * Fetches stats → generates caption → generates image → creates post → saves DailyStats.
 *
 * TODO: Add retry logic (exponential backoff) for transient API failures.
 * TODO: Replace direct invocation with BullMQ job queue for scalability.
 */
export async function processUser(userId) {
    try {
        console.log(`[AutoPost] Processing auto post for user: ${userId}`);

        const today = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD");

        // Idempotency: bail if a DailyStats already exists for today
        const existing = await DailyStats.findOne({ user: userId, date: today }).lean();
        if (existing) {
            console.log(`[AutoPost] Skipped (DailyStats already exists): ${userId}`);
            return;
        }

        // Load settings and connected accounts in parallel
        const [settings, accounts] = await Promise.all([
            AutoPostSettings.findOne({ user: userId }, { selectedApps: 1, timezone: 1 }).lean(),
            ConnectedAccount.find({ user: userId }, { platform: 1, username: 1 }).lean(),
        ]);

        const accountMap = {};
        for (const acc of accounts) {
            accountMap[acc.platform] = acc.username;
        }

        const apps = settings?.selectedApps || [];
        const tz = settings?.timezone || "Asia/Kolkata";
        const stats = { githubCommits: 0, leetcodeSolved: 0 };

        // Fetch activity from enabled platforms in parallel
        const fetches = [];

        if (apps.includes("github")) {
            if (accountMap.github) {
                fetches.push(
                    getTodayCommits(accountMap.github, tz).then((n) => { stats.githubCommits = n; })
                );
            } else {
                console.log(`[AutoPost] No GitHub account linked for user: ${userId}`);
            }
        }

        if (apps.includes("leetcode")) {
            if (accountMap.leetcode) {
                fetches.push(
                    getTodayLeetCodeSolved(accountMap.leetcode, tz).then((n) => { stats.leetcodeSolved = n; })
                );
            } else {
                console.log(`[AutoPost] No LeetCode account linked for user: ${userId}`);
            }
        }

        await Promise.all(fetches);
        console.log(`[AutoPost] Stats for ${userId}:`, stats);

        // Generate caption and image in parallel
        const [caption, image] = await Promise.all([
            generateCaption(stats),
            generateStatsImage(userId, today, stats),
        ]);

        console.log(`[AutoPost] Caption for ${userId}: ${caption}`);
        console.log(`[AutoPost] Image for ${userId}: ${image.url}`);

        // Create Frameverse post
        const post = await Post.create({
            owner: userId,
            description: caption,
            image: { url: image.url, public_id: image.public_id },
            postType: "auto-progress",
        });

        console.log(`[AutoPost] Post created: ${post._id}`);

        // Save DailyStats and mark as posted
        const dailyRecord = await DailyStats.create({
            user: userId,
            date: today,
            githubCommits: stats.githubCommits,
            leetcodeSolved: stats.leetcodeSolved,
            caption,
            imageUrl: image.url,
            posted: true,
        });

        // Compute and save streaks
        const { streakCount, longestStreak } = await calculateStreak(userId, today);
        dailyRecord.streakCount = streakCount;
        dailyRecord.longestStreak = longestStreak;
        await dailyRecord.save();

        console.log(`[AutoPost] Streak for ${userId}: ${streakCount} (Longest: ${longestStreak})`);
        console.log(`[AutoPost] ✅ Complete for ${userId} (${today})`);
    } catch (err) {
        console.error(`[AutoPost] Failed to process user ${userId}:`, err.message);
        // TODO: Implement retry — push failed userId to a retry queue or
        //       schedule a one-off re-attempt with exponential backoff.
    }
}

// ── Schedule ────────────────────────────────────────────────────────────────
// Cron: every 5 minutes (DO NOT increase frequency — respects API rate limits)
// Duplicate protection: batch DailyStats check + per-user idempotency guard
//
// TODO: Migrate to BullMQ for job queuing, retries, concurrency control,
//       and dead-letter handling when scaling to many users.
// ─────────────────────────────────────────────────────────────────────────────

export function startAutoPostWorker() {
    cron.schedule("*/5 * * * *", async () => {
        try {
            console.log(`[AutoPost] Worker running — ${new Date().toISOString()}`);

            const enabledUsers = await AutoPostSettings.find(
                { enabled: true },
                { user: 1, postTime: 1, timezone: 1 }
            ).lean();

            console.log(`[AutoPost] Enabled users: ${enabledUsers.length}`);

            const eligible = [];
            for (const s of enabledUsers) {
                const [h, m] = s.postTime.split(":").map(Number);
                const now = dayjs().tz(s.timezone || "Asia/Kolkata");
                if (now.hour() === h && now.minute() === m) {
                    eligible.push(s);
                }
            }

            if (eligible.length === 0) return;

            const today = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD");
            const eligibleIds = eligible.map((s) => s.user);

            const alreadyPosted = await DailyStats.find(
                { user: { $in: eligibleIds }, date: today },
                { user: 1 }
            ).lean();

            const postedSet = new Set(alreadyPosted.map((d) => d.user.toString()));

            for (const s of eligible) {
                const uid = s.user.toString();
                if (postedSet.has(uid)) {
                    console.log(`[AutoPost] Skipped (already posted today): ${uid}`);
                } else {
                    console.log(`[AutoPost] User eligible for processing: ${uid}`);
                    await processUser(uid);
                }
            }
        } catch (err) {
            console.error("[AutoPost] Error:", err.message);
        }
    });

    console.log("[AutoPost] Worker scheduled (every 5 minutes)");
}
