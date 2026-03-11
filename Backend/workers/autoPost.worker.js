import cron from "node-cron";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import AutoPostSettings from "../models/autoPostSettings.js";
import DailyStats from "../models/dailyStats.js";
import ConnectedAccount from "../models/connectedAccount.js";
import Post from "../models/post.js";
import User from "../models/user.js";
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
export async function processUser(userId, options = { isManual: false }) {
    const { isManual } = options;
    try {
        console.log(`[AutoPost] Processing auto post for user: ${userId}`);

        const today = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD");

        // Idempotency: bail if a DailyStats already exists for today (unless manual run)
        if (!isManual) {
            const existing = await DailyStats.findOne({ user: userId, date: today }).lean();
            if (existing) {
                console.log(`[AutoPost] Skipped (DailyStats already exists): ${userId}`);
                return;
            }
        }

        // Load settings and connected accounts in parallel
        const [settings, accounts] = await Promise.all([
            AutoPostSettings.findOne({ user: userId }, { selectedApps: 1, timezone: 1 }).lean(),
            ConnectedAccount.find({ user: userId }, { platform: 1, username: 1 }).lean(),
        ]);

        console.log(`[AutoPost] RAW settings:`, JSON.stringify(settings));
        console.log(`[AutoPost] RAW accounts:`, JSON.stringify(accounts));

        // FIX: Normalize platform keys to lowercase to avoid "GitHub" vs "github" mismatches
        const accountMap = {};
        for (const acc of accounts) {
            accountMap[acc.platform.toLowerCase()] = acc.username;
        }

        // FIX: Normalize selectedApps to lowercase for consistent matching
        const apps = (settings?.selectedApps || []).map((a) => a.toLowerCase());
        const tz = settings?.timezone || "Asia/Kolkata";
        const stats = { githubCommits: 0, leetcodeSolved: 0 };

        console.log(`[AutoPost] selectedApps (normalized): [${apps.join(", ")}]`);
        console.log(`[AutoPost] accountMap (normalized):`, JSON.stringify(accountMap));

        // Fetch activity from enabled platforms in parallel
        const fetches = [];

        if (apps.includes("github")) {
            if (accountMap.github) {
                fetches.push(
                    getTodayCommits(accountMap.github, tz)
                        .then((n) => {
                            stats.githubCommits = n;
                            console.log(`[AutoPost] GitHub commits resolved: ${n}`);
                        })
                        .catch((err) => {
                            // FIX: Catch per-platform errors so one failure doesn't zero out the other
                            console.error(`[AutoPost] GitHub fetch failed for ${userId}:`, err);
                        })
                );
            } else {
                console.log(`[AutoPost] No GitHub account linked for user: ${userId}`);
            }
        }

        if (apps.includes("leetcode")) {
            if (accountMap.leetcode) {
                fetches.push(
                    getTodayLeetCodeSolved(accountMap.leetcode, tz)
                        .then((n) => {
                            stats.leetcodeSolved = n;
                            console.log(`[AutoPost] LeetCode solved resolved: ${n}`);
                        })
                        .catch((err) => {
                            // FIX: Catch per-platform errors so one failure doesn't zero out the other
                            console.error(`[AutoPost] LeetCode fetch failed for ${userId}:`, err);
                        })
                );
            } else {
                console.log(`[AutoPost] No LeetCode account linked for user: ${userId}`);
            }
        }

        await Promise.all(fetches);
        console.log(`[AutoPost] Final stats for ${userId}:`, stats);

        // Skip posting if there's no activity at all
        if (stats.githubCommits === 0 && stats.leetcodeSolved === 0) {
            console.log(`[AutoPost] Skipped (no activity): ${userId}`);
            return;
        }

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

        // Push post into User.posts array so it appears on profile
        await User.findByIdAndUpdate(userId, { $push: { posts: post._id } });

        console.log(`[AutoPost] Post created: ${post._id}`);

        // Step 1: Save DailyStats FIRST so today's record exists in the DB
        await DailyStats.findOneAndUpdate(
            { user: userId, date: today },
            {
                githubCommits: stats.githubCommits,
                leetcodeSolved: stats.leetcodeSolved,
                caption,
                imageUrl: image.url,
                posted: true,
            },
            { new: true, upsert: true }
        );

        // Step 2: NOW calculate streaks — today's DailyStats is in the DB so it's counted
        const { streakCount, longestStreak } = await calculateStreak(userId, today);

        // Step 3: Update DailyStats with the computed streak values
        await DailyStats.findOneAndUpdate(
            { user: userId, date: today },
            { streakCount, longestStreak }
        );

        console.log(`[AutoPost] Streak for ${userId}: ${streakCount} (Longest: ${longestStreak})`);
        console.log(`[AutoPost] ✅ Complete for ${userId} (${today})`);
    } catch (err) {
        // FIX: Log full error object, not just err.message, to expose network/stack issues
        console.error(`[AutoPost] Failed to process user ${userId}:`, err);
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
                if (now.hour() > h || (now.hour() === h && now.minute() >= m)) {
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
            console.error("[AutoPost] Worker error:", err);
        }
    });

    console.log("[AutoPost] Worker scheduled (every 5 minutes)");
}