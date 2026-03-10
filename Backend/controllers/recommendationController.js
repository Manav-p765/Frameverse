import { getRecommendations } from "../services/userRecommendationService.js";

export const getSuggestedUsers = async (req, res) => {
    try {
        const userId = req.userId; // Provided by isLoggedIn middleware
        const users = await getRecommendations(userId);
        res.status(200).json({ users });
    } catch (error) {
        console.error("Failed to fetch suggested users:", error);
        res.status(500).json({ message: "Failed to fetch suggested users" });
    }
};
