import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';

const EngagementChart = ({ data }) => {
    // Expected data: { likes, comments, shares }
    const totalInteractions = (data.likes || 0) + (data.comments || 0) + (data.shares || 0);

    const chartData = [
        { name: 'Likes', value: data.likes || 0, color: '#ec4899' },
        { name: 'Comments', value: data.comments || 0, color: '#8b5cf6' },
        { name: 'Shares', value: data.shares || 0, color: '#f97316' }
    ].filter(d => d.value > 0);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-bg-secondary border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                    <p className="text-xs font-bold text-text-primary mb-1">{payload[0].name}</p>
                    <p className="text-sm font-black text-brand-purple">{payload[0].value.toLocaleString()}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-bg-secondary/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 h-full flex flex-col">
            <div className="mb-6">
                <h3 className="text-lg font-bold">Engagement Breakdown</h3>
                <p className="text-sm text-text-secondary">Distribution of interactions</p>
            </div>

            <div className="flex-1 min-h-[250px] relative">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={90}
                                paddingAngle={8}
                                dataKey="value"
                                stroke="none"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />

                            {/* Center Text Overlays */}
                            <text
                                x="50%"
                                y="45%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="fill-text-primary text-2xl font-black"
                            >
                                {totalInteractions.toLocaleString()}
                            </text>
                            <text
                                x="50%"
                                y="58%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="fill-text-secondary text-[10px] font-bold uppercase tracking-widest"
                            >
                                Interactions
                            </text>

                            <Legend
                                verticalAlign="bottom"
                                align="center"
                                iconType="circle"
                                iconSize={8}
                                formatter={(value) => (
                                    <span className="text-xs text-text-secondary font-medium ml-1">{value}</span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
                        <div className="w-12 h-12 rounded-full border-2 border-white/5 border-t-brand-purple animate-spin" />
                        <span className="text-sm text-text-secondary font-medium">Awaiting interaction data...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EngagementChart;
