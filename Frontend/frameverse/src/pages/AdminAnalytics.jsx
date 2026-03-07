import React, { useState, useEffect } from 'react';
import { Users, Activity, MessageSquare, List, Calendar } from 'lucide-react';
import { analyticsAPI } from '../services/api';
import StatsCard from '../components/analytics/StatsCard';
import UserGrowthChart from '../components/analytics/UserGrowthChart';
import MessageActivityChart from '../components/analytics/MessageActivityChart';
import TopUsersTable from '../components/analytics/TopUsersTable';
import SystemHealthCard from '../components/analytics/SystemHealthCard';

const AdminAnalytics = () => {
    const [data, setData] = useState({
        overview: null,
        userGrowth: [],
        messageActivity: [],
        topUsers: [],
        systemHealth: null
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const [overview, userGrowth, messageActivity, topUsers, systemHealth] = await Promise.all([
                    analyticsAPI.getOverview(),
                    analyticsAPI.getUserGrowth(),
                    analyticsAPI.getMessageActivity(),
                    analyticsAPI.getTopUsers(),
                    analyticsAPI.getSystemHealth()
                ]);

                setData({
                    overview,
                    userGrowth,
                    messageActivity,
                    topUsers,
                    systemHealth
                });
            } catch (err) {
                console.error("Failed to load analytics:", err);
                setError("Failed to load analytics dashboard.");
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();

        // Optional: Setup interval to refresh system health every 30 seconds
        const interval = setInterval(async () => {
            try {
                const health = await analyticsAPI.getSystemHealth();
                setData(prev => ({ ...prev, systemHealth: health }));
            } catch (e) {
                console.error("Health poll failed");
            }
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-primary flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-bg-primary flex items-center justify-center text-brand-pink">
                <p>{error}</p>
            </div>
        );
    }

    const { overview, userGrowth, messageActivity, topUsers, systemHealth } = data;

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary mt-4 md:mt-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">

                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-orange to-brand-pink">
                        Analytics Overview
                    </h1>
                    <p className="text-text-secondary mt-1">Platform performance and user engagement metrics</p>
                </div>

                {/* Row 1: Summary Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatsCard
                        title="Total Users"
                        value={overview?.totalUsers?.toLocaleString() || 0}
                        trend={`${overview?.newRegistrationsToday || 0} today`}
                        isPositive={true}
                        icon={Users}
                    />
                    <StatsCard
                        title="Active Users (24h)"
                        value={overview?.activeUsers?.toLocaleString() || 0}
                        trend="Online traffic"
                        isPositive={true}
                        icon={Activity}
                    />
                    <StatsCard
                        title="Total Messages"
                        value={overview?.totalMessages?.toLocaleString() || 0}
                        icon={MessageSquare}
                    />
                    <StatsCard
                        title="Total Conversations"
                        value={overview?.totalChats?.toLocaleString() || 0}
                        icon={List}
                    />
                </div>

                {/* Row 2: Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2">
                        <UserGrowthChart data={userGrowth} />
                    </div>
                    <div className="lg:col-span-1">
                        <SystemHealthCard health={systemHealth} />
                    </div>
                </div>

                {/* Row 3: Secondary Analytics Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
                    <div>
                        <MessageActivityChart data={messageActivity} />
                    </div>
                    <div>
                        <TopUsersTable data={topUsers} />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminAnalytics;
