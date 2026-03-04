import { create } from "zustand";

// State Machine Types: 
// 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'failed'

export const useCallStore = create((set) => ({
    callStatus: "idle",
    callType: "video", // "video" | "audio"
    remoteUser: null, // { _id, username, profilePic }
    incomingOffer: null, // RTCSessionDescriptionInit
    callError: null, // string for UI feedback

    // Media state (shared across all components)
    localStream: null,
    remoteStream: null,
    isMuted: false,
    isVideoOff: false,

    // Actions
    setCallStatus: (status) => set({ callStatus: status }),
    setLocalStream: (stream) => set({ localStream: stream }),
    setRemoteStream: (stream) => set({ remoteStream: stream }),
    setIsMuted: (val) => set({ isMuted: val }),
    setIsVideoOff: (val) => set({ isVideoOff: val }),

    // Caller starts a call
    initiateCall: (user, type = "video") =>
        set({
            callStatus: "calling",
            callType: type,
            remoteUser: user,
            incomingOffer: null,
            callError: null,
        }),

    // Receiver gets a call
    receiveCall: (caller, type, offer) =>
        set({
            callStatus: "ringing",
            callType: type,
            remoteUser: caller,
            incomingOffer: offer,
            callError: null,
        }),

    // Transition to connecting after offering/answering
    setConnecting: () => set({ callStatus: "connecting" }),

    // Peer connection established
    setConnected: () => set({ callStatus: "connected" }),

    // End or reset the call explicitly
    resetCall: () =>
        set({
            callStatus: "idle",
            callType: "video",
            remoteUser: null,
            incomingOffer: null,
            callError: null,
            localStream: null,
            remoteStream: null,
            isMuted: false,
            isVideoOff: false,
        }),

    // Fail explicitly
    setCallFailed: (errorMsg) =>
        set({
            callStatus: "failed",
            callError: errorMsg,
        }),
}));
