import { useRef, useCallback } from "react";
import { getSocket } from "./useSocket";
import { useCallStore } from "../store/useCallStore";

export const iceServersConfig = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        // TURN Placeholder (Required for strict symmetric NATs in production)
        // {
        //   urls: "turn:YOUR_TURN_SERVER_URL",
        //   username: "USERNAME",
        //   credential: "PASSWORD"
        // }
    ],
};

export const useWebRTC = () => {
    const {
        setCallStatus,
        resetCall,
        setCallFailed,
        setLocalStream,
        setRemoteStream,
        setIsMuted,
        setIsVideoOff,
    } = useCallStore();

    const peerConnectionRef = useRef(null);
    const callingTimeoutRef = useRef(null);

    // -------- AGGRESSIVE CLEANUP --------
    const cleanupMediaTracks = useCallback((stream) => {
        if (stream) {
            stream.getTracks().forEach((track) => {
                track.stop();
                stream.removeTrack(track); // Extra safety
            });
        }
    }, []);

    const endCall = useCallback(() => {
        // Stop all local and remote tracks immediately (fixes camera light bug)
        const currentLocal = useCallStore.getState().localStream;
        const currentRemote = useCallStore.getState().remoteStream;

        if (currentLocal) cleanupMediaTracks(currentLocal);
        if (currentRemote) cleanupMediaTracks(currentRemote);

        setLocalStream(null);
        setRemoteStream(null);

        // Close peer connection
        if (peerConnectionRef.current) {
            peerConnectionRef.current.onicecandidate = null;
            peerConnectionRef.current.ontrack = null;
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        if (callingTimeoutRef.current) {
            clearTimeout(callingTimeoutRef.current);
        }

        resetCall();
    }, [cleanupMediaTracks, resetCall, setLocalStream, setRemoteStream]);

    // -------- MEDIA CAPTURE --------
    const getMediaStream = useCallback(async (type) => {
        try {
            console.log(`🎥 Attempting to capture ${type} stream...`);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: type === "video" ? { facingMode: "user" } : false,
                audio: true,
            });
            console.log("✅ Stream captured successfully", stream.getTracks());
            setLocalStream(stream);
            return stream;
        } catch (err) {
            console.error("❌ Camera/Mic Permission Error:", err);
            if (err.name === "NotAllowedError") {
                setCallFailed("Camera/Mic permission denied");
            } else if (err.name === "NotFoundError") {
                setCallFailed("No camera/mic found");
            } else {
                setCallFailed("Could not access camera/mic");
            }
            return null;
        }
    }, [setCallFailed, setLocalStream]);

    // -------- PEER CONNECTION INIT --------
    const createPeerConnection = useCallback(() => {
        console.log("🛠️ Initializing RTCPeerConnection");
        const pc = new RTCPeerConnection(iceServersConfig);

        pc.onicecandidate = (event) => {
            const currentRemoteUser = useCallStore.getState().remoteUser;
            if (event.candidate && currentRemoteUser) {
                console.log(`❄️ Sending ICE candidate to ${currentRemoteUser._id}`);
                getSocket()?.emit("ice-candidate", {
                    to: currentRemoteUser._id,
                    candidate: event.candidate,
                });
            } else if (event.candidate && !currentRemoteUser) {
                console.warn("⚠️ ICE candidate generated, but remoteUser is null in store!");
            }
        };

        pc.ontrack = (event) => {
            console.log("📺 Received remote track!", event.streams[0].getTracks());
            setRemoteStream(event.streams[0]);
        };

        pc.onconnectionstatechange = () => {
            console.log(`🔄 Peer connection state changed: ${pc.connectionState}`);
            if (
                pc.connectionState === "disconnected" ||
                pc.connectionState === "failed" ||
                pc.connectionState === "closed"
            ) {
                console.warn("⚠️ Peer connection failed or closed. Ending call natively.");
                endCall();
            }
        };

        peerConnectionRef.current = pc;
        return pc;
    }, [endCall, setRemoteStream]);

    // -------- CALL ACTIONS --------

    // Starting a call (Caller)
    const startCall = useCallback(async () => {
        // Fetch fresh state directly to avoid React closure race condition
        const currentRemoteUser = useCallStore.getState().remoteUser;
        const currentCallType = useCallStore.getState().callType;

        console.log(`🚀 startCall invoked for user ${currentRemoteUser?._id}`);
        if (!currentRemoteUser) {
            console.warn("⚠️ startCall aborted: remoteUser is null or undefined in store.");
            return;
        }

        // 30s caller timeout guard
        callingTimeoutRef.current = setTimeout(() => {
            if (useCallStore.getState().callStatus === "calling") {
                getSocket()?.emit("end-call", { to: currentRemoteUser._id });
                setCallFailed("No answer. Call timed out.");
                setTimeout(endCall, 3000); // Wait briefly to show fail state, then cleanup
            }
        }, 30000);

        const stream = await getMediaStream(currentCallType);
        if (!stream) {
            console.warn("⚠️ startCall aborted: Could not get media stream.");
            return; // Errors handled in getMediaStream
        }

        console.log("🛠️ Creating peer connection...");
        const pc = createPeerConnection();
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        console.log(`📡 Emitting 'call-user' to socket for ${currentRemoteUser._id}`);

        const authStore = JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state || {};
        const currentUser = authStore.user || { _id: getSocket()?.userId, username: "Someone" };

        getSocket()?.emit("call-user", {
            userToCall: currentRemoteUser._id,
            from: currentUser,
            offer,
            callType: currentCallType,
        });
    }, [getMediaStream, createPeerConnection, setCallFailed, endCall]);

    // Accepting a call (Receiver)
    const acceptCall = useCallback(async () => {
        const currentRemoteUser = useCallStore.getState().remoteUser;
        const currentIncomingOffer = useCallStore.getState().incomingOffer;
        const currentCallType = useCallStore.getState().callType;

        console.log(`✅ acceptCall invoked for caller ${currentRemoteUser?._id}`);
        if (!currentRemoteUser || !currentIncomingOffer) {
            console.warn("⚠️ acceptCall aborted: missing remoteUser or incomingOffer");
            return;
        }

        setCallStatus("connecting");
        const stream = await getMediaStream(currentCallType);
        if (!stream) {
            console.warn("⚠️ acceptCall aborted: Could not get media stream. Rejecting call.");
            getSocket()?.emit("call-rejected", { to: currentRemoteUser._id });
            return;
        }

        console.log("🛠️ Creating peer connection for receiver...");
        const pc = createPeerConnection();
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        console.log("📝 Setting remote description (offer)...");
        await pc.setRemoteDescription(new RTCSessionDescription(currentIncomingOffer));

        console.log("📝 Creating answer...");
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        console.log(`📡 Emitting 'call-accepted' to socket for ${currentRemoteUser._id}`);
        getSocket()?.emit("call-accepted", { to: currentRemoteUser._id, answer });
    }, [setCallStatus, getMediaStream, createPeerConnection]);

    // Declining a call
    const declineCall = useCallback(() => {
        const currentRemoteUser = useCallStore.getState().remoteUser;
        if (currentRemoteUser) {
            getSocket()?.emit("call-rejected", { to: currentRemoteUser._id });
        }
        resetCall();
    }, [resetCall]);

    // Emitting end call
    const emitEndCall = useCallback(() => {
        const currentRemoteUser = useCallStore.getState().remoteUser;
        if (currentRemoteUser) {
            getSocket()?.emit("end-call", { to: currentRemoteUser._id });
        }
        endCall();
    }, [endCall]);

    // -------- TOGGLES --------
    const toggleAudio = useCallback(() => {
        const stream = useCallStore.getState().localStream;
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    }, [setIsMuted]);

    const toggleVideo = useCallback(() => {
        const stream = useCallStore.getState().localStream;
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    }, [setIsVideoOff]);

    // -------- SOCKET LISTENERS EXPORTED FOR CALL PROVIDER --------
    const handleCallAccepted = useCallback(async ({ answer }) => {
        console.log("📞 Received 'call-accepted' with answer. Setting remote description...");
        if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            setCallStatus("connected");
            if (callingTimeoutRef.current) clearTimeout(callingTimeoutRef.current);
            console.log("✅ Peer connection established & connected.");
        } else {
            console.warn("⚠️ Handled 'call-accepted' but peerConnectionRef is null!");
        }
    }, [setCallStatus]);

    const handleIceCandidate = useCallback(async ({ candidate }) => {
        if (peerConnectionRef.current) {
            console.log("❄️ Adding received ICE candidate...");
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
            console.warn("⚠️ Received ICE candidate but peerConnectionRef is null!");
        }
    }, []);

    return {
        // Actions (for CallProvider context)
        startCall,
        acceptCall,
        declineCall,
        emitEndCall,
        toggleAudio,
        toggleVideo,
        peerConnectionRef,
        // Socket handlers for CallProvider
        handleCallAccepted,
        handleIceCandidate,
        endCall, // forceful cleanup
    };
};
