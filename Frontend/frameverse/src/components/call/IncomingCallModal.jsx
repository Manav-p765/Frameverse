/**
 * IncomingCallModal.jsx
 * Shown when callStatus === "ringing".
 * Auto-dismisses if call:timeout is received (handled in CallProvider).
 */

import React, { useEffect, useState } from "react";
import { useCallStore } from "../../store/useCallStore";
import { useCallActions } from "./CallProvider";
import { Phone, Video, X } from "lucide-react";

const RING_TIMEOUT_S = 30;

export default function IncomingCallModal() {
  const { remoteUser, callType } = useCallStore();
  const { acceptCall, declineCall } = useCallActions();
  const [countdown, setCountdown] = useState(RING_TIMEOUT_S);

  // Countdown timer — purely cosmetic; real timeout is server-driven
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  if (!remoteUser) return null;

  const isVideo = callType === "video";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col items-center gap-5 animate-slide-up">

        {/* Avatar with pulse ring */}
        <div className="relative mt-2">
          <div className="absolute inset-[-8px] rounded-full border-2 border-indigo-400/40 animate-ping" />
          <div className="w-20 h-20 rounded-full bg-zinc-700 overflow-hidden border-4 border-zinc-900 flex items-center justify-center relative z-10">
            {remoteUser.profilePic
              ? <img src={remoteUser.profilePic} alt={remoteUser.username} className="w-full h-full object-cover" />
              : <span className="text-white text-2xl font-semibold">{remoteUser.username?.[0]?.toUpperCase()}</span>}
          </div>
        </div>

        {/* Info */}
        <div className="text-center">
          <h2 className="text-white text-lg font-semibold">{remoteUser.username}</h2>
          <p className="text-zinc-400 text-sm mt-0.5 flex items-center justify-center gap-1.5">
            {isVideo ? <Video size={13} /> : <Phone size={13} />}
            Incoming {callType} call
          </p>
          {/* Countdown ring */}
          <p className="text-zinc-600 text-xs mt-2">{countdown}s</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-10">
          {/* Decline */}
          <ActionBtn
            onClick={declineCall}
            color="red"
            label="Decline"
            icon={<X size={22} strokeWidth={2.5} />}
          />

          {/* Accept */}
          <ActionBtn
            onClick={acceptCall}
            color="green"
            label="Accept"
            icon={isVideo ? <Video size={22} /> : <Phone size={22} />}
          />
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ onClick, color, label, icon }) {
  const colors = {
    red: "bg-red-500 hover:bg-red-600 shadow-red-500/30",
    green: "bg-green-500 hover:bg-green-600 shadow-green-500/30",
  };
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={onClick}
        className={`w-14 h-14 rounded-full ${colors[color]} text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105`}
      >
        {icon}
      </button>
      <span className="text-zinc-400 text-xs">{label}</span>
    </div>
  );
}
