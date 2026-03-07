import React from 'react';
import { UserPlus, Heart, MessageSquare, Share2 } from 'lucide-react';

const RecentActivity = ({ activities }) => {
    const getIcon = (type) => {
        switch (type) {
            case 'follow': return { Icon: UserPlus, color: 'text-brand-purple', bg: 'bg-brand-purple/10' };
            case 'like': return { Icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/10' };
            case 'comment': return { Icon: MessageSquare, color: 'text-brand-orange', bg: 'bg-brand-orange/10' };
            case 'share': return { Icon: Share2, color: 'text-blue-500', bg: 'bg-blue-500/10' };
            default: return { Icon: Heart, color: 'text-text-secondary', bg: 'bg-bg-secondary' };
        }
    };

    return (
        <div className="bg-bg-secondary/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6">
            <div className="mb-8">
                <h3 className="text-lg font-bold">Real-time Insights</h3>
                <p className="text-sm text-text-secondary">Latest interactions across your profile</p>
            </div>

            <div className="space-y-6">
                {activities?.map((activity, idx) => {
                    const { Icon, color, bg } = getIcon(activity.type);
                    return (
                        <div key={activity.id || idx} className="relative flex gap-4 pr-4 transition-all hover:translate-x-1">
                            {/* Connector line */}
                            {idx !== activities.length - 1 && (
                                <div className="absolute left-6 top-10 bottom-[-24px] w-[1px] bg-linear-to-b from-white/10 to-transparent" />
                            )}

                            <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center shrink-0 border border-white/5 shadow-inner`}>
                                <Icon size={20} className={color} />
                            </div>

                            <div className="flex-1 pt-1 min-w-0">
                                <p className="text-sm text-text-primary leading-tight">
                                    <span className="font-bold">{activity.user?.username || 'Someone'}</span>
                                    {" "}
                                    <span className="text-text-secondary">{activity.description}</span>
                                </p>
                                <p className="text-xs text-text-secondary/50 mt-1 uppercase font-bold tracking-tighter">
                                    {activity.timeAgo}
                                </p>
                            </div>

                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/5 opacity-40 hover:opacity-100 transition-opacity">
                                {activity.postImage && (
                                    <img src={activity.postImage} alt="activity" className="w-full h-full object-cover" />
                                )}
                            </div>
                        </div>
                    );
                })}

                {!activities?.length && (
                    <div className="py-12 flex flex-col items-center gap-3 opacity-30">
                        <div className="w-1 bg-white/10 h-12 rounded-full" />
                        <p className="text-sm font-medium">Listening for live updates...</p>
                    </div>
                )}
            </div>

            <button className="w-full mt-8 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest text-text-secondary transition-all">
                View Full History
            </button>
        </div>
    );
};

export default RecentActivity;
