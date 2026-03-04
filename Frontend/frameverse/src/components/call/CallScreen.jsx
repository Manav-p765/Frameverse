import React, { useEffect, useRef, useState } from "react";
import { useCallStore } from "../../store/useCallStore";
import { useCallActions } from "./CallProvider";
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";

export default function CallScreen() {
    const { callStatus, callType, remoteUser, callError, localStream, remoteStream, isMuted, isVideoOff } = useCallStore();
    const { toggleAudio, toggleVideo, emitEndCall } = useCallActions();

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    // Attach streams
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Duration Timer
    const [duration, setDuration] = useState(0);
    useEffect(() => {
        let interval;
        if (callStatus === "connected") {
            interval = setInterval(() => setDuration((d) => d + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [callStatus]);

    const formatDuration = (s) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#0c0c0e] flex flex-col items-center justify-center animate-fade-in overflow-hidden">

            {/* --- HEADER --- */}
            <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2a2a30] overflow-hidden flex items-center justify-center shrink-0">
                        {remoteUser?.profilePic ? (
                            <img src={remoteUser.profilePic} alt={remoteUser.username} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-white text-sm font-medium">{remoteUser?.username?.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                    <div>
                        <h2 className="text-white font-semibold text-lg leading-tight">{remoteUser?.username || "Unknown"}</h2>
                        <div className="text-white/60 text-sm flex items-center gap-2">
                            {callStatus === "calling" && <span className="animate-pulse">Calling...</span>}
                            {callStatus === "connecting" && <span className="animate-pulse">Connecting...</span>}
                            {callStatus === "failed" && <span className="text-red-400">{callError}</span>}
                            {callStatus === "connected" && <span>{formatDuration(duration)}</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- VIDEO AREA --- */}
            <div className="relative w-full h-full flex items-center justify-center">

                {/* Remote Video (Full Screen) */}
                {callType === "video" && remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-32 h-32 rounded-full overflow-hidden bg-[#2a2a30] relative">
                            {callStatus !== "failed" && callStatus !== "connected" && (
                                <div className="absolute inset-0 bg-blue-500/20 animate-ping rounded-full" />
                            )}
                            {remoteUser?.profilePic ? (
                                <img src={remoteUser.profilePic} className="w-full h-full object-cover relative z-10" alt="" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl text-white relative z-10">
                                    {remoteUser?.username?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Local Video (Floating PIP Corner) */}
                {callType === "video" && localStream && (
                    <div className="absolute top-24 right-6 w-28 h-40 md:w-48 md:h-64 bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 z-20 transition-all">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted // Always mute local video so you don't hear yourself
                            className="w-full h-full object-cover mirror-x"
                            style={{ transform: "scaleX(-1)" }} // Mirror camera
                        />
                    </div>
                )}
            </div>

            {/* --- CONTROLS BAR --- */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-black/50 backdrop-blur-md px-8 py-4 rounded-full border border-white/10 z-30">

                {/* Microphone Toggle */}
                <button
                    onClick={toggleAudio}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMuted ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                >
                    {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                </button>

                {/* Video Toggle (Only for Video Calls) */}
                {callType === "video" && (
                    <button
                        onClick={toggleVideo}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isVideoOff ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-white/10 text-white hover:bg-white/20"
                            }`}
                    >
                        {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
                    </button>
                )}

                {/* End Call */}
                <button
                    onClick={emitEndCall}
                    className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-transform hover:scale-105"
                >
                    <PhoneOff size={24} />
                </button>
            </div>

        </div>
    );
}
