/**
 * Authentication & Authorization Middleware
 *
 * Provides request validation (Joi schemas), JWT-based authentication,
 * ownership checks for posts/avatars, chat membership verification,
 * and group admin authorization.
 */

import Avatar from "./models/avatar.js";
import { userschema, avatarschema, postschema } from "./schema.js";
import ExpressErrors from "./utils/expressErrors.js";
import jwt from "jsonwebtoken";
import app from "./config/app.js"
import Chat from "./models/chat.js";
import Post from "./models/post.js";

// ─── Request Body Validators (Joi) ──────────────────────────────────────────

/** Validate user registration/update fields against the Joi schema */
export const validateuser = (req, res, next) => {
  let { error } = userschema.validate(req.body);
  if (error) {
    let errmsg = error.details.map((el) => el.message).join(",");
    throw new ExpressErrors(400, errmsg);
  }
  else {
    next();
  }
};

/** Validate avatar data against the Joi schema */
export const validateavatar = (req, res, next) => {
  let { error } = avatarschema.validate(req.body);
  if (error) {
    let errmsg = error.details.map((el) => el.message).join(",");
    throw new ExpressErrors(400, errmsg);
  }
  else {
    next();
  }
};

/** Validate post creation data against the Joi schema */
export const validatepost = (req, res, next) => {
  let { error } = postschema.validate(req.body);
  if (error) {
    let errmsg = error.details.map((el) => el.message).join(",");
    throw new ExpressErrors(400, errmsg);
  } else {
    next();
  }
};

// ─── Authentication ─────────────────────────────────────────────────────────

/**
 * JWT authentication middleware.
 * Extracts the Bearer token from the Authorization header,
 * verifies it against JWT_SECRET, and attaches `req.userId`.
 */
export const isLoggedIn = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user ID to the request for downstream handlers
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ─── Ownership Checks ───────────────────────────────────────────────────────

/**
 * Verify the authenticated user owns the target post.
 * Supports both :id and :postId route params.
 */
export const isOwner = async (req, res, next) => {
  const { id, postId } = req.params;
  const targetId = id || postId;

  const post = await Post.findById(targetId);

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  // Only the post owner can modify/delete it
  if (!post.owner.equals(req.userId)) {
    return res.status(403).json({
      message: "You are not allowed to modify this post",
    });
  }

  next();
};

/** Verify the authenticated user owns the target avatar */
const isAvatarOwner = async (req, res, next) => {
  const avatar = await Avatar.findById(req.params.id);

  if (!avatar) {
    return res.status(404).json({ message: "Avatar not found" });
  }

  if (avatar.owner.toString() !== req.userId) {
    return res.status(403).json({ message: "You are not allowed to do this" });
  }

  next();
};

// ─── Chat Access Control ────────────────────────────────────────────────────

/**
 * Verify the authenticated user is a participant in the chat.
 * Attaches the populated chat to `req.chat` for downstream use.
 * For 1v1 chats, also validates exactly 2 participants exist.
 */
export const canAccessChat = async (req, res, next) => {
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return res.status(404).json({ message: "Chat not found" });
  }

  // Check if requesting user is in the chat's participant list
  const isParticipant = chat.users
    .map(id => id.toString())
    .includes(req.userId);

  if (!isParticipant) {
    return res.status(403).json({ message: "Access denied" });
  }

  // Sanity check: 1v1 chats must have exactly 2 users
  if (!chat.isGroupChat && chat.users.length !== 2) {
    return res.status(400).json({ message: "Invalid 1v1 chat state" });
  }

  // Attach populated chat for use in the route handler
  req.chat = await Chat.findById(chatId)
    .populate({
      path: "lastMessage",
      populate: {
        path: "sender",
        select: "username email"
      }
    });
  next();
};

/**
 * Restrict access to group admin operations.
 * Must be used after `canAccessChat` middleware (requires req.chat).
 */
export const isGroupAdmin = (req, res, next) => {
  if (!req.chat.isGroupChat) {
    return res.status(400).json({ message: "Not a group chat" });
  }

  if (req.chat.admin.toString() !== req.userId) {
    return res.status(403).json({ message: "Admins only" });
  }

  next();
};

// ─── Cache Control ──────────────────────────────────────────────────────────

/** Prevent browser caching for sensitive or dynamic routes */
export const noCache = (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
};