// Map to handle debouncing logic for typing: Map<chatId_userId, NodeJS.Timeout>
const typingTimeouts = new Map();

export function registerTypingEvents(io, socket) {
    const userId = socket.userId;

    socket.on("typing_start", (chatId) => {
        if (!chatId) return;

        const timeoutKey = `${chatId}_${userId}`;

        // Clear any existing timeout so we don't accidentally stop typing while they are still typing
        if (typingTimeouts.has(timeoutKey)) {
            clearTimeout(typingTimeouts.get(timeoutKey));
        }

        // Broadcast typing start to the room
        socket.to(chatId).emit("typing_start", { chatId, userId });

        // Set a debounce fallback in case the client disconnects or forgets to send typing_stop
        const timeout = setTimeout(() => {
            socket.to(chatId).emit("typing_stop", { chatId, userId });
            typingTimeouts.delete(timeoutKey);
        }, 3000); // 3-second server fallback

        typingTimeouts.set(timeoutKey, timeout);
    });

    socket.on("typing_stop", (chatId) => {
        if (!chatId) return;

        const timeoutKey = `${chatId}_${userId}`;
        if (typingTimeouts.has(timeoutKey)) {
            clearTimeout(typingTimeouts.get(timeoutKey));
            typingTimeouts.delete(timeoutKey);
        }

        // Broadcast typing stop
        socket.to(chatId).emit("typing_stop", { chatId, userId });
    });

    // Cleanup on disconnect
    socket.on("disconnect", () => {
        // We would need to iterate through timeouts to find ones belonging to this user
        for (const [key, timeoutId] of typingTimeouts.entries()) {
            if (key.endsWith(`_${userId}`)) {
                clearTimeout(timeoutId);
                typingTimeouts.delete(key);
                const chatId = key.split("_")[0];
                // Ensure others know they stopped typing
                socket.to(chatId).emit("typing_stop", { chatId, userId });
            }
        }
    });
}
