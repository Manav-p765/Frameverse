import nodeHtmlToImage from "node-html-to-image";
import { uploadToCloudinary } from "../../config/cloudinary.js";

/**
 * Generate a stats-card image from user activity data and upload to Cloudinary.
 *
 * @param {string} userId
 * @param {string} date  — YYYY-MM-DD
 * @param {{ githubCommits: number, leetcodeSolved: number }} stats
 * @returns {Promise<{ url: string, public_id: string }>}
 */
export async function generateStatsImage(userId, date, stats) {
    const html = `
  <html>
  <head>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      body {
        margin: 0;
        padding: 0;
        width: 800px;
        height: 420px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
        font-family: 'Inter', sans-serif;
        color: #fff;
      }
      .card {
        width: 720px;
        padding: 40px;
        border-radius: 24px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.1);
        backdrop-filter: blur(10px);
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 32px;
      }
      .title {
        font-size: 24px;
        font-weight: 700;
        background: linear-gradient(90deg, #a78bfa, #60a5fa);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .date {
        font-size: 14px;
        color: rgba(255,255,255,0.5);
      }
      .stats {
        display: flex;
        gap: 24px;
      }
      .stat-box {
        flex: 1;
        padding: 24px;
        border-radius: 16px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.08);
        text-align: center;
      }
      .stat-value {
        font-size: 48px;
        font-weight: 700;
        line-height: 1;
        margin-bottom: 8px;
      }
      .stat-label {
        font-size: 14px;
        color: rgba(255,255,255,0.6);
        font-weight: 400;
      }
      .github .stat-value { color: #a78bfa; }
      .leetcode .stat-value { color: #fbbf24; }
      .footer {
        margin-top: 24px;
        text-align: center;
        font-size: 13px;
        color: rgba(255,255,255,0.3);
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header">
        <div class="title">Daily Dev Stats</div>
        <div class="date">${date}</div>
      </div>
      <div class="stats">
        <div class="stat-box github">
          <div class="stat-value">${stats.githubCommits}</div>
          <div class="stat-label">GitHub Commits</div>
        </div>
        <div class="stat-box leetcode">
          <div class="stat-value">${stats.leetcodeSolved}</div>
          <div class="stat-label">LeetCode Solved</div>
        </div>
      </div>
      <div class="footer">Frameverse • Auto Post</div>
    </div>
  </body>
  </html>`;

    // Render HTML to PNG buffer
    const buffer = await nodeHtmlToImage({
        html,
        type: "png",
        encoding: "base64",
        puppeteerArgs: { args: ["--no-sandbox", "--disable-setuid-sandbox"] },
    });

    // Upload base64 image to Cloudinary
    const dataUri = `data:image/png;base64,${buffer}`;
    const result = await uploadToCloudinary(dataUri, "autopost");

    console.log(`[AutoPost] Stats image uploaded: ${result.url}`);
    return result;
}
