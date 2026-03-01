import { useState, useCallback } from "react";
import api from "../../services/post.service";

/**
 * Custom hook for interacting with the AutoPost backend endpoints.
 */
export function useAutoPost() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Helper to wrap API calls with loading and error state management.
     */
    const withLoading = async (apiCall) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiCall();
            return response.data;
        } catch (err) {
            const message = err.response?.data?.message || err.message || "An error occurred";
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetch the user's auto-post settings
     */
    const getSettings = useCallback(() => {
        return withLoading(() => api.get("/api/autopost/settings"));
    }, []);

    /**
     * Update the user's auto-post settings
     * @param {Object} data { enabled, postTime, timezone, selectedApps }
     */
    const updateSettings = useCallback((data) => {
        return withLoading(() => api.put("/api/autopost/settings", data));
    }, []);

    /**
     * Trigger an immediate run of the worker logic for this user
     */
    const runNow = useCallback(() => {
        return withLoading(() => api.post("/api/autopost/run"));
    }, []);

    /**
     * Fetch today's generated stats/activity for the user
     */
    const getTodayStats = useCallback(() => {
        return withLoading(() => api.get("/api/autopost/stats/today"));
    }, []);

    return {
        loading,
        error,
        getSettings,
        updateSettings,
        runNow,
        getTodayStats,
    };
}
