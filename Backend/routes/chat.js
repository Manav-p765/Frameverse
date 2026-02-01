import { Router } from "express";
import {  isLoggedIn,  canAccessChat, isGroupAdmin } from "../middleware.js";
import { sendMessage, createGroupChat, getChat, addUserToGroup, createChat, getMessages } from "../controllers/chat.js";

const router = Router({ mergeParams: true });

//create chat 1v1
router.post("/create", isLoggedIn, createChat);

// Create group chat
router.post("/group", isLoggedIn, createGroupChat);

// Get chat (1v1 or group)
router.get("/:chatId", isLoggedIn, canAccessChat, getChat);

// Add user to group
router.post("/:chatId/add", isLoggedIn, canAccessChat, isGroupAdmin, addUserToGroup);

// Send message
router.post("/message", isLoggedIn, sendMessage);


// Get messages form a chat
router.get("/messages/:chatId", isLoggedIn, getMessages);


export default router;