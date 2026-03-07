import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';

dayjs.extend(relativeTime);

const RecentActivity = ({ data }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-bg-secondary p-5 rounded-2xl shadow-sm border border-border-color h-full flex flex-col">
            <h3 className="text-text-primary font-bold mb-4">Recent Conversations</h3>

            <div className="flex-1 flex flex-col gap-4">
                {(!data || data.length === 0) ? (
                    <div className="text-center text-text-secondary text-sm py-4">
                        No recent activity found.
                    </div>
                ) : (
                    data.map((chat) => (
                        <div
                            key={chat._id}
                            onClick={() => navigate(`/chats/${chat._id}`)}
                            className="flex items-center gap-4 p-3 rounded-xl hover:bg-bg-primary/50 cursor-pointer transition-colors border border-transparent hover:border-border-color/50"
                        >
                            <div className="relative">
                                {chat.avatar ? (
                                    <img
                                        src={chat.avatar}
                                        alt={chat.title}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-brand-purple/20 flex items-center justify-center text-brand-purple">
                                        <Users size={20} />
                                    </div>
                                )}
                                {chat.isGroup && (
                                    <div className="absolute -bottom-1 -right-1 bg-brand-pink text-white text-[10px] px-1 rounded-sm font-bold">
                                        GRP
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h4 className="text-text-primary font-semibold text-sm truncate pr-2">
                                        {chat.title}
                                    </h4>
                                    <span className="text-text-secondary text-xs shrink-0">
                                        {dayjs(chat.updatedAt).fromNow()}
                                    </span>
                                </div>
                                <p className="text-text-secondary text-xs truncate">
                                    {chat.lastMessage}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RecentActivity;
