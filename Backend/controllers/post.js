import Post from "../models/post.js";
import User from "../models/user.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

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

    await newPost.populate("owner", "username profilePicture");

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


export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await Post.findOneAndUpdate(
      {
        _id: postId,
        likes: { $ne: userId },
      },
      { $push: { likes: userId } },
      { new: true }
    );

    console.log(post)

    if (post) {
      return res.status(200).json({
        liked: true,
        likesCount: post.likes.length,
      });
    }

    const updatedPost = await Post.findOneAndUpdate(
      { _id: postId },
      { $pull: { likes: userId } },
      { new: true }
    );

    console.log('liked added');
    res.status(200).json({
      liked: false,
      likesCount: updatedPost.likes.length,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updatePost = async (req, res) => {
  const { postId } = req.params;
  const { description, location, imageUrl, imagePublicId } = req.body;
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
    if (imageUrl && imagePublicId) {
      // Delete old image from Cloudinary if it exists
      if (post.image?.public_id) {
        try {
          await cloudinary.uploader.destroy(post.image.public_id);
          console.log(`Deleted old image: ${post.image.public_id}`);
        } catch (cloudinaryError) {
          console.error('Cloudinary deletion error:', cloudinaryError);
          // Continue with update even if deletion fails
        }
      }

      // Set new image
      updateData.image = {
        url: imageUrl,
        public_id: imagePublicId
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
    ).populate('owner', 'username profilePicture'); // Populate owner details

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
  const { id } = req.params;
  const userId = req.userId;

  try {
    const post = await Post.findOne({ _id: id, owner: userId });

    if (!post) {
      return res.status(404).json({
        message: "Post not found or unauthorized",
      });
    }

    // Delete image from Cloudinary
    if (post.image?.public_id) {
      await deleteFromCloudinary(post.image.public_id);
    }

    // Remove post reference from user
    await User.findByIdAndUpdate(userId, {
      $pull: { posts: id },
    });

    // Delete post
    await Post.deleteOne({ _id: id });

    res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (err) {
    console.error("Delete post error:", err);

    res.status(500).json({
      message: "Server error while deleting post",
    });
  }
};
