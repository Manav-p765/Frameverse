import React, { createContext, useContext } from "react";
import { useSocketEvent, getSocket } from "../../hooks/useSocket";
import { useCallStore } from "../../store/useCallStore";
import { useWebRTC } from "../../hooks/useWebRTC";
import CallScreen from "./CallScreen";
import IncomingCallModal from "./IncomingCallModal";

// Context so children (CallScreen, IncomingCallModal) use the SAME hook instance
const CallActionsContext = createContext(null);
export const useCallActions = () => useContext(CallActionsContext);

export default function CallProvider({ children }) {
    const { callStatus, receiveCall, setCallFailed } = useCallStore();

    // Single, authoritative useWebRTC instance for the entire app
    const webrtc = useWebRTC();

    const {
        handleCallAccepted,
        handleIceCandidate,
        endCall
    } = webrtc;

    // 1. Incoming Call Listener
    useSocketEvent("incoming-call", ({ from, offer, callType }) => {
        const currentStatus = useCallStore.getState().callStatus;

        // Front-end Busy Guard (just in case backend misses it)
        if (currentStatus !== "idle") {
            getSocket()?.emit("user-busy", { to: from._id });
            return;
        }

        receiveCall(from, callType, offer);
    });

    // 2. Call Accepted Listener
    useSocketEvent("call-accepted", async ({ answer }) => {
        const currentStatus = useCallStore.getState().callStatus;
        if (currentStatus === "calling" || currentStatus === "connecting") {
            await handleCallAccepted({ answer });
        }
    });

    // 3. User Busy Listener
    useSocketEvent("user-busy", () => {
        if (useCallStore.getState().callStatus === "calling") {
            setCallFailed("User is busy");
            setTimeout(endCall, 3000);
        }
    });

    // 4. Call Rejected Listener
    useSocketEvent("call-rejected", () => {
        if (useCallStore.getState().callStatus === "calling") {
            setCallFailed("Call declined");
            setTimeout(endCall, 3000);
        }
    });

    // 5. ICE Candidate Listener
    useSocketEvent("ice-candidate", ({ candidate }) => {
        handleIceCandidate({ candidate });
    });

    // 6. End Call Listener
    useSocketEvent("end-call", () => {
        endCall();
    });

    return (
        <CallActionsContext.Provider value={webrtc}>
            {children}

            {/* Conditionally Render Modals based on the unified state machine */}
            {callStatus === "ringing" && <IncomingCallModal />}

            {(callStatus === "calling" ||
                callStatus === "connecting" ||
                callStatus === "connected" ||
                callStatus === "failed") && <CallScreen />}
        </CallActionsContext.Provider>
    );
}
