import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const ActivityHeatmap = ({ data }) => {
    return (
        <div className="bg-bg-secondary p-5 rounded-2xl shadow-sm border border-border-color h-full flex flex-col">
            <h3 className="text-text-primary font-bold mb-4">Active Hours (Message Volume)</h3>
            <div className="flex-1 w-full min-h-[250px]">
                {data && data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.1} />
                            <XAxis
                                dataKey="hour"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                interval={3} // Show fewer ticks on x-axis
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                            <Tooltip
                                cursor={{ fill: 'rgba(247, 86, 124, 0.1)' }}
                                contentStyle={{ backgroundColor: '#1f2937', borderRadius: '12px', border: 'none', color: '#fff' }}
                                itemStyle={{ color: '#f9a8d4' }}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.count > 0 ? '#f7567c' : '#e5e7eb'}
                                        fillOpacity={entry.count > 0 ? 1 : 0.1}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-text-secondary text-sm">
                        Not enough data to calculate active hours.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityHeatmap;
