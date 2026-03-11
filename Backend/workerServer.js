import dotenv from "dotenv";
dotenv.config();

import connectdb from "./config/db.js";
import "./config/firebaseAdmin.js";

// Currently existing workers
import { startAutoPostWorker } from "./workers/autoPost.worker.js";
import calculateTrendingScores from "./workers/trendingWorker.js";

// Setup database connection so workers have access to models
connectdb();

console.log("🚀 [Worker Server] Starting background workers...");

// 1. Start original AutoPost worker
try {
    startAutoPostWorker();
    console.log("✅ AutoPost worker started");
} catch (err) {
    console.error("❌ Failed to start AutoPost worker:", err);
}

// 2. We'll add BullMQ workers here next as part of queue.js
