import userAnalyticsService from "../services/userAnalyticsService.js";

export const getSummary = async (req, res) => {
    try {
        const { timeframe } = req.query;
        const summary = await userAnalyticsService.getUserSummary(req.userId, timeframe);
        res.status(200).json(summary);
    } catch (error) {
        console.error("Error in user analytics getSummary:", error);
        res.status(500).json({ message: "Failed to fetch user summary analytics" });
    }
};

export const getGrowth = async (req, res) => {
    try {
        const { timeframe } = req.query;
        const growth = await userAnalyticsService.getUserGrowth(req.userId, timeframe);
        res.status(200).json(growth);
    } catch (error) {
        console.error("Error in user analytics getGrowth:", error);
        res.status(500).json({ message: "Failed to fetch growth analytics" });
    }
};

export const getEngagement = async (req, res) => {
    try {
        const { timeframe } = req.query;
        const engagement = await userAnalyticsService.getEngagementStats(req.userId, timeframe);
        res.status(200).json(engagement);
    } catch (error) {
        console.error("Error in user analytics getEngagement:", error);
        res.status(500).json({ message: "Failed to fetch engagement analytics" });
    }
};

export const getEngagementHistory = async (req, res) => {
    try {
        const { timeframe } = req.query;
        const history = await userAnalyticsService.getEngagementHistory(req.userId, timeframe);
        res.status(200).json(history);
    } catch (error) {
        console.error("Error in user analytics getEngagementHistory:", error);
        res.status(500).json({ message: "Failed to fetch engagement history" });
    }
};

export const getTrending = async (req, res) => {
    try {
        const trending = await userAnalyticsService.getTrendingPosts(req.userId);
        res.status(200).json(trending);
    } catch (error) {
        console.error("Error in user analytics getTrending:", error);
        res.status(500).json({ message: "Failed to fetch trending posts" });
    }
};

export const getRecentActivity = async (req, res) => {
    try {
        const recent = await userAnalyticsService.getRecentActivity(req.userId);
        res.status(200).json(recent);
    } catch (error) {
        console.error("Error in user analytics getRecentActivity:", error);
        res.status(500).json({ message: "Failed to fetch recent activity" });
    }
};

export const getActiveHours = async (req, res) => {
    try {
        const hours = await userAnalyticsService.getActiveHours(req.userId);
        res.status(200).json(hours);
    } catch (error) {
        console.error("Error in user analytics getActiveHours:", error);
        res.status(500).json({ message: "Failed to fetch active hours" });
    }
};

export const getDashboardBatch = async (req, res) => {
    try {
        const { timeframe } = req.query;
        const data = await userAnalyticsService.getDashboardBatch(req.userId, timeframe);
        res.status(200).json(data);
    } catch (error) {
        console.error("Error in user analytics getDashboardBatch:", error);
        res.status(500).json({ message: "Failed to fetch dashboard analytics" });
    }
};
