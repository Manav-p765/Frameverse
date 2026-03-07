import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const UserActivityChart = ({ data }) => {
    return (
        <div className="bg-bg-secondary p-5 rounded-2xl shadow-sm border border-border-color h-full flex flex-col">
            <h3 className="text-text-primary font-bold mb-4">Messaging Activity (30 Days)</h3>
            <div className="flex-1 w-full min-h-[300px]">
                {data && data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.1} />
                            <XAxis
                                dataKey="_id"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#9ca3af' }}
                                tickMargin={10}
                                tickFormatter={(val) => {
                                    const d = new Date(val);
                                    return `${d.getMonth() + 1}/${d.getDate()}`;
                                }}
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', borderRadius: '12px', border: 'none', color: '#fff' }}
                                itemStyle={{ color: '#c4b5fd' }}
                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                            />
                            <Area type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={3} fillOpacity={1} fill="url(#colorMessages)" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-text-secondary text-sm">
                        No activity data available.
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserActivityChart;
