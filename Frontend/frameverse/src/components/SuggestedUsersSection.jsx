import React, { useState, useEffect } from "react";
import api from "../services/post.service";
import SuggestedUser from "./SuggestedUser";

const SuggestedUsersSection = ({ onEmptyChange, className = "mt-6" }) => {
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const res = await api.get("/api/recommend/users");
                const users = res.data.users || [];
                setSuggestedUsers(users);
                if (onEmptyChange) onEmptyChange(users.length === 0);
            } catch (error) {
                console.error("Failed to load suggested users:", error);
                if (onEmptyChange) onEmptyChange(true);
            } finally {
                setLoading(false);
            }
        };
        fetchSuggestions();
    }, [onEmptyChange]);

    const handleFollowComplete = (userId) => {
        setSuggestedUsers(prev => {
            const updated = prev.filter(u => u.userId !== userId);
            if (updated.length === 0 && onEmptyChange) onEmptyChange(true);
            return updated;
        });
    };

    if (loading) {
        return (
            <div className={`w-full ${className}`}>
                <h3 className="text-sm font-semibold text-[#7a7a8a] uppercase tracking-wider mb-3 px-2">
                    People You May Know
                </h3>
                <div className="space-y-3 px-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="w-10 h-10 rounded-full bg-bg-secondary shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3.5 bg-bg-secondary rounded w-1/2" />
                                <div className="h-2.5 bg-bg-secondary rounded w-1/3" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (suggestedUsers.length === 0) {
        return (
            <div className={`w-full ${className}`}>
                <h3 className="text-sm font-semibold text-[#7a7a8a] uppercase tracking-wider mb-2 px-2">
                    People You May Know
                </h3>
                <div className="flex flex-col items-center justify-center py-6 text-center px-4">
                    <p className="text-[#5a5a6a] text-sm">No suggestions right now</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full ${className}`}>
            <h3 className="text-sm font-semibold text-[#7a7a8a] uppercase tracking-wider mb-2 px-2">
                People You May Know
            </h3>
            <div className="space-y-1">
                {suggestedUsers.map(user => (
                    <SuggestedUser key={user.userId} user={user} onFollowComplete={handleFollowComplete} />
                ))}
            </div>
        </div>
    );
};

export default SuggestedUsersSection;
