/**
 * Message Model
 *
 * Stores chat messages with support for text, image, file, and call types.
 * Call messages include metadata (callType, duration, status) in callMeta.
 * Tracks read receipts via readBy array and delivery status.
 */
import mongoose from "mongoose";


const messageSchema = new mongoose.Schema(
    {
        chat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat",
            required: true,
            index: true
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        content: {
            type: String,
            trim: true,
            required: true
        },

        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        messageType: {
            type: String,
            enum: ["text", "image", "file", "call"],
            default: "text"
        },
        fileName: { type: String, default: null },
        status: {
            type: String,
            enum: ["sent", "delivered", "read"],
            default: "sent"
        },

        // Call metadata — only present when messageType === "call"
        callMeta: {
            callType: { type: String, enum: ["audio", "video"] },
            duration: { type: Number, default: 0 },  // seconds
            status: { type: String, enum: ["completed", "missed", "rejected", "cancelled", "timeout", "disconnected"] },
        }

    },

    {
        timestamps: true
    }
);

messageSchema.index({ sender: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;