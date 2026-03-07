import Chat from "../../models/chat.js";
import Message from "../../models/message.js";

export function registerChatEvents(io, socket, onlineUsers) {
    const userId = socket.userId;

    // JOIN CHAT
    socket.on("join-chat", async (chatId) => {
        try {
            const chat = await Chat.findById(chatId);
            if (!chat) {
                return socket.emit("join-error", "Chat not found");
            }

            const isParticipant = chat.users.some((id) => id.equals(userId));
            if (!isParticipant) {
                return socket.emit("join-error", "Access denied");
            }

            socket.join(chatId);
            socket.emit("joined-chat", chatId);
            console.log(`💬 [Chat] ${userId} joined room ${chatId}`);

            // When a user joins a chat, they implicitly "read" all messages in it not sent by them
            // We do not await this to keep the socket fast, but it updates the DB.
            Message.updateMany(
                { chat: chatId, sender: { $ne: userId } },
                { status: "read", $addToSet: { readBy: userId } }
            ).then((res) => {
                if (res.modifiedCount > 0) {
                    // Tell the room that messages were read
                    io.to(chatId).emit("messages_read", { chatId, readByUserId: userId });
                }
            }).catch(err => console.error("Error updating message status on join-chat:", err));

        } catch (err) {
            console.error("join-chat error:", err);
            socket.emit("join-error", "Server error");
        }
    });


    // MESSAGE RECEIVED (Delivered)
    // Client emits this when they successfully append a socket message to their local state.
    socket.on("message_received", async ({ messageId, chatId }) => {
        try {
            if (!messageId) return;

            const message = await Message.findById(messageId);

            // If the message is already 'read', don't downgrade it to 'delivered'
            if (message && message.status === "sent") {
                message.status = "delivered";
                await message.save();

                console.log(`📬 [Chat] Message ${messageId} delivered to ${userId}`);

                // Notify the room that the message was delivered
                io.to(chatId).emit("message_delivered", { messageId, chatId, deliveredToUserId: userId });
            }
        } catch (err) {
            console.error("message_received error:", err);
        }
    });
}
