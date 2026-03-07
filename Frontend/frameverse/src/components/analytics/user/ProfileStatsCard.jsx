import React from "react";

const ProfileStatsCard = ({ title, value, icon: Icon, colorClass }) => {
    return (
        <div className="bg-bg-secondary p-5 rounded-2xl shadow-sm border border-border-color hover:shadow-md transition-shadow duration-300">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-text-secondary text-sm font-medium mb-1">{title}</p>
                    <h3 className="text-text-primary text-3xl font-bold">{value}</h3>
                </div>
                <div className={`p-3 bg-bg-primary/50 dark:bg-bg-primary rounded-xl ${colorClass}`}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );
};

export default ProfileStatsCard;
