import { useState, useEffect } from "react";
import { getSocket } from "./useSocket";

export const usePresence = (userId) => {
    const [isOnline, setIsOnline] = useState(false);
    const [lastSeen, setLastSeen] = useState(null);

    useEffect(() => {
        if (!userId) return;

        const socket = getSocket();
        if (!socket) return;

        // We can ask the server for the full list right away
        socket.emit("sync_presence");

        const onSyncFull = (onlineList) => {
            if (onlineList.includes(userId)) {
                setIsOnline(true);
            }
        };

        const onUserOnline = ({ userId: onlineId }) => {
            if (onlineId === userId) setIsOnline(true);
        };

        const onUserOffline = ({ userId: offlineId, lastSeen: seenTime }) => {
            if (offlineId === userId) {
                setIsOnline(false);
                if (seenTime) setLastSeen(new Date(seenTime));
            }
        };

        socket.on("presence_sync_full", onSyncFull);
        socket.on("user_online", onUserOnline);
        socket.on("user_offline", onUserOffline);

        return () => {
            // Cleanup
            socket.off("presence_sync_full", onSyncFull);
            socket.off("user_online", onUserOnline);
            socket.off("user_offline", onUserOffline);
        };
    }, [userId]);

    return { isOnline, lastSeen };
};
