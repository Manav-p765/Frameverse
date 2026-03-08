import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Heart, Share2, Activity, Zap, ShieldCheck, MessageSquare, Briefcase } from 'lucide-react';
import { userAnalyticsAPI } from '../../services/api';
import { useSocketEvent } from '../../hooks/useSocket';
import StatsCard from '../../components/analytics/StatsCard';
import UserGrowthChart from '../../components/analytics/UserGrowthChart';
import EngagementChart from '../../components/analytics/EngagementChart';
import TrendingPosts from '../../components/analytics/TrendingPosts';
import RecentActivity from '../../components/analytics/RecentActivity';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const AnalyticsDashboard = () => {
    const [timeframe, setTimeframe] = useState('30d');
    const [stats, setStats] = useState(null);
    const [growthData, setGrowthData] = useState([]);
    const [trendingPosts, setTrendingPosts] = useState([]);
    const [engagementData, setEngagementData] = useState({ likes: 0, comments: 0, shares: 0 });
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setCurrentUser(user);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const { summary, growth, trending, engagement, recent } = await userAnalyticsAPI.getDashboard(timeframe);

            setStats(summary);
            setGrowthData(growth || []);
            setTrendingPosts(trending || []);
            setEngagementData(engagement || { likes: 0, comments: 0, shares: 0 });

            // Format recent activity timeAgo
            const formattedRecent = (recent || []).map(act => ({
                ...act,
                timeAgo: dayjs(act.createdAt).fromNow()
            }));
            setRecentActivities(formattedRecent);

        } catch (err) {
            console.error("Dashboard fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [timeframe]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Real-time updates via Socket.io - Scoped to user's content
    useSocketEvent("postLiked", useCallback((data) => {
        // Only update if it's our post (backend broadcast should handle this, but we can verify)
        setStats(prev => prev ? { ...prev, likes: prev.likes + 1, totalInteractions: prev.totalInteractions + 1 } : prev);
        setEngagementData(prev => ({ ...prev, likes: (prev.likes || 0) + 1 }));

        setRecentActivities(prev => [{
            id: Date.now(),
            type: 'like',
            user: { username: data.username, profilePic: data.userProfilePic },
            description: 'liked your post',
            timeAgo: 'Just now',
            postImage: data.postImage
        }, ...prev].slice(0, 10));
    }, []));

    useSocketEvent("newNotification", useCallback((notif) => {
        if (notif.type === 'follow') {
            setStats(prev => prev ? { ...prev, followers: prev.followers + 1 } : prev);
        }

        setRecentActivities(prev => [{
            id: notif._id,
            type: notif.type,
            user: { username: notif.senderName, profilePic: notif.senderAvatar },
            description:
                notif.type === 'follow' ? 'started following you' :
                    notif.type === 'comment' ? 'commented on your post' :
                        notif.type === 'share' ? 'shared your post' : 'interacted with your content',
            timeAgo: 'Just now',
            postImage: notif.postImage
        }, ...prev].slice(0, 10));
    }, []));

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
                <Zap size={48} className="text-brand-purple animate-bounce" />
                <p className="text-text-secondary font-bold tracking-widest animate-pulse uppercase">Syncing Your Insights...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="px-2 py-0.5 rounded-md bg-brand-purple/10 text-brand-purple text-[10px] font-bold uppercase tracking-wider border border-brand-purple/20">
                            Creator Insight
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                            <ShieldCheck size={12} />
                            Your Performance
                        </div>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-text-primary uppercase">
                        Social <span className="bg-clip-text text-transparent bg-linear-to-r from-brand-purple to-brand-pink">Engagement</span>
                    </h1>
                    <p className="text-text-secondary mt-2 font-medium italic">Detailed breakdown of how your frames are performing.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Timeframe Selector */}
                    <div className="flex p-1 bg-bg-secondary rounded-xl border border-white/5">
                        {['7d', '30d', '90d', 'all'].map((tf) => (
                            <button
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${timeframe === tf
                                    ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20'
                                    : 'text-text-secondary hover:text-text-primary'
                                    }`}
                            >
                                {tf === 'all' ? 'All' : tf}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={fetchData}
                        className="group flex items-center gap-2 px-6 py-3 rounded-2xl bg-bg-secondary border border-white/5 hover:border-brand-purple/30 transition-all hover:shadow-[0_0_30px_-10px_rgba(139,92,246,0.3)]"
                    >
                        <Activity size={18} className="text-brand-purple group-active:rotate-180 transition-transform duration-500" />
                        <span className="text-sm font-bold uppercase tracking-widest">Update</span>
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <StatsCard
                    label="Total Posts"
                    value={stats?.totalPosts?.toLocaleString() || "0"}
                    icon={FileText}
                    trend="up"
                    trendValue="New"
                    color="purple"
                />
                <StatsCard
                    label="Followers"
                    value={stats?.followers?.toLocaleString() || "0"}
                    icon={Zap}
                    trend="up"
                    trendValue="Active"
                    color="orange"
                />
                <StatsCard
                    label="Reach Score"
                    value={stats?.engagementScore?.toLocaleString() || "0"}
                    icon={ShieldCheck}
                    trend="up"
                    trendValue="Top 1%"
                    color="pink"
                />
                <StatsCard
                    label="Total Interactions"
                    value={stats?.totalInteractions?.toLocaleString() || "0"}
                    icon={Heart}
                    trend="up"
                    trendValue="Live"
                    color="blue"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <div className="lg:col-span-2">
                    <UserGrowthChart data={growthData} />
                </div>
                <div>
                    <EngagementChart data={engagementData} />
                </div>
            </div>

            {/* Bottom Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <TrendingPosts
                        posts={trendingPosts.filter(p => p.owner?._id === currentUser?._id || p.owner === currentUser?._id)}
                    />
                </div>
                <div>
                    <RecentActivity activities={recentActivities} />
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
