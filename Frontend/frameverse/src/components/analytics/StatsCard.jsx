import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatsCard = ({ label, value, icon: Icon, trend, trendValue, color = "purple" }) => {
    const isPositive = trend === 'up';

    const colorMap = {
        purple: "from-brand-purple to-indigo-500",
        pink: "from-brand-pink to-rose-500",
        orange: "from-brand-orange to-amber-500",
        green: "from-emerald-500 to-teal-500",
        blue: "from-blue-500 to-cyan-500"
    };

    const bgGlow = {
        purple: "group-hover:shadow-brand-purple/20",
        pink: "group-hover:shadow-brand-pink/20",
        orange: "group-hover:shadow-brand-orange/20",
        green: "group-hover:shadow-emerald-500/20",
        blue: "group-hover:shadow-blue-500/20"
    };

    return (
        <div className={`group relative bg-bg-secondary/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/10 hover:shadow-2xl ${bgGlow[color]}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                        {label}
                    </p>
                    <h3 className="text-2xl font-bold mt-2 tracking-tight">
                        {value}
                    </h3>

                    {trendValue && (
                        <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            <span>{trendValue}%</span>
                            <span className="text-text-secondary font-normal ml-0.5">vs last period</span>
                        </div>
                    )}
                </div>

                <div className={`w-12 h-12 rounded-2xl bg-linear-to-br ${colorMap[color]} flex items-center justify-center text-white shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-500`}>
                    <Icon size={22} />
                </div>
            </div>

            {/* Decorative background element */}
            <div className={`absolute -bottom-2 -right-2 w-24 h-24 bg-linear-to-br ${colorMap[color]} opacity-0 group-hover:opacity-5 blur-3xl transition-opacity duration-500`} />
        </div>
    );
};

export default StatsCard;
