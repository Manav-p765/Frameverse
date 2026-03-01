import React, { useEffect, useState } from 'react';
import { useAutoPost } from '../../features/autoPost/useAutoPost';
import { Github, Code2, Sparkles, Clock, Image as ImageIcon } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export default function TodayPreview() {
    const { loading, error, getTodayStats } = useAutoPost();
    const [stats, setStats] = useState(null);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getTodayStats();
                // Assuming the backend returns the DailyStats document
                setStats(data.stats);
            } catch (err) {
                // Error handled by hook
            } finally {
                setInitialLoading(false);
            }
        };

        fetchStats();
    }, [getTodayStats]);

    if (initialLoading || loading) {
        return <TodayPreviewSkeleton />;
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-400">
                <p className="text-sm font-medium">Failed to load today's preview.</p>
                <p className="text-xs mt-1 opacity-80">{error}</p>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-lg">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/5 mb-4">
                    <Clock className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-white">No activity yet today</h3>
                <p className="mt-2 text-sm text-gray-400">
                    Your stats will appear here once you push code to GitHub or solve problems on LeetCode.
                    The worker runs automatically based on your schedule.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Today's Progress</h2>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Updated {dayjs(stats.updatedAt).fromNow()}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* GitHub Stat */}
                <div className="flex flex-col rounded-xl border border-white/5 bg-black/20 p-4">
                    <div className="mb-3 flex items-center gap-2 text-gray-400">
                        <Github className="h-4 w-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">GitHub</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold tracking-tight text-white">
                            {stats.githubCommits}
                        </span>
                        <span className="text-sm text-gray-500">commits</span>
                    </div>
                </div>

                {/* LeetCode Stat */}
                <div className="flex flex-col rounded-xl border border-white/5 bg-black/20 p-4">
                    <div className="mb-3 flex items-center gap-2 text-gray-400">
                        <Code2 className="h-4 w-4 text-[#ffa116]" />
                        <span className="text-xs font-medium uppercase tracking-wider">LeetCode</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold tracking-tight text-white">
                            {stats.leetcodeSolved}
                        </span>
                        <span className="text-sm text-gray-500">solved</span>
                    </div>
                </div>
            </div>

            {stats.caption && (
                <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-blue-400" />
                            AI Generated Caption
                        </h3>
                        {stats.posted && (
                            <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-green-400 uppercase">
                                Posted to Feed
                            </span>
                        )}
                    </div>
                    <div className="rounded-xl border border-white/5 bg-black/40 p-4 text-sm leading-relaxed text-gray-300">
                        {stats.caption}
                    </div>
                </div>
            )}

            {stats.imageUrl && (
                <div className="mt-4 flex items-center justify-between rounded-xl border border-white/5 bg-black/20 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                            <ImageIcon className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-200">Stats Card Generated</p>
                            <p className="text-xs text-gray-500">Ready for layout</p>
                        </div>
                    </div>
                    <a
                        href={stats.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        View Image
                    </a>
                </div>
            )}
        </div>
    );
}

// Loading Skeleton
function TodayPreviewSkeleton() {
    return (
        <div className="rounded-2xl border border-white/5 bg-white/5 p-6 animate-pulse">
            <div className="mb-6 flex items-center justify-between">
                <div className="h-6 w-32 rounded bg-white/10" />
                <div className="h-4 w-24 rounded bg-white/5" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="h-28 rounded-xl bg-white/5" />
                <div className="h-28 rounded-xl bg-white/5" />
            </div>

            <div className="mt-6 h-6 w-40 rounded bg-white/5 mb-2" />
            <div className="h-24 rounded-xl bg-white/5" />
        </div>
    );
}
