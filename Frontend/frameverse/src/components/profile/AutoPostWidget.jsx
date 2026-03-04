import React from "react";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import StreakCard from "./StreakCard";
import TodayPreview from "./TodayPreview";
import { useAutoPost } from "../../features/autoPost/useAutoPost";
import { useEffect, useState } from "react";

export default function AutoPostWidget({ hideSettingsLink = false }) {
    const { getTodayStats } = useAutoPost();
    const [stats, setStats] = useState(null);

    useEffect(() => {
        // We only need the streak counts for the StreakCard
        getTodayStats().then((data) => {
            if (data?.stats) {
                setStats(data.stats);
            }
        }).catch(() => { });
    }, [getTodayStats]);

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-border-color">
                <h2 className="text-xl font-bold text-text-primary">Your Progress</h2>
                {!hideSettingsLink && (
                    <Link
                        to="/autopost"
                        className="p-2 -mr-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-white/10 transition-all active:scale-95"
                        title="AutoPost Settings"
                    >
                        <Settings className="h-5 w-5" />
                    </Link>
                )}
            </div>

            <StreakCard
                streakCount={stats?.streakCount || 0}
                longestStreak={stats?.longestStreak || 0}
            />

            <TodayPreview />
        </div>
    );
}
