import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart
} from 'recharts';

const UserGrowthChart = ({ data }) => {
    console.log("UserGrowthChart data:", data);
    return (
        <div className="bg-bg-secondary/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 h-[400px]">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-lg font-bold">Follower Growth</h3>
                    <p className="text-sm text-text-secondary">Audience trends over the last 15 days</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-brand-purple" />
                        <span className="text-xs text-text-secondary font-medium">Followers</span>
                    </div>
                </div>
            </div>

            <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#ffffff05" />
                        <XAxis
                            dataKey="_id"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#5a5a6a', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#5a5a6a', fontSize: 12 }}
                            dx={-10}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#18181c',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '16px',
                                fontSize: '12px',
                                color: '#fff'
                            }}
                            itemStyle={{ color: '#8b5cf6' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#purpleGradient)"
                            animationDuration={2000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default UserGrowthChart;
