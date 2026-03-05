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
        console.log(`[GitHub] Fetching commits for username: "${username}" (tz: ${tz})`);
        const url = `https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=100`;
        console.log(`[GitHub] Request URL: ${url}`);

        const headers = {
            Accept: "application/vnd.github+json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        };

        if (process.env.GITHUB_TOKEN) {
            headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
        }

        const res = await fetch(url, { headers });

        if (!res.ok) {
            const body = await res.text();
            console.error(`[GitHub] API error for "${username}": ${res.status} — ${body}`);
            return 0;
        }

        const events = await res.json();
        const todayStr = dayjs().tz(tz).format("YYYY-MM-DD");

        console.log(`[GitHub] Total events returned: ${events.length}, checking for date: ${todayStr}`);

        let commits = 0;
        for (const event of events) {
            if (event.type === "PushEvent" && event.created_at) {
                const eventDate = dayjs(event.created_at).tz(tz).format("YYYY-MM-DD");
                if (eventDate === todayStr) {
                    const commitCount = event.payload?.size || event.payload?.commits?.length || 1;
                    commits += commitCount;
                }
            }
        }

        console.log(`[GitHub] Final commit count for "${username}": ${commits}`);
        return commits;
    } catch (err) {
        console.error(`[GitHub] Failed to fetch commits for "${username}":`, err.message);
        return 0;
    }
}
