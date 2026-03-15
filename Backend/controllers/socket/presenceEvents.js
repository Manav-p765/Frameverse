import User from "../../models/user.js";

export async function registerPresenceEvents(io, socket, onlineUsers) {
    const userId = socket.userId;

    let username = "Unknown";
    try {
        const user = await User.findById(userId).select("username");
        if (user) username = user.username;
    } catch (err) {
        console.error("Error fetching username for presence:", err);
    }

    // Track the tab count for this user
    if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, { socketId: socket.id, tabCount: 0, lastSeen: new Date(), username });
    } else {
        const session = onlineUsers.get(userId);
        if (session) session.username = username; // Update
    }

    const userSession = onlineUsers.get(userId);
    userSession.tabCount += 1;
    userSession.socketId = socket.id; // Update to the most recent active socket

    // Announce user is online
    if (userSession.tabCount === 1) {
        console.log(`🟢 [Presence] User ${username} (${userId}) is now ONLINE.`);
        io.emit("user_online", { userId, username });
    }

    socket.on("sync_presence", () => {
        // Send back current online users so the client knows who is currently active
        const onlineList = Array.from(onlineUsers.entries()).map(([id, data]) => ({
            userId: id,
            username: data.username || "Unknown"
        }));
        socket.emit("presence_sync_full", onlineList);
    });

    socket.on("disconnect", () => {
        if (onlineUsers.has(userId)) {
            const session = onlineUsers.get(userId);
            session.tabCount -= 1;

            if (session.tabCount <= 0) {
                session.lastSeen = new Date();
                console.log(`🔴 [Presence] User ${userId} is now OFFLINE.`);
                // Broadcast offline status
                io.emit("user_offline", { userId, lastSeen: session.lastSeen });
                // Clean up memory
                onlineUsers.delete(userId);
            }
        }
    });
}
