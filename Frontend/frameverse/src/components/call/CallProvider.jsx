import React, { createContext, useContext, useEffect, useRef } from "react";
import { useSocketEvent, getSocket } from "../../hooks/useSocket";
import { useCallStore } from "../../store/useCallStore";
import { useWebRTC } from "../../hooks/useWebRTC";
import CallScreen from "./CallScreen";
import IncomingCallModal from "./IncomingCallModal";

const CallActionsContext = createContext(null);
export const useCallActions = () => useContext(CallActionsContext);

export default function CallProvider({ children }) {
  const { callStatus, receiveCall, setCallFailed, initiateCall } = useCallStore();
  const webrtc = useWebRTC();
  const {
    startCall,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    handleReconnectOffer,
    handleReconnectAnswer,
    endCall,
  } = webrtc;

  // Ringtone ref
  const ringtoneRef = useRef(null);

  // ── Ringtone helpers ────────────────────────────────────────────────────────
  const playRingtone = () => {
    try {
      // Replace with your actual ringtone asset path
      ringtoneRef.current = new Audio("/sounds/ringtone.mp3");
      ringtoneRef.current.loop = true;
      ringtoneRef.current.play().catch(() => { });
    } catch { }
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current = null;
    }
  };

  // ── Socket event listeners ──────────────────────────────────────────────────

  // 1. call:incoming — store remoteUser, callId, callType immediately
  useSocketEvent("call:incoming", ({ callId, from, callType }) => {
    console.log("[CallProvider] call:incoming — callId:", callId, "from:", from?._id || from, "callType:", callType);
    const status = useCallStore.getState().callStatus;
    if (status !== "idle") {
      console.warn("[CallProvider] Already in call (status:", status, ") — auto-rejecting.");
      getSocket()?.emit("call:reject", { callId });
      return;
    }
    receiveCall(callId, from, callType, null);
    playRingtone();
  });

  // 1b. call:error — server rejected the call request (offline, busy, invalid state)
  useSocketEvent("call:error", ({ code, message }) => {
    console.error("[CallProvider] call:error —", code, message);
    const { callStatus: status } = useCallStore.getState();
    if (status === "calling" || status === "connecting") {
      setCallFailed(message || "Call failed");
      setTimeout(endCall, 3000);
    }
  });

  // 2. call:offer — REMOVE the status guard, just store the offer
  useSocketEvent("call:offer", async ({ callId, offer }) => {
    const { callId: currentCallId, callStatus } = useCallStore.getState();
    console.log("[CallProvider] call:offer received — callId:", callId, "currentCallId:", currentCallId, "callStatus:", callStatus);

    // Only check callId match
    if (callId !== currentCallId) {
      console.warn("[CallProvider] call:offer callId mismatch — dropping.");
      return;
    }

    await handleOffer({ offer });
  });

  // 3. call:ringing — confirms to caller that receiver was notified
  useSocketEvent("call:ringing", ({ callId }) => {
    // Sync server's authoritative callId into the store
    useCallStore.getState().setCallId(callId);
    console.log("[CallProvider] call:ringing — synced callId:", callId, "— sending offer now.");
    // Now that server confirmed receiver is online, send the offer
    startCall();
  });

  // 4. call:accepted — callee accepted, caller gets this before the answer
  useSocketEvent("call:accepted", ({ callId }) => {
    const { callStatus: status } = useCallStore.getState();
    if (status !== "calling") return;
    useCallStore.getState().setConnecting();
  });

  // 5. SDP answer (caller receives this)
  useSocketEvent("call:answer", async ({ callId, answer }) => {
    const { callId: currentCallId } = useCallStore.getState();
    if (callId !== currentCallId) return;
    await handleAnswer({ answer });
  });

  // 6. ICE candidates
  useSocketEvent("call:ice-candidate", ({ callId, candidate }) => {
    const { callId: currentCallId } = useCallStore.getState();
    if (callId !== currentCallId) return;
    handleIceCandidate({ candidate });
  });

  // 7. Rejected
  useSocketEvent("call:rejected", ({ callId }) => {
    stopRingtone();
    if (useCallStore.getState().callStatus === "calling") {
      setCallFailed("Call declined");
      setTimeout(endCall, 3000);
    }
  });

  // 8. Busy
  useSocketEvent("call:busy", () => {
    stopRingtone();
    if (useCallStore.getState().callStatus === "calling") {
      setCallFailed("User is busy");
      setTimeout(endCall, 3000);
    }
  });

  // 9. Timeout
  useSocketEvent("call:timeout", ({ callId }) => {
    stopRingtone();
    const { callId: currentCallId, callStatus: status } = useCallStore.getState();
    if (callId !== currentCallId) return;
    if (status === "calling") setCallFailed("No answer");
    if (status === "ringing") setCallFailed("Missed call");
    setTimeout(endCall, 3000);
  });

  // 10. Remote ended the call
  useSocketEvent("call:ended", ({ callId }) => {
    stopRingtone();
    const { callId: currentCallId } = useCallStore.getState();
    if (callId !== currentCallId) return;
    endCall();
  });

  // 11. Caller cancelled while ringing
  useSocketEvent("call:cancelled", ({ callId }) => {
    stopRingtone();
    const { callId: currentCallId } = useCallStore.getState();
    if (callId !== currentCallId) return;
    endCall();
  });

  // 12. ICE restart (reconnection)
  useSocketEvent("call:reconnect-offer", ({ callId, offer }) => {
    handleReconnectOffer({ offer });
  });

  useSocketEvent("call:reconnect-answer", ({ callId, answer }) => {
    handleReconnectAnswer({ answer });
  });

  // Stop ringtone whenever we leave ringing state
  useEffect(() => {
    if (callStatus !== "ringing") stopRingtone();
  }, [callStatus]);

  // ── Expose all webrtc actions to consumers ──────────────────────────────────
  return (
    <CallActionsContext.Provider value={webrtc}>
      {children}

      {/* Incoming call modal — only when ringing */}
      {callStatus === "ringing" && <IncomingCallModal />}

      {/* Active call screen */}
      {(callStatus === "calling" ||
        callStatus === "connecting" ||
        callStatus === "connected" ||
        callStatus === "failed") && <CallScreen />}
    </CallActionsContext.Provider>
  );
}

/**
 * Hook for initiating a call from anywhere in the app (e.g. chat header).
 *
 * Usage:
 *   const { call } = useInitiateCall();
 *   <button onClick={() => call(otherUser, "video")}>Video Call</button>
 */
export function useInitiateCall() {
  const { initiateCall } = useCallStore();

  const call = (user, callType = "video", callerInfo = {}) => {
    const status = useCallStore.getState().callStatus;
    if (status !== "idle") return; // Guard: already in a call

    // Generate client-side callId candidate; server will confirm
    const callId = `${user._id}_${Date.now()}`;
    initiateCall(callId, user, callType);

    // Emit call:request — server assigns authoritative callId via call:ringing
    getSocket()?.emit("call:request", {
      to: user._id,
      callType,
      callerInfo,
    });
  };

  return { call };
}
