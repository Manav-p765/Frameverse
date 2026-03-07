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
            enum: ["text", "image", "file"],
            default: "text"
        },
        fileName: { type: String, default: null },
        status: {
            type: String,
            enum: ["sent", "delivered", "read"],
            default: "sent"
        }

    },

    {
        timestamps: true
    }
);

messageSchema.index({ sender: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;