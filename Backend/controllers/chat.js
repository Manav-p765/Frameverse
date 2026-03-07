import Message from "../models/message.js";
import Chat from "../models/chat.js";
import User from "../models/user.js";

// Create 1v1 chat
export const createChat = async (req, res) => {
  try {
    const { userId, otherUserId } = req.body;
    const targetId = userId || otherUserId;

    if (!targetId) return res.status(400).json({ message: "userId or otherUserId required" });
    if (targetId === req.userId) return res.status(400).json({ message: "Cannot chat with yourself" });

    // Check if 1v1 chat already exists
    const existing = await Chat.findOne({
      isGroup: false,
      users: { $all: [req.userId, targetId], $size: 2 },
    })
      .populate("users", "username profilePic")
      .populate({ path: "lastMessage", populate: { path: "sender", select: "username" } });

    if (existing) return res.status(200).json(existing);

    const chat = await Chat.create({
      isGroup: false,
      users: [req.userId, targetId],
    });

    const populated = await Chat.findById(chat._id)
      .populate("users", "username profilePic")
      .populate({ path: "lastMessage", populate: { path: "sender", select: "username" } });

    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create group chat
export const createGroupChat = async (req, res) => {
  try {
    const { title, usersId, image, description } = req.body;

    if (!usersId || usersId.length < 2) {
      return res.status(400).json({ message: "Group needs at least 3 users" });
    }

    const chat = await Chat.create({
      title,
      isGroup: true,
      users: [req.userId, ...usersId],
      admin: [req.userId],
      image: image || null,
      description: description || null,
    });

    const populated = await Chat.findById(chat._id)
      .populate("users", "username profilePic")
      .populate("admin", "username profilePic");

    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all chats for current user
export const getMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({ users: req.userId })
      .populate("users", "username profilePic")
      .populate("admin", "username profilePic")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "username profilePic" },
      })
      .sort({ lastMessageAt: -1 });

    res.status(200).json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get single chat
export const getChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.chatId, users: req.userId })
      .populate("users", "username profilePic")
      .populate("admin", "username profilePic")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "username profilePic" },
      });

    if (!chat) return res.status(404).json({ message: "Chat not found" });

    res.status(200).json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add user to group
export const addUserToGroup = async (req, res) => {
  try {
    const { userId } = req.body;
    const chat = await Chat.findById(req.params.chatId);

    if (!chat || !chat.isGroup) return res.status(404).json({ message: "Group chat not found" });

    const isAdmin = chat.admin.some((a) => a.toString() === req.userId);
    if (!isAdmin) return res.status(403).json({ message: "Not an admin" });

    if (chat.users.some((u) => u.toString() === userId)) {
      return res.status(400).json({ message: "User already in group" });
    }

    chat.users.push(userId);
    await chat.save();

    const updated = await Chat.findById(chat._id)
      .populate("users", "username profilePic")
      .populate("admin", "username profilePic");

    res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get shared media for a chat
export const getChatMedia = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findOne({ _id: chatId, users: req.userId });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const media = await Message.find({
      chat: chatId,
      messageType: { $in: ["image", "file"] },
    })
      .sort({ createdAt: -1 })
      .populate("sender", "username profilePic")
      .limit(50);

    res.status(200).json(media);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};