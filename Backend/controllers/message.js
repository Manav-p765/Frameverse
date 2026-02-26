import Message from "../models/message.js";
import Chat from "../models/chat.js";

// Send message
export const sendMessage = async (req, res) => {
  try {
    const { chatId, content, messageType = "text" } = req.body;

    if (!chatId || !content) {
      return res.status(400).json({ message: "chatId and content are required" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const isParticipant = chat.users.some((id) => id.toString() === req.userId.toString());
    if (!isParticipant) return res.status(403).json({ message: "Not allowed" });

    const message = await Message.create({
      chat: chatId,
      sender: req.userId,
      content,
      messageType,
      readBy: [req.userId],
    });

    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
    });

    const fullMessage = await Message.findById(message._id)
      .populate("sender", "username profilePic")
      .populate("chat");

    // Emit via socket
    const io = req.app.get("io");
    io.to(chatId).emit("new-message", fullMessage);

    // Also notify each user's personal room for chat list updates
    chat.users.forEach((userId) => {
      if (userId.toString() !== req.userId.toString()) {
        io.to(userId.toString()).emit("chat-updated", {
          chatId,
          lastMessage: fullMessage,
          lastMessageAt: new Date(),
        });
      }
    });

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
      { $addToSet: { readBy: req.userId } }
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

    await Message.updateMany(
      { chat: chatId, readBy: { $ne: req.userId } },
      { $addToSet: { readBy: req.userId } }
    );

    // Notify others that messages were read
    const io = req.app.get("io");
    io.to(chatId).emit("messages-read", { chatId, userId: req.userId });

    res.status(200).json({ message: "Marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};