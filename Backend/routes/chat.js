import { Router } from "express";
import { isLoggedIn } from "../middleware.js";
import {
  createChat,
  createGroupChat,
  getMyChats,
  getChat,
  addUserToGroup,
  getChatMedia,
} from "../controllers/chat.js";

const chatRouter = Router();

// Base: /chats/router

chatRouter.get("/", isLoggedIn, getMyChats);
chatRouter.post("/", isLoggedIn, createChat);
chatRouter.post("/group", isLoggedIn, createGroupChat);
chatRouter.get("/:chatId", isLoggedIn, getChat);
chatRouter.post("/:chatId/add-user", isLoggedIn, addUserToGroup);
chatRouter.get("/:chatId/media", isLoggedIn, getChatMedia);

export default chatRouter;