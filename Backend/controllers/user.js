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
import EngagementService from "../services/engagementService.js";
import FeedService from "../services/feedService.js";
import Follow from "../models/follow.js";
import redis from "../config/redis.js";

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
        user.provider = provider;
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
        email: normalizedEmail,
        username: cleanUsername,
        profilePic: picture ?? "",
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

const PROFILE_CACHE_TTL = 120; // 2 minutes

const getProfileCache = async (key) => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
};

const setProfileCache = async (key, data) => {
  try {
    await redis.setex(key, PROFILE_CACHE_TTL, JSON.stringify(data));
  } catch (err) {
    console.error("Profile cache set error:", err);
  }
};

const invalidateProfileCache = async (userId) => {
  try {
    await redis.del(`profile:${userId}`);
  } catch { /* ignore */ }
};

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id || req.userId;
    const cacheKey = `profile:${userId}`;

    // Check cache first
    const cached = await getProfileCache(cacheKey);
    if (cached) {
      if (req.params.id && req.params.id !== req.userId) {
        User.findByIdAndUpdate(userId, { $inc: { profileViews: 1 } }).catch(() => { });
      }
      return res.status(200).json(cached);
    }

    // Parallel: increment views (fire-and-forget) + fetch base user
    const [user] = await Promise.all([
      User.findById(userId).select("username profilePic bio posts profileViews followersCount followingCount followers following").lean(),
      req.params.id && req.params.id !== req.userId
        ? User.findByIdAndUpdate(userId, { $inc: { profileViews: 1 } }).catch(() => { })
        : Promise.resolve(),
    ]);

    if (!user) return res.status(404).json({ message: "User not found" });

    const postIds = user.posts || [];
    const followerIds = user.followers || [];
    const followingIds = user.following || [];

    // Parallel: followers, following, posts with owners
    const [followersList, followingList, postsList] = await Promise.all([
      followerIds.length
        ? User.find({ _id: { $in: followerIds } }).select("username bio profilePic followersCount followingCount").lean()
        : [],
      followingIds.length
        ? User.find({ _id: { $in: followingIds } }).select("username bio profilePic followersCount followingCount").lean()
        : [],
      postIds.length
        ? Post.find({ _id: { $in: postIds } })
          .populate("owner", "username profilePic followersCount followingCount")
          .lean()
        : [],
    ]);

    // Preserve original order of followers/following
    const followers = followerIds.map(id => followersList.find(u => u._id.toString() === id.toString())).filter(Boolean);
    const following = followingIds.map(id => followingList.find(u => u._id.toString() === id.toString())).filter(Boolean);

    const profile = {
      ...user,
      followers,
      following,
      posts: postsList.map(post => ({
        ...post,
        likedByCurrentUser: req.userId ? post.likes.some(id => id.toString() === req.userId.toString()) : false,
      })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    };

    await setProfileCache(cacheKey, profile);
    res.status(200).json(profile);
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
    await invalidateProfileCache(req.userId);
    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Username already exists" });
    }
    res.status(500).json({ message: error.message });
  }
};

// ─── Follow / Unfollow ────────────────────────────────────────────────────────

export const followUser = async (req, res, next) => {
  try {
    const result = await EngagementService.toggleFollow(req.userId, req.params.id);
    await Promise.all([invalidateProfileCache(req.userId), invalidateProfileCache(req.params.id)]);
    return res.status(200).json({
      message: result.isFollowing ? "User followed" : "User unfollowed",
      ...result
    });
  } catch (err) {
    next(err);
  }
};

export const unfollowUser = async (req, res, next) => {
  try {
    const result = await EngagementService.toggleFollow(req.userId, req.params.id);
    await Promise.all([invalidateProfileCache(req.userId), invalidateProfileCache(req.params.id)]);
    return res.status(200).json({
      message: result.isFollowing ? "User followed" : "User unfollowed",
      ...result
    });
  } catch (err) {
    next(err);
  }
};

export const getFollowers = async (req, res) => {
  try {
    const targetUserId = req.params.id || req.userId;
    const follows = await Follow.find({ followingId: targetUserId, isActive: true })
      .populate("followerId", "username profilePic bio followersCount followingCount")
      .lean();

    const followers = follows.map(f => f.followerId).filter(u => u != null);
    res.status(200).json(followers);
  } catch (err) {
    console.error("getFollowers error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const posts = await FeedService.getUserFeed(req.userId, page, limit);

    return res.status(200).json({ posts });
  } catch (err) {
    console.error("Feed error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const targetUserId = req.params.id || req.userId;
    const follows = await Follow.find({ followerId: targetUserId, isActive: true })
      .populate("followingId", "username profilePic bio followersCount followingCount")
      .lean();


    const following = follows.map(f => f.followingId).filter(u => u != null);

    console.log(following);
    res.status(200).json(following);
  } catch (err) {
    console.error("getFollowing error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};