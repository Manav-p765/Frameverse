import Post from "../models/post.js";
import User from "../models/user.js";


export const createPost = async (req, res) => {
    const { description, imageUrl, imagePublicId } = req.body;

    try {
        const newPost = new Post({
            owner: req.userId,
            description,
            image: {
                url: imageUrl,
                public_id: imagePublicId
            }
        });

        await User.findByIdAndUpdate(req.userId, {
            $push: { posts: newPost._id },
        });
        await newPost.save();
        res.status(201).json({ message: "Post created successfully", post: newPost });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // 🔐 Check ownership
    if (post.user.toString() !== req.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Delete post
    await post.deleteOne();

    // Remove post reference from user
    await User.findByIdAndUpdate(req.userId, {
      $pull: { posts: postId },
    });

    res.status(200).json({ message: "Post deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};