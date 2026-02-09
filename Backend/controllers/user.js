import User from "../models/user.js";
import {sendToken} from "../utils/sendToken.js";
import bcrypt from "bcrypt";
import Post from "../models/post.js";
import mongoose from "mongoose";

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id || req.userId; // 👈 key line

    const user = await User.findById(userId)
      .populate("avatar")
      .populate("posts");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // OPTIONAL pre-check (nice UX, not mandatory)
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    const user = await User.create({
      username,
      email,
      password,
    });

    sendToken(user, res, 201, "User created");
    res.status(201).json({ message: "User created" });

  } catch (err) {
    // 🔥 HANDLE DUPLICATE KEY ERROR PROPERLY
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];


      return res.status(409).json({
        field,
        message: `${field} already exists`,
      });
    }

    // other errors
    next(err);
  }
};


export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

     return sendToken(user, res, 200, "Login successful");
};

export const logoutUser = (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out" });
};


export const searchUsers = async (req, res) => {
    const q = String(req.query.q || "");

    if (!q.trim()) return res.json([]);

    const users = await User.find({
        _id: { $ne: req.userId },
        $or: [
            { username: { $regex: "^" + q, $options: "i" } }
        ]
    });
    res.status(200).json(users);
};

export const updateUserProfile = async (req, res) => {
  try {
    const updates = { ...req.body };

    delete updates.password;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Dynamically update only provided fields
    Object.keys(updates).forEach((key) => {
      user[key] = updates[key];
    });

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const followUser = async (req, res) => {
  const userId = req.user;          
  const targetUserId = req.params.id; 

  // can't follow yourself (narcissism check)
  if (userId === targetUserId) {
    return res.status(400).json({ message: "You can't follow yourself" });
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    return res.status(404).json({ message: "User not found" });
  }

  // already following
  if (targetUser.followers.includes(userId)) {
    return res.status(400).json({ message: "Already following this user" });
  }

  // follow
  await User.findByIdAndUpdate(userId, {
    $push: { following: targetUserId },
  });

  await User.findByIdAndUpdate(targetUserId, {
    $push: { followers: userId },
  });

  res.status(200).json({ message: "User followed successfully" });
};

export const unfollowUser = async (req, res) => {
  const userId = req.user;           // me
  const targetUserId = req.params.id; // them

  // can't unfollow yourself
  if (userId === targetUserId) {
    return res.status(400).json({ message: "You can't unfollow yourself" });
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    return res.status(404).json({ message: "User not found" });
  }

  // not following already
  if (!targetUser.followers.includes(userId)) {
    return res.status(400).json({ message: "You are not following this user" });
  }

  // unfollow
  await User.findByIdAndUpdate(userId, {
    $pull: { following: targetUserId },
  });

  await User.findByIdAndUpdate(targetUserId, {
    $pull: { followers: userId },
  });

  res.status(200).json({ message: "User unfollowed successfully" });
};


export const getFeed = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("following");

    // Convert following IDs to ObjectId
    const followingIds = user.following.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    const feed = await Post.aggregate([
      // Add priority (followed users first)
      {
        $addFields: {
          priority: {
            $cond: [
              { $in: ["$owner", followingIds] },
              1,
              0,
            ],
          },
        },
      },

      // Sort: followed users → latest posts
      {
        $sort: {
          priority: -1,
          createdAt: -1,
        },
      },

      // Limit feed
      { $limit: 50 },

      // Populate owner (IMPORTANT)
      {
        $lookup: {
          from: "users", // collection name
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },

      // Convert owner array → object
      {
        $unwind: "$owner",
      },

      // Security: remove sensitive fields
      {
        $project: {
          "owner.password": 0,
          "owner.email": 0,
          "owner.__v": 0,
        },
      },
    ]);

    res.json(feed);
  } catch (err) {
    console.error("Feed error:", err);
  }
};