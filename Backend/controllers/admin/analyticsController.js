import * as analyticsService from '../../services/analyticsService.js';

export const getOverview = async (req, res) => {
    try {
        const { timeframe } = req.query;
        const data = await analyticsService.getOverviewService(timeframe);
        res.status(200).json(data);
    } catch (error) {
        console.error("Overview Error:", error);
        res.status(500).json({ message: "Failed to fetch overview" });
    }
};

export const getUserGrowth = async (req, res) => {
    try {
        const { timeframe } = req.query;
        const data = await analyticsService.getUserGrowthService(timeframe);
        res.status(200).json(data);
    } catch (error) {
        console.error("User Growth Error:", error);
        res.status(500).json({ message: "Failed to fetch user growth" });
    }
};

export const getMessageActivity = async (req, res) => {
    try {
        const { timeframe } = req.query;
        const data = await analyticsService.getMessageActivityService(timeframe);
        res.status(200).json(data);
    } catch (error) {
        console.error("Message Activity Error:", error);
        res.status(500).json({ message: "Failed to fetch message activity" });
    }
};

export const getTopUsers = async (req, res) => {
    try {
        const data = await analyticsService.getTopUsersService();
        res.status(200).json(data);
    } catch (error) {
        console.error("Top Users Error:", error);
        res.status(500).json({ message: "Failed to fetch top users" });
    }
};

// Returns system health metrics
export const getSystemHealth = async (req, res) => {
    try {
        // Basic uptime calculation
        const uptimeSeconds = process.uptime();

        // DB state (1 = connected)
        const dbStatus = req.app.locals.db?.readyState === 1 ? 'connected' : 'connected';

        // Attempt to grab socket count if available on app locals
        const io = req.app.get("io");
        const activeSockets = io ? io.engine.clientsCount : 0;

        res.status(200).json({
            uptimeSeconds,
            dbStatus,
            activeSockets,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch system health" });
    }
};
export const getTrendingPosts = async (req, res) => {
    try {
        const data = await analyticsService.getTrendingPostsService();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch trending posts" });
    }
};

export const getPlatformActivity = async (req, res) => {
    try {
        const { timeframe } = req.query;
        const data = await analyticsService.getDailyPlatformActivityService(timeframe);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch platform activity" });
    }
};
