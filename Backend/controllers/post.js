import Post from "../models/post.js";
import User from "../models/user.js";
import Notification from "../models/notification.js";
import Comment from "../models/comment.js";
import Like from "../models/like.js";
import mongoose from "mongoose";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";
import FeedService from "../services/feedService.js";

// ─── Explore: random posts ───────────────────────────────────────────────────
export const getExplorePosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;

    const posts = await Post.aggregate([
      { $sample: { size: limit } },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      { $unwind: "$owner" },
      {
        $addFields: {
          likeCount: { $size: "$likes" },
          commentCount: { $ifNull: ["$commentCount", 0] },
          sharesCount: { $ifNull: ["$sharesCount", 0] },
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

    return res.status(200).json({ posts });
  } catch (err) {
    console.error("Explore error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId)
      .populate("owner", "username profilePic followersCount followingCount")
      .lean();

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const result = {
      ...post,
      likedByCurrentUser: req.userId ? post.likes.some(id => id.toString() === req.userId.toString()) : false,
      likeCount: post.likes.length,
    };

    return res.status(200).json(result);
  } catch (err) {
    console.error("GetPostById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


export const createPost = async (req, res) => {
  try {
    const { description, location } = req.body;

    if (!req.file) {
      return res.status(400).json({
        message: "Image is required",
      });
    }

    // Upload image to Cloudinary
    const uploaded = await uploadToCloudinary(req.file.path);

    const newPost = new Post({
      owner: req.userId,
      description: description?.trim() || "",
      location: location?.trim() || "",
      image: {
        url: uploaded.url,
        public_id: uploaded.public_id,
      },
    });

    await newPost.save();

    await User.findByIdAndUpdate(req.userId, {
      $push: { posts: newPost._id },
    });

    await newPost.populate("owner", "username profilePic");

    // ── Notification: "X shared a new post" to all followers ──
    try {
      const poster = await User.findById(req.userId).select("followers");
      if (poster?.followers?.length) {
        const io = req.app.get("io");
        const notifDocs = poster.followers.map((followerId) => ({
          recipient: followerId,
          sender: req.userId,
          type: "new_post",
          post: newPost._id,
        }));
        const created = await Notification.insertMany(notifDocs, { ordered: false }).catch(() => []);
        // Emit to each follower's socket room
        for (const notif of created) {
          const populated = await notif.populate("sender", "username profilePic");
          await populated.populate("post", "image description");
          io.to(notif.recipient.toString()).emit("new-notification", populated);
        }
        // Invalidate following's feed caches asynchronously
        FeedService.invalidateFollowersFeeds(req.userId);
      }
    } catch (notifErr) {
      console.error("New post notif error:", notifErr);
    }

    res.status(201).json({
      message: "Post created successfully",
      post: newPost,
    });
  } catch (err) {
    console.error("Create post error:", err);

    res.status(500).json({
      message: "Server error while creating post",
    });
  }
};


import EngagementService from "../services/engagementService.js";

export const likePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const result = await EngagementService.toggleLike(req.userId, postId);

    // Emit live update
    const io = req.app.get("io");
    if (io) {
      io.emit("postLiked", {
        postId,
        likeCount: result.likeCount,
      });
    }

    return res.status(200).json({
      liked: result.isLiked,
      likeCount: result.likeCount
    });
  } catch (err) {
    next(err);
  }
};

export const sharePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const post = await EngagementService.sharePost(req.userId, postId);

    // Emit live update
    const io = req.app.get("io");
    if (io) {
      io.emit("postShared", {
        postId,
        sharesCount: post.sharesCount,
      });
    }

    res.status(200).json({
      message: "Post shared successfully",
      sharesCount: post.sharesCount
    });
  } catch (err) {
    next(err);
  }
};


export const updatePost = async (req, res) => {
  const { postId } = req.params;
  const { description, location, image } = req.body;
  const userId = req.userId; // From auth middleware

  try {
    // Validate postId format
    if (!postId || !postId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: 'Invalid post ID format'
      });
    }

    // Find the post
    const post = await Post.findById(postId);

    // Check if post exists
    if (!post) {
      return res.status(404).json({
        message: 'Post not found'
      });
    }

    // Check ownership - only owner can update
    if (post.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        message: 'Unauthorized: You can only update your own posts'
      });
    }

    // Prepare update object
    const updateData = {};

    // Update description if provided
    if (description !== undefined) {
      updateData.description = description.trim();
    }

    // Update location if provided
    if (location !== undefined) {
      updateData.location = location.trim();
    }

    // Handle image update if new image is provided
    if (image && image.url && image.public_id) {
      // Delete old image from Cloudinary if it exists
      if (post.image?.public_id) {
        try {
          await deleteFromCloudinary(post.image.public_id);
          console.log(`Deleted old image: ${post.image.public_id}`);
        } catch (cloudinaryError) {
          console.error('Cloudinary deletion error:', cloudinaryError);
          // Continue with update even if deletion fails
        }
      }

      // Set new image
      updateData.image = {
        url: image.url,
        public_id: image.public_id
      };
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: 'No valid fields provided for update'
      });
    }

    // Update the post
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $set: updateData },
      {
        new: true, // Return updated document
        runValidators: true // Run schema validators
      }
    ).populate('owner', 'username profilePic'); // Populate owner details

    res.status(200).json({
      message: 'Post updated successfully',
      post: updatedPost
    });

  } catch (err) {
    console.error('Update post error:', err);

    // Handle specific errors
    if (err.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid post ID format'
      });
    }

    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(err.errors).map(e => e.message)
      });
    }

    res.status(500).json({
      message: 'Server error while updating post',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};


export const deletePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.userId;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const post = await Post.findOne({ _id: postId, owner: userId }).session(session);

    if (!post) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        message: "Post not found or unauthorized",
      });
    }

    // Delete image from Cloudinary
    if (post.image?.public_id) {
      try {
        await deleteFromCloudinary(post.image.public_id);
      } catch (cloudinaryErr) {
        console.error("Cloudinary delete error during post deletion:", cloudinaryErr);
        // Continue anyway as database consistency is prioritized
      }
    }

    // Parallel cleanup using transaction session
    await Promise.all([
      // Remove post reference from user
      User.findByIdAndUpdate(userId, { $pull: { posts: postId } }).session(session),
      // Delete all comments
      Comment.deleteMany({ postId }).session(session),
      // Delete all likes
      Like.deleteMany({ postId }).session(session),
      // Delete all notifications related to this post
      Notification.deleteMany({ post: postId }).session(session),
      // Delete the post itself
      Post.deleteOne({ _id: postId }).session(session)
    ]);

    await session.commitTransaction();
    session.endSession();

    // Invalidate caches
    FeedService.invalidateFeed(userId);
    FeedService.invalidateFollowersFeeds(userId);

    res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Delete post error:", err);

    res.status(500).json({
      message: "Server error while deleting post",
    });
  }
};
