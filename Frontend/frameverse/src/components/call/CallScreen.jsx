/**
 * CallScreen.jsx
 * Active call UI — handles calling, connecting, connected, and failed states.
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useCallStore } from "../../store/useCallStore";
import { useCallActions } from "./CallProvider";
import {
  PhoneOff, Mic, MicOff, Video, VideoOff,
  Monitor, MonitorOff, Signal, SignalHigh, SignalLow,
} from "lucide-react";

const STATUS_LABELS = {
  calling: "Calling...",
  connecting: "Connecting...",
  connected: null,   // show timer
  failed: null,      // show error
};

export default function CallScreen() {
  const {
    callStatus, callType, remoteUser, callError,
    localStream, remoteStream,
    isMuted, isVideoOff, isScreenSharing, connectionQuality,
  } = useCallStore();

  const { toggleAudio, toggleVideo, emitEndCall, cancelCall, startScreenShare, stopScreenShare } =
    useCallActions();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimer = useRef(null);

  // ── Stream attachment ───────────────────────────────────────────────────────
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

  // ── Timer ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (callStatus !== "connected") { setDuration(0); return; }
    const id = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(id);
  }, [callStatus]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Auto-hide controls ──────────────────────────────────────────────────────
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideControlsTimer.current);
    if (callStatus === "connected" && callType === "video") {
      hideControlsTimer.current = setTimeout(() => setShowControls(false), 4000);
    }
  }, [callStatus, callType]);

  useEffect(() => { resetHideTimer(); return () => clearTimeout(hideControlsTimer.current); }, [resetHideTimer]);

  // ── Screen share toggle ─────────────────────────────────────────────────────
  const handleScreenShare = () => isScreenSharing ? stopScreenShare() : startScreenShare();

  // ── Subtitle ────────────────────────────────────────────────────────────────
  const subtitle = callStatus === "failed"
    ? <span className="text-red-400">{callError}</span>
    : callStatus === "connected"
      ? <span>{fmt(duration)}</span>
      : <span className="animate-pulse">{STATUS_LABELS[callStatus]}</span>;

  // ── Quality icon ────────────────────────────────────────────────────────────
  const QualityIcon = () => {
    if (!connectionQuality || callStatus !== "connected") return null;
    const map = { good: <SignalHigh size={14} className="text-green-400" />, fair: <Signal size={14} className="text-yellow-400" />, poor: <SignalLow size={14} className="text-red-400" /> };
    return map[connectionQuality] || null;
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center overflow-hidden"
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      {/* ── Header ── */}
      <div
        className={`absolute top-0 left-0 right-0 p-5 flex items-center gap-3 bg-gradient-to-b from-black/80 to-transparent z-20 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}
      >
        <Avatar user={remoteUser} size="sm" />
        <div>
          <p className="text-white font-semibold text-base leading-tight">
            {remoteUser?.username ?? "Unknown"}
          </p>
          <div className="flex items-center gap-1.5 text-white/60 text-xs">
            <QualityIcon />
            {subtitle}
          </div>
        </div>
      </div>

      {/* ── Video area ── */}
      <div className="relative w-full h-full flex items-center justify-center bg-zinc-900">

        {/* Remote video (full screen) */}
        {callType === "video" && remoteStream ? (
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        ) : (
          <CenteredAvatar user={remoteUser} pulsing={callStatus !== "failed" && callStatus !== "connected"} />
        )}

        {/* Local video (PiP) */}
        {callType === "video" && localStream && (
          <div className="absolute top-20 right-4 w-28 h-40 md:w-44 md:h-60 rounded-xl overflow-hidden shadow-2xl border border-white/10 z-20">
            <video
              ref={localVideoRef}
              autoPlay playsInline muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            {isVideoOff && (
              <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
                <VideoOff size={20} className="text-white/40" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-30 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <ControlBtn
          active={isMuted}
          icon={isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          onClick={toggleAudio}
          label={isMuted ? "Unmute" : "Mute"}
        />

        {callType === "video" && (
          <>
            <ControlBtn
              active={isVideoOff}
              icon={isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
              onClick={toggleVideo}
              label={isVideoOff ? "Camera On" : "Camera Off"}
            />
            <ControlBtn
              active={isScreenSharing}
              icon={isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
              onClick={handleScreenShare}
              label={isScreenSharing ? "Stop Share" : "Share Screen"}
            />
          </>
        )}

        {/* End / Cancel call */}
        <button
          onClick={callStatus === "calling" ? cancelCall : emitEndCall}
          title="End call"
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
        >
          <PhoneOff size={22} />
        </button>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Avatar({ user, size = "sm" }) {
  const dim = size === "sm" ? "w-9 h-9 text-sm" : "w-24 h-24 text-3xl";
  return (
    <div className={`${dim} rounded-full bg-zinc-700 overflow-hidden flex items-center justify-center shrink-0`}>
      {user?.profilePic
        ? <img src={user.profilePic} alt={user.username} className="w-full h-full object-cover" />
        : <span className="text-white font-medium">{user?.username?.[0]?.toUpperCase()}</span>}
    </div>
  );
}

function CenteredAvatar({ user, pulsing }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {pulsing && <div className="absolute inset-0 bg-indigo-500/20 animate-ping rounded-full" />}
        <Avatar user={user} size="lg" />
      </div>
      <p className="text-white/70 text-sm">{user?.username}</p>
    </div>
  );
}

function ControlBtn({ active, icon, onClick, label }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105
        ${active
          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
          : "bg-white/10 text-white hover:bg-white/20"}`}
    >
      {icon}
    </button>
  );
}
