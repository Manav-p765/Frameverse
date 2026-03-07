import express from "express";
import { isLoggedIn } from "../middleware.js";
import {
    getSummary,
    getGrowth,
    getEngagement,
    getEngagementHistory,
    getTrending,
    getRecentActivity,
    getActiveHours,
    getDashboardBatch
} from "../controllers/userAnalyticsController.js";

const router = express.Router();

// All analytics scoped explicitly to req.userId
router.use(isLoggedIn);

router.get("/dashboard", getDashboardBatch);
router.get("/summary", getSummary);
router.get("/growth", getGrowth);
router.get("/engagement", getEngagement);
router.get("/engagement-history", getEngagementHistory);
router.get("/trending", getTrending);
router.get("/recent", getRecentActivity);
router.get("/active-hours", getActiveHours);

export default router;
