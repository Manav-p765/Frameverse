import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * GitHub Activity Service
 *
 * Fetches today's commit count for a GitHub user using the public Events API.
 */

/**
 * Get the number of commits a user made today.
 * @param {string} username — GitHub username
 * @param {string} tz - Timezone string (default: Asia/Kolkata)
 * @returns {Promise<number>}
 */
export async function getTodayCommits(username, tz = "Asia/Kolkata") {
    try {
        const res = await fetch(
            `https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=100`,
            {
                headers: {
                    Accept: "application/vnd.github+json",
                    "User-Agent": "Frameverse-AutoPost",
                },
            }
        );

        if (!res.ok) {
            console.error(`[GitHub] API error for ${username}: ${res.status}`);
            return 0;
        }

        const events = await res.json();
        const todayStr = dayjs().tz(tz).format("YYYY-MM-DD");

        let commits = 0;
        for (const event of events) {
            if (event.type === "PushEvent" && event.created_at) {
                // event.created_at is UTC, convert it to target timezone
                const eventDate = dayjs(event.created_at).tz(tz).format("YYYY-MM-DD");
                if (eventDate === todayStr) {
                    const commitCount = event.payload?.size || event.payload?.commits?.length || 1;
                    commits += commitCount;
                }
            }
        }

        return commits;
    } catch (err) {
        console.error(`[GitHub] Failed to fetch commits for ${username}:`, err.message);
        return 0;
    }
}
