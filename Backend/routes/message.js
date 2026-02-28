import { Router } from "express";
import { isLoggedIn } from "../middleware.js";
import { sendMessage, getMessages, markAsRead, deleteMessage } from "../controllers/message.js";

const messageRouter = Router();

// Base: /chats/router/messages  (or mount separately as /messages)

messageRouter.post("/", isLoggedIn, sendMessage);
messageRouter.get("/:chatId", isLoggedIn, getMessages);
messageRouter.patch("/:chatId/read", isLoggedIn, markAsRead);
messageRouter.delete("/:messageId", isLoggedIn, deleteMessage);

export default messageRouter;