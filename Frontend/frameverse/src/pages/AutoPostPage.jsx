import React from "react";
import AutoPostSettings from "../components/profile/AutoPostSettings";
import AutoPostWidget from "../components/profile/AutoPostWidget";

export default function AutoPostPage() {
    return (
        <div className="min-h-screen bg-[#18181c] pt-5 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Left: Progress & Preview Summary */}
                    <div className="w-full lg:w-[40%] shrink-0">
                        <AutoPostWidget hideSettingsLink />
                    </div>

                    {/* Right: Settings Panel */}
                    <div className="flex-1 w-full min-w-0">
                        <AutoPostSettings />
                    </div>
                </div>
            </div>
        </div>
    );
}
