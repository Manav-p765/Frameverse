/**
 * controllers/user.js — PRODUCTION-READY
 *
 * All auth (email/password, Google, GitHub) goes through Firebase.
 * Backend only verifies Firebase idTokens and issues app JWTs.
 * No passwords stored in MongoDB.
 */

import User from "../models/user.js";
import { sendToken } from "../utils/sendToken.js";
import admin from "../config/firebaseAdmin.js";
import Post from "../models/post.js";
import Notification from "../models/notification.js";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const logoutUser = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ message: "Logged out" });
};

/**
 * POST /user/auth/firebase
 * Body: { idToken: string, username?: string }
 *
 * Single endpoint for ALL auth methods — email/password, Google, GitHub.
 * Firebase handles credentials. We verify the idToken, upsert the user
 * in MongoDB, and return our own JWT.
 */
export const firebaseAuth = async (req, res, next) => {
  try {
    const { idToken, username } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "Firebase idToken is required" });
    }

    // Verify token with Firebase Admin — throws if expired or invalid
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch {
      return res.status(401).json({ message: "Invalid or expired Firebase token" });
    }

    const { uid, email, name, picture, firebase: fbClaims } = decoded;
    const signInProvider = fbClaims?.sign_in_provider;
    const provider =
      signInProvider === "github.com" ? "github" :
      signInProvider === "google.com" ? "google" :
      "local"; // email/password

    if (!email) {
      return res.status(400).json({
        message:
          provider === "github"
            ? "No email from GitHub. Make sure your GitHub email is public."
            : "No email returned from provider.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── Find existing user by firebaseUid or email ─────────────────────────────
    let user = await User.findOne({
      $or: [{ firebaseUid: uid }, { email: normalizedEmail }],
    });

    if (user) {
      // Link Firebase UID if this is an existing account signing in via Firebase for the first time
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
        user.provider    = provider;
        if (!user.profilePic && picture) user.profilePic = picture;
        await user.save({ validateBeforeSave: false });
      }
      return sendToken(user, res, 200, "Login successful");
    }

    // ── New user — username required ───────────────────────────────────────────
    if (!username || !username.trim()) {
      // Suggest a username derived from their display name or email
      const base = (name || normalizedEmail.split("@")[0])
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 20);

      return res.status(200).json({
        needsUsername: true,
        suggestedUsername: base,
        message: "Choose a username to complete sign up",
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
      return res.status(400).json({
        field: "username",
        message: "Username must be 3–30 characters: letters, numbers, underscores only",
      });
    }

    // ── Create new user ────────────────────────────────────────────────────────
    try {
      user = await User.create({
        firebaseUid: uid,
        email:       normalizedEmail,
        username:    cleanUsername,
        profilePic:  picture ?? "",
        provider,
      });
    } catch (err) {
      if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({ field, message: `${field} already exists` });
      }
      throw err;
    }

    return sendToken(user, res, 201, "Account created");
  } catch (err) {
    console.error("firebaseAuth error:", err);
    next(err);
  }
};

// ─── User Profile ─────────────────────────────────────────────────────────────

export const authMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id || req.userId;
    const user = await User.findById(userId)
      .populate("followers", "username bio avatar profilePic")
      .populate("following", "username bio avatar profilePic")
      .populate({
        path: "posts",
        populate: { path: "owner", select: "-password -email -__v" },
      });

    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const searchUsers = async (req, res) => {
  const q = String(req.query.q || "");
  if (!q.trim()) return res.json([]);

  const users = await User.find({
    _id: { $ne: req.userId },
    $or: [{ username: { $regex: "^" + q, $options: "i" } }],
  }).select("username profilePic bio").limit(20);

  res.status(200).json(users);
};

export const updateUserProfile = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password;
    delete updates.email;
    delete updates.firebaseUid;
    delete updates.provider;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "profile_pics",
        transformation: [{ width: 500, height: 500, crop: "fill" }],
      });
      updates.profilePic = result.secure_url;
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Username already exists" });
    }
    res.status(500).json({ message: error.message });
  }
};

// ─── Follow / Unfollow ────────────────────────────────────────────────────────

export const followUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId       = req.userId;
    const targetUserId = req.params.id;

    if (userId === targetUserId) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    const targetUser = await User.findById(targetUserId).session(session);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyFollowing = targetUser.followers.some((id) => id.toString() === userId);
    if (alreadyFollowing) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Already following this user" });
    }

    await User.findByIdAndUpdate(userId,       { $addToSet: { following: targetUserId } }, { session });
    await User.findByIdAndUpdate(targetUserId, { $addToSet: { followers: userId } },       { session });
    await session.commitTransaction();
    session.endSession();

    try {
      const notif     = await Notification.create({ recipient: targetUserId, sender: userId, type: "follow" });
      const populated = await notif.populate("sender", "username profilePic");
      req.app.get("io").to(targetUserId).emit("new-notification", populated);
    } catch (notifErr) {
      if (notifErr.code !== 11000) console.error("Notif error:", notifErr);
    }

    return res.status(200).json({ message: "User followed successfully", isFollowing: true });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: "Follow failed" });
  }
};

export const unfollowUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId       = req.userId;
    const targetUserId = req.params.id;

    if (userId === targetUserId) {
      return res.status(400).json({ message: "You can't unfollow yourself" });
    }

    const targetUser = await User.findById(targetUserId).session(session);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = targetUser.followers.some((id) => id.toString() === userId);
    if (!isFollowing) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "You are not following this user" });
    }

    await User.findByIdAndUpdate(userId,       { $pull: { following: targetUserId } }, { session });
    await User.findByIdAndUpdate(targetUserId, { $pull: { followers: userId } },       { session });
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ message: "User unfollowed successfully", isFollowing: false });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: "Unfollow failed" });
  }
};

export const getFeed = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const depth = parseInt(req.query.depth) || 0;
    const user  = await User.findById(req.userId).select("following");
    if (!user) return res.status(404).json({ message: "User not found" });

    const followingIds = user.following.map((id) => new mongoose.Types.ObjectId(id));

    const posts = await Post.aggregate([
      { $addFields: { priority: { $cond: [{ $in: ["$owner", followingIds] }, 1, 0] } } },
      { $sort: { priority: -1, createdAt: -1 } },
      { $skip: depth * limit },
      { $limit: limit },
      { $lookup: { from: "users", localField: "owner", foreignField: "_id", as: "owner" } },
      { $unwind: "$owner" },
      {
        $addFields: {
          likesCount:         { $size: "$likes" },
          likedByCurrentUser: { $in: [new mongoose.Types.ObjectId(req.userId), "$likes"] },
        },
      },
      { $project: { likes: 0, "owner.password": 0, "owner.email": 0, "owner.__v": 0 } },
    ]);

    return res.status(200).json({ posts });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate("following", "username profilePic bio")
      .lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user.following);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};