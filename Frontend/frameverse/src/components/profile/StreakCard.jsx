import React from 'react';
import { Flame } from 'lucide-react';

export default function StreakCard({ streakCount = 0, longestStreak = 0 }) {
    const isActive = streakCount > 0;

    // Determine non-cringe motivational text
    let motivation = "Start your coding journey today.";
    if (streakCount === 1) motivation = "Great start. Let's make it two.";
    else if (streakCount > 1 && streakCount < 5) motivation = "Building momentum. Keep showing up.";
    else if (streakCount >= 5 && streakCount < 14) motivation = "You're building a strong habit.";
    else if (streakCount >= 14) motivation = "Unstoppable streak. Keep pushing.";

    return (
        <div
            className={`
        relative overflow-hidden rounded-2xl border bg-white/5 p-6 
        transition-all duration-300
        ${isActive
                    ? 'border-orange-500/30 bg-gradient-to-br from-[#18181c] to-[#18181c] shadow-[0_0_25px_rgba(249,115,22,0.1)]'
                    : 'border-white/10'
                }
      `}
        >
            {/* Background ambient glow behind icon if active */}
            {isActive && (
                <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
            )}

            <div className="relative flex items-center justify-between">
                <div>
                    {/* Main Streak Number */}
                    <div className="flex items-baseline gap-2">
                        <span
                            className={`text-5xl font-black tracking-tight ${isActive
                                    ? 'bg-gradient-to-br from-orange-400 to-red-500 bg-clip-text text-transparent'
                                    : 'text-gray-100'
                                }`}
                        >
                            {streakCount}
                        </span>
                        <span className={`text-lg font-medium ${isActive ? 'text-orange-400/80' : 'text-gray-400'}`}>
                            day streak
                        </span>
                    </div>

                    {/* Motivational micro text */}
                    <p className="mt-1 text-sm text-gray-400">
                        {motivation}
                    </p>

                    {/* Longest streak */}
                    <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-gray-300 border border-white/5">
                        <span className="text-gray-500">Longest:</span>
                        <span className="text-gray-200">{longestStreak} days</span>
                    </div>
                </div>

                {/* Flame Icon */}
                <div
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl backdrop-blur-sm
            ${isActive
                            ? 'bg-orange-500/10 shadow-inner'
                            : 'bg-white/5'
                        }
          `}
                >
                    <Flame
                        className={`h-8 w-8 ${isActive ? 'fill-orange-500 text-orange-500' : 'text-gray-500'
                            }`}
                        strokeWidth={1.5}
                    />
                </div>
            </div>
        </div>
    );
}
