import React from 'react';
import { Server, Database, Activity } from 'lucide-react';

const SystemHealthCard = ({ health }) => {
    // Format uptime
    const formatUptime = (seconds) => {
        if (!seconds) return "0h 0m";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    return (
        <div className="bg-bg-secondary p-5 rounded-2xl shadow-sm border border-border-color h-full flex flex-col">
            <h3 className="text-text-primary font-bold mb-4 flex items-center gap-2">
                <Activity size={18} className="text-brand-orange" />
                System Health
            </h3>

            <div className="flex-1 flex flex-col justify-center gap-4">
                {/* Uptime */}
                <div className="flex items-center justify-between p-3 bg-bg-primary/50 dark:bg-bg-primary rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-purple/10 rounded-lg text-brand-purple">
                            <Server size={18} />
                        </div>
                        <span className="text-text-secondary text-sm font-medium">Server Uptime</span>
                    </div>
                    <span className="text-text-primary font-bold">{formatUptime(health?.uptimeSeconds)}</span>
                </div>

                {/* Database */}
                <div className="flex items-center justify-between p-3 bg-bg-primary/50 dark:bg-bg-primary rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-pink/10 rounded-lg text-brand-pink">
                            <Database size={18} />
                        </div>
                        <span className="text-text-secondary text-sm font-medium">Database</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${health?.dbStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="text-text-primary font-bold capitalize">{health?.dbStatus || 'Unknown'}</span>
                    </div>
                </div>

                {/* Active Sockets */}
                <div className="flex items-center justify-between p-3 bg-bg-primary/50 dark:bg-bg-primary rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-orange/10 rounded-lg text-brand-orange">
                            <Activity size={18} />
                        </div>
                        <span className="text-text-secondary text-sm font-medium">Socket Conns</span>
                    </div>
                    <span className="text-text-primary font-bold">{health?.activeSockets || 0}</span>
                </div>
            </div>
        </div>
    );
};

export default SystemHealthCard;
