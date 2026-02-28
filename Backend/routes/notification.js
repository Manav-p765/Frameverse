import express from "express";
import { isLoggedIn } from "../middleware.js";
import {
    getNotifications,
    markAllRead,
    getUnreadCount,
} from "../controllers/notification.js";

const router = express.Router();

// All routes require authentication
router.use(isLoggedIn);

router.get("/", getNotifications);
router.patch("/read", markAllRead);
router.get("/unread-count", getUnreadCount);

export default router;
