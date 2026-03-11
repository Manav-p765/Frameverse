/**
 * useWebRTC.js
 * Single source of truth for all peer connection logic.
 * Used ONLY inside CallProvider — never imported directly by UI components.
 */

import { useRef, useCallback, useEffect } from "react";
import { getSocket } from "../hooks/useSocket";
import { useCallStore } from "../store/useCallStore";

// ─── ICE config ──────────────────────────────────────────────────────────────
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },

    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject"
    },

    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject"
    }
  ],
  iceCandidatePoolSize: 10,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useWebRTC = () => {
  const store = useCallStore;
  const {
    setCallStatus,
    setConnecting,
    setConnected,
    resetCall,
    setCallFailed,
    setLocalStream,
    setRemoteStream,
    setIsMuted,
    setIsVideoOff,
    setIsScreenSharing,
    setConnectionQuality,
    setIncomingOffer,
  } = useCallStore();

  const pcRef = useRef(null);             // RTCPeerConnection
  const ringTimeoutRef = useRef(null);    // caller-side ring guard (UI only)
  const qualityIntervalRef = useRef(null);
  const screenTrackRef = useRef(null);   // for screen share swap-back
  const pendingIceCandidates = useRef([]); // 🆕 Queue for candidates arriving before remote SDP


  // ─── Cleanup helpers ───────────────────────────────────────────────────────

  const stopTracks = useCallback((stream) => {
    stream?.getTracks().forEach((t) => { t.stop(); stream.removeTrack(t); });
  }, []);

  const closePeerConnection = useCallback(() => {
    if (!pcRef.current) return;
    pcRef.current.onicecandidate = null;
    pcRef.current.ontrack = null;
    pcRef.current.onconnectionstatechange = null;
    pcRef.current.oniceconnectionstatechange = null;
    pcRef.current.close();
    pcRef.current = null;
    console.log("[WebRTC] PeerConnection closed.");
  }, []);

  const stopQualityMonitor = useCallback(() => {
    if (qualityIntervalRef.current) {
      clearInterval(qualityIntervalRef.current);
      qualityIntervalRef.current = null;
    }
  }, []);

  // Full teardown — call this from both local and remote end events
  const endCall = useCallback(() => {
    const { localStream, remoteStream } = store.getState();
    stopTracks(localStream);
    stopTracks(remoteStream);
    setLocalStream(null);
    setRemoteStream(null);

    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    closePeerConnection();
    stopQualityMonitor();

    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }

    pendingIceCandidates.current = []; // 🆕 Reset queue
    resetCall();
    console.log("[WebRTC] Call fully cleaned up.");
  }, [store, stopTracks, closePeerConnection, stopQualityMonitor, resetCall, setLocalStream, setRemoteStream]);


  // ─── Quality monitoring ────────────────────────────────────────────────────

  const startQualityMonitor = useCallback(() => {
    if (!pcRef.current) return;
    qualityIntervalRef.current = setInterval(async () => {
      if (!pcRef.current) return;
      try {
        const stats = await pcRef.current.getStats();
        stats.forEach((report) => {
          if (report.type === "candidate-pair" && report.state === "succeeded") {
            const rtt = report.currentRoundTripTime;
            if (rtt === undefined) return;
            const quality = rtt < 0.1 ? "good" : rtt < 0.3 ? "fair" : "poor";
            setConnectionQuality(quality);
          }
        });
      } catch {
        // Stats not available yet
      }
    }, 4000);
  }, [setConnectionQuality]);

  // ─── Create RTCPeerConnection ──────────────────────────────────────────────

  const createPeerConnection = useCallback(() => {
    if (pcRef.current) {
      console.warn("[WebRTC] PeerConnection already exists — closing old one.");
      closePeerConnection();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = ({ candidate }) => {
      if (!candidate) return;
      const { remoteUser, callId } = store.getState();
      if (!remoteUser) return;
      getSocket()?.emit("call:ice-candidate", {
        callId,
        to: remoteUser._id,
        candidate,
      });
    };

    pc.ontrack = ({ streams }) => {
      console.log("[WebRTC] Remote track received.");
      setRemoteStream(streams[0]);
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log(`[WebRTC] Connection state: ${state}`);

      if (state === "connected") {
        setConnected();
        startQualityMonitor();
      } else if (state === "disconnected") {
        // Give ICE 5 s to self-heal before declaring failure
        setTimeout(() => {
          if (pcRef.current?.connectionState === "disconnected") {
            console.warn("[WebRTC] Connection still disconnected — attempting ICE restart.");
            initiateIceRestart();
          }
        }, 5000);
      } else if (state === "failed") {
        console.error("[WebRTC] Connection failed.");
        setCallFailed("Connection lost");
        setTimeout(endCall, 3000);
      } else if (state === "closed") {
        stopQualityMonitor();
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE state: ${pc.iceConnectionState}`);
    };

    pcRef.current = pc;
    return pc;
  }, [store, closePeerConnection, setRemoteStream, setConnected, setCallFailed, endCall, startQualityMonitor, stopQualityMonitor]);

  // ─── Media capture ────────────────────────────────────────────────────────

  const getMediaStream = useCallback(async (callType) => {
    try {
      const constraints = {
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 48000 },
        video: callType === "video" ? { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error("[WebRTC] getUserMedia error:", err.name, err.message);
      const messages = {
        NotAllowedError: "Camera/microphone permission denied.",
        NotFoundError: "No camera or microphone found.",
        NotReadableError: "Camera/microphone is already in use.",
        OverconstrainedError: "Camera does not support requested resolution.",
      };
      setCallFailed(messages[err.name] || "Could not access media devices.");
      return null;
    }
  }, [setLocalStream, setCallFailed]);

  // ─── CALLER: initiate ─────────────────────────────────────────────────────

  const startCall = useCallback(async () => {
    const { remoteUser, callType, callId } = store.getState();
    if (!remoteUser) return console.warn("[WebRTC] startCall: no remoteUser");

    const stream = await getMediaStream(callType);
    if (!stream) return;

    const pc = createPeerConnection();
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    getSocket()?.emit("call:offer", { callId, to: remoteUser._id, offer });
    console.log("[WebRTC] Offer sent to", remoteUser._id);
  }, [store, getMediaStream, createPeerConnection]);

  // ─── CALLEE: accept ──────────────────────────────────────────────────────

  const processOfferAndAnswer = useCallback(async (offer, stream) => {
    const { remoteUser, callId } = store.getState();
    if (!remoteUser) return;

    const pc = createPeerConnection();
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    // 🆕 Process any candidates that arrived while we were setting up
    console.log("[WebRTC] Remote description set. Processing ICE queue...");
    while (pendingIceCandidates.current.length > 0) {
      const candidate = pendingIceCandidates.current.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("[WebRTC] Error adding pending ICE candidate:", err);
      }
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    getSocket()?.emit("call:answer", { callId, to: remoteUser._id, answer });
    console.log("[WebRTC] Answer sent to", remoteUser._id);
  }, [store, createPeerConnection]);

  const acceptCall = useCallback(async () => {
    const { remoteUser, callType, callId } = store.getState();
    if (!remoteUser) {
      return console.warn("[WebRTC] acceptCall: missing remoteUser");
    }

    setConnecting();
    // Signal server: "I accepted"
    getSocket()?.emit("call:accept", { callId });

    const stream = await getMediaStream(callType);
    if (!stream) {
      getSocket()?.emit("call:reject", { callId });
      return;
    }

    const currentOffer = store.getState().incomingOffer;
    if (currentOffer) {
      await processOfferAndAnswer(currentOffer, stream);
    } else {
      console.log("[WebRTC] Accepted call, but waiting for incomingOffer...");
    }
  }, [store, setConnecting, getMediaStream, processOfferAndAnswer]);


  // ─── Decline ─────────────────────────────────────────────────────────────

  const declineCall = useCallback(() => {
    const { remoteUser, callId } = store.getState();
    if (remoteUser) getSocket()?.emit("call:reject", { callId });
    resetCall();
  }, [store, resetCall]);

  // ─── End (local trigger) ─────────────────────────────────────────────────

  const emitEndCall = useCallback(() => {
    const { remoteUser, callId } = store.getState();
    if (remoteUser) getSocket()?.emit("call:end", { callId });
    endCall();
  }, [store, endCall]);

  // ─── Cancel outbound ring ─────────────────────────────────────────────────

  const cancelCall = useCallback(() => {
    const { remoteUser, callId } = store.getState();
    if (remoteUser) getSocket()?.emit("call:cancel", { callId });
    endCall();
  }, [store, endCall]);

  // ─── ICE candidate (inbound from server) ─────────────────────────────────

  const handleIceCandidate = useCallback(async ({ candidate }) => {
    if (!pcRef.current) return;

    // 🆕 Buffer candidates if remote description isn't set yet (w6 requirement)
    if (!pcRef.current.remoteDescription) {
      pendingIceCandidates.current.push(candidate);
      return;
    }

    try {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error("[WebRTC] addIceCandidate error:", err);
    }
  }, []);


  // ─── SDP answer (inbound, caller side) ───────────────────────────────────

  const handleAnswer = useCallback(async ({ answer }) => {
    if (!pcRef.current) return console.warn("[WebRTC] Answer received but no PC.");
    await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));

    // 🆕 Process any candidates that arrived while we were waiting for the answer
    console.log("[WebRTC] Remote description (answer) set. Processing ICE queue...");
    while (pendingIceCandidates.current.length > 0) {
      const candidate = pendingIceCandidates.current.shift();
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("[WebRTC] Error adding pending ICE candidate:", err);
      }
    }
  }, []);


  // ─── SDP offer (inbound, callee side — sent after call:accepted) ─────────

  const handleOffer = useCallback(({ offer }) => {
    // remoteUser was already set by receiveCall() in call:incoming
    const { remoteUser, callStatus, localStream } = store.getState();
    console.log("[WebRTC] handleOffer — remoteUser:", remoteUser?._id, "offer:", !!offer);
    setIncomingOffer(offer);

    // If caller's offer arrives late, but user has ALREADY accepted and has media ready
    if (callStatus === "connecting" && localStream) {
      console.log("[WebRTC] Offer arrived late. User already accepted. Processing now...");
      processOfferAndAnswer(offer, localStream);
    }
  }, [store, setIncomingOffer, processOfferAndAnswer]);

  // ─── ICE restart ─────────────────────────────────────────────────────────

  const initiateIceRestart = useCallback(async () => {
    if (!pcRef.current) return;
    const { remoteUser, callId } = store.getState();
    if (!remoteUser) return;

    console.log("[WebRTC] Initiating ICE restart...");
    try {
      const offer = await pcRef.current.createOffer({ iceRestart: true });
      await pcRef.current.setLocalDescription(offer);
      getSocket()?.emit("call:reconnect-offer", { callId, to: remoteUser._id, offer });
    } catch (err) {
      console.error("[WebRTC] ICE restart failed:", err);
    }
  }, [store]);

  const handleReconnectOffer = useCallback(async ({ offer }) => {
    if (!pcRef.current) return;
    const { remoteUser, callId } = store.getState();
    await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pcRef.current.createAnswer();
    await pcRef.current.setLocalDescription(answer);
    getSocket()?.emit("call:reconnect-answer", { callId, to: remoteUser._id, answer });
  }, [store]);

  const handleReconnectAnswer = useCallback(async ({ answer }) => {
    if (!pcRef.current) return;
    await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    console.log("[WebRTC] ICE restart answer applied.");
  }, []);

  // ─── Toggle audio ─────────────────────────────────────────────────────────

  const toggleAudio = useCallback(() => {
    const { localStream, isMuted } = store.getState();
    const track = localStream?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
  }, [store, setIsMuted]);

  // ─── Toggle video ─────────────────────────────────────────────────────────

  const toggleVideo = useCallback(() => {
    const { localStream, isVideoOff } = store.getState();
    const track = localStream?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsVideoOff(!track.enabled);
  }, [store, setIsVideoOff]);

  // ─── Screen share ─────────────────────────────────────────────────────────

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;

      // Replace video sender track in peer connection
      const sender = pcRef.current
        ?.getSenders()
        .find((s) => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(screenTrack);

      // Also replace in local stream for preview
      const { localStream } = store.getState();
      const oldVideo = localStream?.getVideoTracks()[0];
      if (oldVideo && localStream) {
        localStream.removeTrack(oldVideo);
        localStream.addTrack(screenTrack);
        oldVideo.stop();
      }

      setIsScreenSharing(true);

      // Auto-stop when user clicks browser's "Stop sharing"
      screenTrack.onended = () => stopScreenShare();
    } catch (err) {
      console.error("[WebRTC] Screen share error:", err);
    }
  }, [store, setIsScreenSharing]);

  const stopScreenShare = useCallback(async () => {
    const { callType } = store.getState();
    if (callType !== "video") return;

    // Re-capture camera
    const camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    const camTrack = camStream.getVideoTracks()[0];

    const sender = pcRef.current
      ?.getSenders()
      .find((s) => s.track?.kind === "video");
    if (sender) await sender.replaceTrack(camTrack);

    const { localStream } = store.getState();
    const oldTrack = localStream?.getVideoTracks()[0];
    if (oldTrack && localStream) {
      localStream.removeTrack(oldTrack);
      localStream.addTrack(camTrack);
      oldTrack.stop();
    }

    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    setIsScreenSharing(false);
  }, [store, setIsScreenSharing]);

  // ─── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopQualityMonitor();
    };
  }, [stopQualityMonitor]);

  return {
    // Call lifecycle
    startCall,
    acceptCall,
    declineCall,
    cancelCall,
    emitEndCall,
    endCall,
    // Socket event handlers (used by CallProvider)
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    handleReconnectOffer,
    handleReconnectAnswer,
    // Controls
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    // Refs (for debugging)
    pcRef,
  };
};
