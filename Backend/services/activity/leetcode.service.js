import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * LeetCode Activity Service
 *
 * Fetches today's solved problem count for a LeetCode user
 * using the public GraphQL API.
 */

/**
 * Get the number of problems a user solved today.
 * @param {string} username — LeetCode username
 * @param {string} tz - Timezone string (default: Asia/Kolkata)
 * @returns {Promise<number>}
 */
export async function getTodayLeetCodeSolved(username, tz = "Asia/Kolkata") {
    try {
        const query = `{
      recentAcSubmissionList(username: "${username}", limit: 50) {
        timestamp
      }
    }`;

        const res = await fetch("https://leetcode.com/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "Frameverse-AutoPost",
            },
            body: JSON.stringify({ query }),
        });

        if (!res.ok) {
            console.error(`[LeetCode] API error for ${username}: ${res.status}`);
            return 0;
        }

        const data = await res.json();
        const submissions = data?.data?.recentAcSubmissionList || [];

        // Filter to today's submissions (in user's timezone)
        const todayStart = dayjs().tz(tz).startOf("day").unix(); // Unix seconds

        let solved = 0;
        for (const sub of submissions) {
            if (Number(sub.timestamp) >= todayStart) {
                solved++;
            }
        }

        return solved;
    } catch (err) {
        console.error(`[LeetCode] Failed to fetch solved for ${username}:`, err.message);
        return 0;
    }
}
