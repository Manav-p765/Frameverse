import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Heart, MessageSquare, Share2, Activity, Target, FileText } from 'lucide-react';
import { userAnalyticsAPI } from "../../services/api";
import StatsCard from "../../components/analytics/StatsCard";
import UserGrowthChart from "../../components/analytics/UserGrowthChart";
import EngagementChart from "../../components/analytics/EngagementChart";
import RecentActivity from "../../components/analytics/RecentActivity";

const EngagementDashboard = () => {
    const [timeframe, setTimeframe] = useState('30d');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchEngagement = useCallback(async () => {
        try {
            setLoading(true);
            const [summary, activity, engagement, recent] = await Promise.all([
                userAnalyticsAPI.getSummary(timeframe),
                userAnalyticsAPI.getActivity(timeframe),
                userAnalyticsAPI.getEngagement(timeframe),
                userAnalyticsAPI.getRecentActivity()
            ]);

            setData({ summary, activity, engagement, recent });
        } catch (err) {
            console.error("Engagement fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [timeframe]);

    useEffect(() => {
        fetchEngagement();
    }, [fetchEngagement]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-brand-purple border-t-transparent animate-spin" />
                <p className="text-text-secondary font-bold uppercase tracking-widest text-xs">Analyzing your impact...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 pb-32">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tighter">
                        Social <span className="text-brand-pink">Engagement</span>
                    </h1>
                    <p className="text-text-secondary mt-2 font-medium">Deep dive into how your audience interacts with your frames.</p>
                </div>

                {/* Timeframe Selector */}
                <div className="flex p-1 bg-bg-secondary rounded-xl border border-white/5 self-start sm:self-center">
                    {['7d', '30d', '90d', 'all'].map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all ${timeframe === tf
                                    ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20'
                                    : 'text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            {tf === 'all' ? 'All' : tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metric Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <StatsCard
                    label="Reach Score"
                    value={data.summary?.engagementScore || 0}
                    icon={Target}
                    color="orange"
                />
                <StatsCard
                    label="Total Posts"
                    value={data.summary?.totalPosts || 0}
                    icon={FileText}
                    trend="up"
                    trendValue="1.2"
                    color="purple"
                />
                <StatsCard
                    label="Total Interactions"
                    value={data.summary?.totalInteractions || 0}
                    icon={Activity}
                    color="pink"
                />
                <StatsCard
                    label="Followers"
                    value={data.summary?.followers || 0}
                    icon={Heart}
                    color="blue"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <div className="lg:col-span-2 min-h-[300px] sm:min-h-[400px]">
                    <UserGrowthChart data={data.activity} />
                </div>
                <div className="min-h-[300px]">
                    <EngagementChart data={{
                        likes: data.summary?.totalLikes || 0,
                        comments: data.summary?.totalComments || 0,
                        shares: data.summary?.totalShares || 0
                    }} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-bg-secondary/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center h-full">
                        <div className="w-20 h-20 rounded-full bg-brand-purple/10 flex items-center justify-center mb-6">
                            <Activity className="text-brand-purple" size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Algorithm Insight</h3>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            Your current reach is driven by high <b>Recency</b>. Posting between 6PM and 9PM could boost engagement by 22% based on platform-wide activity.
                        </p>
                    </div>
                </div>
                <div className="lg:col-span-2">
                    <RecentActivity activities={data.recent} />
                </div>
            </div>
        </div>
    );
};

export default EngagementDashboard;
