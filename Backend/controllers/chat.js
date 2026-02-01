import Message from "../models/message.js";
import Chat from "../models/chat.js";


//create chat 1v1
export const createChat = async (req, res) => {
    const { otherUserId } = req.body;

    if (otherUserId === req.user) {
        return res.status(400).json({ message: "Talking to yourself?" });
    }

    const chat = await Chat.create({
        isGroupChat: false,
        users: [req.userId, otherUserId]
    });

    res.status(201).json(chat);
}

// Create group chat
export const createGroupChat = async (req, res) => {
    const { name, usersId } = req.body;

    if (!usersId || usersId.length < 2) {
        return res.status(400).json({ message: "Group needs 3+ users" });
    }

    const chat = await Chat.create({
        name,
        isGroupChat: true,
        users: [req.userId, ...usersId],
        admin: req.userId
    });

    res.status(201).json(chat);
}

// Get chat (1v1 or group)
export const getChat = async (req, res) => {
    res.json(req.chat);
}

// Add user to group
export const addUserToGroup = async (req, res) => {
    const { userId } = req.body;

    if (req.chat.participants.includes(userId)) {
        return res.status(400).json({ message: "User already in group" });
    }

    req.chat.participants.push(userId);
    await req.chat.save();

    res.json(req.chat);
}

// Send message
export const sendMessage = async (req, res) => {
    try {
        const { chatId, content } = req.body || {};

        if (!chatId || !content) {
            return res.status(400).json({
                message: "chatId and content are required"
            });
        }

        //  Check chat exists
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        // Ensure user is part of chat
        const isParticipant = chat.users
            .some(id => id.toString() === req.userId.toString());

        if (!isParticipant) {
            return res.status(403).json({
                message: "You are not allowed to send messages in this chat"
            });
        }

        // Save message
        const message = await Message.create({
            chat: chatId,
            sender: req.userId,
            content
        });

        //  Atomically update chat
        await Chat.findByIdAndUpdate(chatId, {
            lastMessage: message._id,
            lastMessageAt: new Date()
        });

        // Populate message for sending
        const fullMessage = await Message.findById(message._id)
            .populate("sender", "username email")
            .populate("chat");

        // Emit socket event
        const io = req.app.get("io");

        // socket connect
        io.to(chatId).emit("new-message", {
            message: fullMessage,
            senderId: req.userId
        });

        res.status(201).json(fullMessage);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Get messages form a chat
export const getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;

        if (!chatId) {
            return res.status(400).json({ message: "chatId is required" });
        }

        // 1️⃣ Find chat
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        // 2️⃣ Ensure user is part of chat
        if (!Array.isArray(chat.users)) {
            return res.status(500).json({ message: "Chat users invalid" });
        }

        const isParticipant = chat.users.some(
            userId => userId && userId.equals(req.userId)
        );

        if (!isParticipant) {
            return res.status(403).json({ message: "Not allowed" });
        }

        // 3️⃣ Fetch messages
        const messages = await Message.find({ chat: chatId })
            .sort({ createdAt: 1 }) // oldest → newest
            .populate("sender", "username email") // SAFE fields only
            .exec();

        // 4️⃣ Return messages
        res.status(200).json(messages);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
}