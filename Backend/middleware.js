
import Avatar from "./models/avatar.js";
import { userschema, avatarschema } from "./schema.js";
import ExpressErrors from "./utils/expressErrors.js";
import jwt from "jsonwebtoken";
import app from "./config/app.js"
import Chat from "./models/chat.js";
import Post from "./models/post.js";

//validating user server side errors
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

//validating avatar server side errors
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



export const isLoggedIn = (req, res, next) => {

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};



export const isOwner = async (req, res, next) => {
  const { id } = req.params;

  const post = await Post.findById(id);

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  if (!post.owner.equals(req.userId)) {
    return res.status(403).json({
      message: "You are not allowed to modify this post",
    });
  }

  next();
};


const isAvatarOwner = async (req, res, next) => {
  const avatar = await Avatar.findById(req.params.id);

  if (!avatar) {
    return next(new ExpressErrors(404, "Avatar not found"));
  }

  if (avatar.owner.toString() !== req.userId) {
    return next(new ExpressErrors(403, "You are not allowed to do this"));
  }

  next();
};


export const canAccessChat = async (req, res, next) => {
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return res.status(404).json({ message: "Chat not found" });
  }

  const isParticipant = chat.users
    .map(id => id.toString())
    .includes(req.userId);

  if (!isParticipant) {
    return res.status(403).json({ message: "Access denied" });
  }

  // Extra safety for 1v1
  if (!chat.isGroupChat && chat.users.length !== 2) {
    return res.status(400).json({ message: "Invalid 1v1 chat state" });
  }

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


// Group admin only
export const isGroupAdmin = (req, res, next) => {
  if (!req.chat.isGroupChat) {
    return res.status(400).json({ message: "Not a group chat" });
  }

  if (req.chat.admin.toString() !== req.userId) {
    return res.status(403).json({ message: "Admins only" });
  }

  next();
};




export const noCache = (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
};