import sharp from "sharp";
import { uploadToCloudinary } from "../../config/cloudinary.js";

/**
 * Generate a stats-card image from user activity data and upload to Cloudinary.
 * Uses sharp + inline SVG — no Puppeteer/Chromium needed.
 *
 * @param {string} userId
 * @param {string} date  — YYYY-MM-DD
 * @param {{ githubCommits: number, leetcodeSolved: number }} stats
 * @returns {Promise<{ url: string, public_id: string }>}
 */
export async function generateStatsImage(userId, date, stats) {
  const width = 800;
  const height = 420;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0f0c29"/>
          <stop offset="50%" style="stop-color:#302b63"/>
          <stop offset="100%" style="stop-color:#24243e"/>
        </linearGradient>
        <linearGradient id="title" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#a78bfa"/>
          <stop offset="100%" style="stop-color:#60a5fa"/>
        </linearGradient>
        <clipPath id="cardClip">
          <rect x="40" y="30" width="720" height="360" rx="24"/>
        </clipPath>
      </defs>

      <!-- Background -->
      <rect width="${width}" height="${height}" fill="url(#bg)"/>

      <!-- Card background -->
      <rect x="40" y="30" width="720" height="360" rx="24"
            fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>

      <!-- Title -->
      <text x="80" y="90" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700"
            fill="url(#title)">Daily Dev Stats</text>

      <!-- Date -->
      <text x="680" y="88" font-family="Arial, Helvetica, sans-serif" font-size="14"
            fill="rgba(255,255,255,0.5)" text-anchor="end">${date}</text>

      <!-- GitHub stat box -->
      <rect x="80" y="120" width="310" height="180" rx="16"
            fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      <text x="235" y="220" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="700"
            fill="#a78bfa" text-anchor="middle">${stats.githubCommits}</text>
      <text x="235" y="260" font-family="Arial, Helvetica, sans-serif" font-size="14"
            fill="rgba(255,255,255,0.6)" text-anchor="middle">GitHub Commits</text>

      <!-- LeetCode stat box -->
      <rect x="410" y="120" width="310" height="180" rx="16"
            fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      <text x="565" y="220" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="700"
            fill="#fbbf24" text-anchor="middle">${stats.leetcodeSolved}</text>
      <text x="565" y="260" font-family="Arial, Helvetica, sans-serif" font-size="14"
            fill="rgba(255,255,255,0.6)" text-anchor="middle">LeetCode Solved</text>

      <!-- Footer -->
      <text x="400" y="350" font-family="Arial, Helvetica, sans-serif" font-size="13"
            fill="rgba(255,255,255,0.3)" text-anchor="middle">Frameverse • Auto Post</text>
    </svg>`;

  // Render SVG to PNG buffer using sharp
  const pngBuffer = await sharp(Buffer.from(svg))
    .png()
    .toBuffer();

  // Convert to base64 data URI for Cloudinary upload
  const dataUri = `data:image/png;base64,${pngBuffer.toString("base64")}`;
  const result = await uploadToCloudinary(dataUri, "autopost");

  console.log(`[AutoPost] Stats image uploaded: ${result.url}`);
  return result;
}
