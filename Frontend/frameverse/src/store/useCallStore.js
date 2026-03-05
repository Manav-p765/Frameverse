/**
 * useCallStore.js
 * Authoritative state machine for the calling system.
 *
 * State machine transitions:
 *
 *  idle
 *   ├─ initiateCall()  → calling   (outbound)
 *   └─ receiveCall()   → ringing   (inbound)
 *
 *  calling
 *   ├─ call:accepted   → connecting
 *   ├─ call:rejected   → failed
 *   ├─ call:timeout    → failed
 *   ├─ call:busy       → failed
 *   └─ emitEndCall()   → idle
 *
 *  ringing
 *   ├─ acceptCall()    → connecting
 *   └─ declineCall()   → idle
 *
 *  connecting
 *   ├─ setConnected()  → connected
 *   └─ peer fail       → failed
 *
 *  connected
 *   └─ endCall()       → idle
 *
 *  failed
 *   └─ (auto) endCall after 3 s → idle
 */

import { create } from "zustand";

export const useCallStore = create((set, get) => ({
  // ── Core state ─────────────────────────────────────────────────────────────
  callId: null,
  callStatus: "idle",      // idle | calling | ringing | connecting | connected | failed
  callType: "video",       // "video" | "audio"
  remoteUser: null,        // { _id, username, profilePic }
  incomingOffer: null,     // RTCSessionDescriptionInit — set when callee receives offer
  callError: null,

  // ── Media state ────────────────────────────────────────────────────────────
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isVideoOff: false,
  isScreenSharing: false,

  // ── Stats / quality ────────────────────────────────────────────────────────
  connectionQuality: null,  // "good" | "fair" | "poor" | null

  // ── Actions ────────────────────────────────────────────────────────────────

  initiateCall: (callId, user, type = "video") =>
    set({
      callId,
      callStatus: "calling",
      callType: type,
      remoteUser: user,
      incomingOffer: null,
      callError: null,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
    }),

  receiveCall: (callId, caller, type, offer) =>
    set({
      callId,
      callStatus: "ringing",
      callType: type,
      remoteUser: caller,
      incomingOffer: offer,
      callError: null,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
    }),

  setCallStatus: (status) => set({ callStatus: status }),
  setConnecting: () => set({ callStatus: "connecting" }),
  setConnected: () => set({ callStatus: "connected" }),

  setCallId: (id) => set({ callId: id }),
  setRemoteUser: (user) => set({ remoteUser: user }),
  setCallType: (type) => set({ callType: type }),

  setCallFailed: (errorMsg) =>
    set({ callStatus: "failed", callError: errorMsg }),

  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),
  setIsMuted: (val) => set({ isMuted: val }),
  setIsVideoOff: (val) => set({ isVideoOff: val }),
  setIsScreenSharing: (val) => set({ isScreenSharing: val }),
  setConnectionQuality: (q) => set({ connectionQuality: q }),

  // Called when offer is relayed (callee side, after call:accepted)
  setIncomingOffer: (offer) => set({ incomingOffer: offer }),

  resetCall: () =>
    set({
      callId: null,
      callStatus: "idle",
      callType: "video",
      remoteUser: null,
      incomingOffer: null,
      callError: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
      connectionQuality: null,
    }),
}));
