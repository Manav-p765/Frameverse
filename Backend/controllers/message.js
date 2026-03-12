/**
 * Message Controller
 *
 * Handles sending, retrieving, and deleting chat messages.
 * Supports text, image, file, and call message types.
 * Manages read receipts and real-time delivery via Socket.IO.
 */
import Message from "../models/message.js";
import Chat from "../models/chat.js";
import cloudinary from "../config/cloudinary.js";
import { getIo } from "../utils/socketEmitter.js";

// Send message
export const sendMessage = async (req, res) => {
  try {
    const { chatId, content, messageType = "text", fileName = null } = req.body;

    if (!chatId || !content) {
      return res.status(400).json({ message: "chatId and content are required" });
    }

    if ((messageType === "image" || messageType === "file") && content.length > 7 * 1024 * 1024) {
      return res.status(413).json({ message: "File too large. Maximum size is 5MB." });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const isParticipant = chat.users.some((id) => id.toString() === req.userId.toString());
    if (!isParticipant) return res.status(403).json({ message: "Not allowed" });

    let finalContent = content;
    if (messageType === "image" || messageType === "file") {
      const uploadResult = await cloudinary.uploader.upload(content, {
        folder: "chat",
        resource_type: messageType === "image" ? "image" : "auto",
        public_id: fileName ? fileName.replace(/\.[^/.]+$/, "") : undefined, // use original name without extension
        use_filename: true,
        unique_filename: true,
      });
      finalContent = uploadResult.secure_url;
    }

    const message = await Message.create({
      chat: chatId,
      sender: req.userId,
      content: finalContent,
      messageType,
      fileName,
      readBy: [req.userId],
    });




    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
    });

    const fullMessage = await Message.findById(message._id)
      .populate("sender", "username profilePic")
      .populate("chat");

    const io = getIo();
    if (io) {
      io.to(chatId.toString()).emit("new-message", fullMessage);

      chat.users.forEach((userId) => {
        if (userId.toString() !== req.userId.toString()) {
          io.to(userId.toString()).emit("chat-updated", {
          chatId,
          lastMessage: fullMessage,
          lastMessageAt: new Date(),
            newMessage: fullMessage,
          });
        }
      });
    }

    res.status(201).json(fullMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get messages for a chat
export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const isParticipant = chat.users.some((u) => u && u.equals(req.userId));
    if (!isParticipant) return res.status(403).json({ message: "Not allowed" });

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("sender", "username profilePic")
      .exec();

    // Mark messages as read
    await Message.updateMany(
      { chat: chatId, readBy: { $ne: req.userId } },
      { $addToSet: { readBy: req.userId }, $set: { status: "read" } }
    );

    res.status(200).json(messages.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findOne({ _id: chatId, users: req.userId });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // Find messages not read by user
    await Message.updateMany(
      { chat: chatId, readBy: { $ne: req.userId } },
      { $addToSet: { readBy: req.userId }, $set: { status: "read" } }
    );

    const io = getIo();
    if (io) io.to(chatId.toString()).emit("messages_read", { chatId, readByUserId: req.userId });

    res.status(200).json({ message: "Marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });
    if (message.sender.toString() !== req.userId.toString())
      return res.status(403).json({ message: "Not allowed" });

    await message.deleteOne();

    const io = getIo();
    if (io) io.to(message.chat.toString()).emit("message-deleted", { messageId });

    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};