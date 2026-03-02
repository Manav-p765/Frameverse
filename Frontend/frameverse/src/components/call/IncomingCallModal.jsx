import React from "react";
import { useCallStore } from "../../store/useCallStore";
import { useWebRTC } from "../../hooks/useWebRTC";
import { Phone, Video, X } from "lucide-react";

export default function IncomingCallModal() {
    const { remoteUser, callType } = useCallStore();
    const { acceptCall, declineCall } = useWebRTC();

    if (!remoteUser) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#18181c] border border-[#2a2a30] rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col items-center gap-6 animate-scale-up">

                {/* Pulsing Avatar */}
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                    <div className="w-24 h-24 rounded-full bg-[#2a2a30] overflow-hidden relative z-10 border-4 border-[#18181c] flex items-center justify-center">
                        {remoteUser.profilePic ? (
                            <img src={remoteUser.profilePic} alt={remoteUser.username} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-white text-3xl font-medium">
                                {remoteUser.username?.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                </div>

                {/* Text */}
                <div className="text-center">
                    <h2 className="text-white text-xl font-semibold">{remoteUser.username}</h2>
                    <p className="text-[#9a9aaa] text-sm mt-1 flex items-center justify-center gap-1.5">
                        {callType === "video" ? <Video size={14} /> : <Phone size={14} />}
                        Incoming {callType} call...
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-8 mt-2">
                    {/* Decline */}
                    <button
                        onClick={declineCall}
                        className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-transform hover:scale-105 shadow-lg shadow-red-500/20"
                    >
                        <X size={24} strokeWidth={2.5} />
                    </button>

                    {/* Accept */}
                    <button
                        onClick={acceptCall}
                        className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition-transform hover:scale-105 shadow-lg shadow-green-500/20"
                    >
                        {callType === "video" ? <Video size={24} /> : <Phone size={24} className="animate-pulse" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
