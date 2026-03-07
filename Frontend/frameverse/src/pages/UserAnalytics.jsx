import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, Eye, Zap } from 'lucide-react';
import { userAnalyticsAPI } from '../services/api';
import ProfileStatsCard from '../components/analytics/user/ProfileStatsCard';
import UserActivityChart from '../components/analytics/user/UserActivityChart';
import EngagementChart from '../components/analytics/user/EngagementChart';
import ActivityHeatmap from '../components/analytics/user/ActivityHeatmap';
import RecentActivity from '../components/analytics/user/RecentActivity';
import SEOHead from '../components/SEOHead';

const UserAnalytics = () => {
    const [data, setData] = useState({
        summary: null,
        activity: [],
        engagement: [],
        heatmap: [],
        recent: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const [summary, activity, engagement, heatmap, recent] = await Promise.all([
                    userAnalyticsAPI.getSummary(),
                    userAnalyticsAPI.getActivity(),
                    userAnalyticsAPI.getEngagement(),
                    userAnalyticsAPI.getActiveHours(),
                    userAnalyticsAPI.getRecentActivity()
                ]);

                setData({ summary, activity, engagement, heatmap, recent });
            } catch (err) {
                console.error("Failed to load user analytics:", err);
                setError("Failed to load personal analytics dashboard.");
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-text-secondary text-sm">Loading analytics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-bg-primary flex items-center justify-center">
                <p className="text-brand-pink">{error}</p>
            </div>
        );
    }

    const { summary, activity, engagement, heatmap, recent } = data;

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary mt-4 md:mt-10 overflow-hidden">
            <SEOHead
                title="Personal Analytics - Frameverse"
                description="View your personal engagement and activity metrics."
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">

                <div className="mb-8 pl-1">
                    <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-pink drop-shadow-sm">
                        Your Analytics
                    </h1>
                    <p className="text-text-secondary mt-1 text-sm font-medium">Activity and engagement insights</p>
                </div>

                {/* Row 1: Profile Summary Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <ProfileStatsCard
                        title="Messages Sent"
                        value={summary?.totalMessages?.toLocaleString() || 0}
                        icon={MessageSquare}
                        colorClass="text-brand-purple"
                    />
                    <ProfileStatsCard
                        title="Conversations"
                        value={summary?.totalChats?.toLocaleString() || 0}
                        icon={Users}
                        colorClass="text-brand-pink"
                    />
                    <ProfileStatsCard
                        title="Profile Views"
                        value={summary?.profileViews?.toLocaleString() || 0}
                        icon={Eye}
                        colorClass="text-brand-orange"
                    />
                    <ProfileStatsCard
                        title="Engagement Score"
                        value={summary?.engagementScore?.toLocaleString() || 0}
                        icon={Zap}
                        colorClass="text-green-500"
                    />
                </div>

                {/* Row 2: Charts Area (Activity & Engagement) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2">
                        <UserActivityChart data={activity} />
                    </div>
                    <div className="lg:col-span-1">
                        <EngagementChart data={engagement} />
                    </div>
                </div>

                {/* Row 3: Heatmap & Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">
                    <div className="lg:col-span-2">
                        <ActivityHeatmap data={heatmap} />
                    </div>
                    <div className="lg:col-span-1">
                        <RecentActivity data={recent} />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default UserAnalytics;
