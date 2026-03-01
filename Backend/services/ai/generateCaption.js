import { GoogleGenAI } from "@google/genai";

let ai = null;

function getAI() {
    if (!ai) {
        ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return ai;
}

/**
 * Generate a social-media post caption from daily activity stats.
 *
 * @param {{ githubCommits: number, leetcodeSolved: number }} stats
 * @returns {Promise<string>}
 */
export async function generateCaption(stats) {
    const parts = [];
    if (stats.githubCommits > 0) parts.push(`${stats.githubCommits} GitHub commits`);
    if (stats.leetcodeSolved > 0) parts.push(`${stats.leetcodeSolved} LeetCode problems solved`);

    if (parts.length === 0) {
        return "Keeping the streak alive — back at it tomorrow! 💪";
    }

    const prompt = `You are a social media caption writer. A developer just completed: ${parts.join(" and ")} today.

Write a short, engaging social media post caption (2-3 sentences max) celebrating their progress. Be motivational and use 1-2 relevant emojis. Do not use hashtags. Return ONLY the caption text.`;

    const response = await getAI().models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });

    return response.text?.trim() || "Another productive day in the books! 🚀";
}
