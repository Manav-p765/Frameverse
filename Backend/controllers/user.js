import User from "../models/user.js";
import { sendToken } from "../utils/sendToken.js";
import bcrypt from "bcrypt";
import Post from "../models/post.js";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id || req.userId;

    const user = await User.findById(userId)
      .populate("followers", "username bio avatar profilePic")
      .populate("following", "username bio avatar profilePic")
      .populate("posts").populate({
        path: "posts",
        populate: {
          path: "owner",
          select: "-password -email -__v"
        }
      }); // keep this if posts is ObjectId ref

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
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.setHeader("Cache-Control", "no-store");
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

    console.log(updates);

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "profile_pics",
        transformation: [
          { width: 500, height: 500, crop: "fill" }
        ]
      });

      updates.profilePic = result.secure_url;
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user,
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Username already exists",
      });
    }

    console.error(error);
    res.status(500).json({ message: error.message });
  }
};



export const followUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.userId;           // me
    const targetUserId = req.params.id;  // them

    // 🚫 narcissism prevention
    if (userId === targetUserId) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    const targetUser = await User.findById(targetUserId).session(session);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ FIXED: was using wrong variable `profile` (frontend var) and `currentUserId` (undefined)
    const alreadyFollowing = targetUser.followers.some(
      (id) => id.toString() === userId
    );

    if (alreadyFollowing) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Already following this user" });
    }

    // ✅ atomic updates
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { following: targetUserId } },
      { session }
    );
    await User.findByIdAndUpdate(
      targetUserId,
      { $addToSet: { followers: userId } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "User followed successfully",
      isFollowing: true,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Follow error:", err);
    return res.status(500).json({ message: "Follow failed" });
  }
};

export const unfollowUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.userId;
    const targetUserId = req.params.id;

    if (userId === targetUserId) {
      return res.status(400).json({ message: "You can't unfollow yourself" });
    }

    const targetUser = await User.findById(targetUserId).session(session);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ ObjectId-safe check
    const isFollowing = targetUser.followers.some(
      (id) => id.toString() === userId
    );

    if (!isFollowing) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "You are not following this user" });
    }

    // ✅ atomic updates
    await User.findByIdAndUpdate(
      userId,
      { $pull: { following: targetUserId } },
      { session }
    );
    await User.findByIdAndUpdate(
      targetUserId,
      { $pull: { followers: userId } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "User unfollowed successfully",
      isFollowing: false,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Unfollow error:", err);
    return res.status(500).json({ message: "Unfollow failed" });
  }
};

export const getFeed = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const depth = parseInt(req.query.depth) || 0;

    const user = await User.findById(req.userId).select("following");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const followingIds = user.following.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    const posts = await Post.aggregate([
      {
        $addFields: {
          priority: {
            $cond: [{ $in: ["$owner", followingIds] }, 1, 0],
          },
        },
      },
      {
        $sort: {
          priority: -1,
          createdAt: -1,
        },
      },
      {
        $skip: depth * limit,
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      {
        $unwind: "$owner",
      },
      {
        $addFields: {
          likesCount: { $size: "$likes" },
          likedByCurrentUser: {
            $in: [new mongoose.Types.ObjectId(req.userId), "$likes"],
          },
        },
      },
      {
        $project: {
          likes: 0,
          "owner.password": 0,
          "owner.email": 0,
          "owner.__v": 0,
        },
      },
    ]);

    return res.status(200).json({
      posts,
    });

  } catch (err) {
    console.error("Feed error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


export const authMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};