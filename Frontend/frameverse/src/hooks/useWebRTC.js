import { useRef, useState, useCallback } from "react";
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
        remoteUser,
        callType,
        incomingOffer,
        resetCall,
        setCallFailed,
    } = useCallStore();

    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

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
        if (localStream) cleanupMediaTracks(localStream);
        if (remoteStream) cleanupMediaTracks(remoteStream);

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
    }, [localStream, remoteStream, cleanupMediaTracks, resetCall]);

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
    }, [setCallFailed]);

    // -------- PEER CONNECTION INIT --------
    const createPeerConnection = useCallback(() => {
        const pc = new RTCPeerConnection(iceServersConfig);

        pc.onicecandidate = (event) => {
            if (event.candidate && remoteUser) {
                getSocket()?.emit("ice-candidate", {
                    to: remoteUser._id,
                    candidate: event.candidate,
                });
            }
        };

        pc.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };

        pc.onconnectionstatechange = () => {
            if (
                pc.connectionState === "disconnected" ||
                pc.connectionState === "failed" ||
                pc.connectionState === "closed"
            ) {
                endCall();
            }
        };

        peerConnectionRef.current = pc;
        return pc;
    }, [remoteUser, endCall]);

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

        // Note: the socket caller's ID and username gets injected securely on the backend if available,
        // or we send our own local info so the receiver knows who's calling.
        // Fetch current user from localStorage config if needed, but for now we expect App level to deal with this, 
        // or just rely on the API. To be safe, we'll ask the `CallProvider` to pass the local user down if needed,
        // but the backend can also infer `req.user`. Wait, backend relies on `from` sent by the client.
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
        if (!remoteUser || !incomingOffer) return;

        setCallStatus("connecting");
        const stream = await getMediaStream(callType);
        if (!stream) {
            getSocket()?.emit("call-rejected", { to: remoteUser._id });
            return;
        }

        const pc = createPeerConnection();
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        getSocket()?.emit("call-accepted", { to: remoteUser._id, answer });
    }, [remoteUser, incomingOffer, callType, setCallStatus, getMediaStream, createPeerConnection]);

    // Declining a call
    const declineCall = useCallback(() => {
        if (remoteUser) {
            getSocket()?.emit("call-rejected", { to: remoteUser._id });
        }
        resetCall();
    }, [remoteUser, resetCall]);

    // Emitting end call
    const emitEndCall = useCallback(() => {
        if (remoteUser) {
            getSocket()?.emit("end-call", { to: remoteUser._id });
        }
        endCall();
    }, [remoteUser, endCall]);

    // -------- TOGGLES --------
    const toggleAudio = useCallback(() => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    }, [localStream]);

    const toggleVideo = useCallback(() => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    }, [localStream]);

    // -------- SOCKET LISTENERS EXPORTED FOR CALL PROVIDER --------
    // Since we abstracted socket events to be handled globally, we expose handlers here 
    // that the CallProvider will bind to the global socket.

    const handleCallAccepted = useCallback(async ({ answer }) => {
        if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            setCallStatus("connected");
            if (callingTimeoutRef.current) clearTimeout(callingTimeoutRef.current);
        }
    }, [setCallStatus]);

    const handleIceCandidate = useCallback(async ({ candidate }) => {
        if (peerConnectionRef.current) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }, []);

    return {
        localStream,
        remoteStream,
        isMuted,
        isVideoOff,
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
