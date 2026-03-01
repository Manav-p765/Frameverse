/**
 * GitHub Activity Service
 *
 * Fetches today's commit count for a GitHub user using the public Events API.
 */

/**
 * Get the number of commits a user made today.
 * @param {string} username — GitHub username
 * @returns {Promise<number>}
 */
export async function getTodayCommits(username) {
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
        const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

        let commits = 0;
        for (const event of events) {
            if (
                event.type === "PushEvent" &&
                event.created_at?.startsWith(todayStr)
            ) {
                commits += event.payload?.commits?.length || 0;
            }
        }

        return commits;
    } catch (err) {
        console.error(`[GitHub] Failed to fetch commits for ${username}:`, err.message);
        return 0;
    }
}
