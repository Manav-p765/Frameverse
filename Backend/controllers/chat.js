/**
 * Chat Controller
 *
 * Manages chat lifecycle: creating 1v1 and group chats, retrieving
 * user's chat list, adding members to groups, and fetching shared
 * media (images/files) within a chat.
 */

import Message from "../models/message.js";
import Chat from "../models/chat.js";
import User from "../models/user.js";

/**
 * Create or retrieve a 1v1 direct message chat.
 * Accepts { userId } or { otherUserId } in the body.
 * Returns existing chat if one already exists between the two users.
 */
export const createChat = async (req, res) => {
  try {
    const { userId, otherUserId } = req.body;
    const targetId = userId || otherUserId;

    if (!targetId) return res.status(400).json({ message: "userId or otherUserId required" });
    if (targetId === req.userId) return res.status(400).json({ message: "Cannot chat with yourself" });

    // Prevent duplicate DMs — look for an existing non-group chat with exactly these 2 users
    const existing = await Chat.findOne({
      isGroup: false,
      users: { $all: [req.userId, targetId], $size: 2 },
    })
      .populate("users", "username profilePic")
      .populate({ path: "lastMessage", populate: { path: "sender", select: "username" } });

    if (existing) return res.status(200).json(existing);

    // No existing DM — create a new one
    const chat = await Chat.create({
      isGroup: false,
      users: [req.userId, targetId],
    });

    const populated = await Chat.findById(chat._id)
      .populate("users", "username profilePic")
      .populate({ path: "lastMessage", populate: { path: "sender", select: "username" } });

    res.status(201).json(populated);
  } catch (err) {
    console.error("createChat error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Create a new group chat.
 * Requires { title, usersId[] } in the body. The requesting user
 * is automatically added as both member and admin.
 */
export const createGroupChat = async (req, res) => {
  try {
    const { title, usersId, image, description } = req.body;

    // Groups need at least 2 other users + the creator = 3 total
    if (!usersId || usersId.length < 2) {
      return res.status(400).json({ message: "Group needs at least 3 users" });
    }

    const chat = await Chat.create({
      title,
      isGroup: true,
      users: [req.userId, ...usersId], // Creator + invited users
      admin: [req.userId],             // Creator starts as admin
      image: image || null,
      description: description || null,
    });

    const populated = await Chat.findById(chat._id)
      .populate("users", "username profilePic")
      .populate("admin", "username profilePic");

    res.status(201).json(populated);
  } catch (err) {
    console.error("createGroupChat error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get all chats for the authenticated user.
 * Sorted by most recent message activity (lastMessageAt descending).
 */
export const getMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({ users: req.userId })
      .populate("users", "username profilePic")
      .populate("admin", "username profilePic")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "username profilePic" },
      })
      .sort({ lastMessageAt: -1 }); // Most recent chats first

    res.status(200).json(chats);
  } catch (err) {
    console.error("getMyChats error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get a single chat by ID.
 * Only returns the chat if the authenticated user is a member.
 */
export const getChat = async (req, res) => {
  try {
    // Ensure requesting user is a participant (users filter)
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
    console.error("getChat error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Add a user to a group chat.
 * Only group admins can add new members. Prevents duplicate additions.
 */
export const addUserToGroup = async (req, res) => {
  try {
    const { userId } = req.body;
    const chat = await Chat.findById(req.params.chatId);

    if (!chat || !chat.isGroup) return res.status(404).json({ message: "Group chat not found" });

    // Only admins can add members
    const isAdmin = chat.admin.some((a) => a.toString() === req.userId);
    if (!isAdmin) return res.status(403).json({ message: "Not an admin" });

    // Prevent adding someone who's already in the group
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
    console.error("addUserToGroup error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get shared media (images & files) for a chat.
 * Returns the 50 most recent media messages, only if the user is a member.
 */
export const getChatMedia = async (req, res) => {
  try {
    const { chatId } = req.params;

    // Verify membership before returning media
    const chat = await Chat.findOne({ _id: chatId, users: req.userId });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // Fetch only image/file messages, sorted newest-first
    const media = await Message.find({
      chat: chatId,
      messageType: { $in: ["image", "file"] },
    })
      .sort({ createdAt: -1 })
      .populate("sender", "username profilePic")
      .limit(50);

    res.status(200).json(media);
  } catch (err) {
    console.error("getChatMedia error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};