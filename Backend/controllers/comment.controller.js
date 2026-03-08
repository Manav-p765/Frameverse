import Comment from '../models/comment.js';
import Post from '../models/post.js';
import EngagementService from '../services/engagementService.js';
import Notification from '../models/notification.js';

export const createComment = async (req, res) => {
    try {
        const { postId, text, parentComment } = req.body;
        const userId = req.userId;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ message: "Comment text is required" });
        }

        const newComment = new Comment({
            postId,
            userId,
            text: text.trim(),
            parentComment: parentComment || null
        });

        await newComment.save();

        // Update Post comment count
        const post = await Post.findByIdAndUpdate(
            postId,
            { $inc: { commentCount: 1 } },
            { new: true }
        );

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Track engagement
        await EngagementService.trackEngagement(postId, 'comments', 1);

        // Populate user info for the response
        await newComment.populate('userId', 'username profilePic');

        // Emit live update
        const io = req.app.get("io");
        if (io) {
            io.emit("postCommented", {
                postId,
                commentCount: post.commentCount,
                comment: newComment
            });
        }

        // Notification to post owner
        if (post.owner.toString() !== userId.toString()) {
            try {
                const notif = await Notification.findOneAndUpdate(
                    {
                        recipient: post.owner,
                        sender: userId,
                        type: 'comment',
                        post: postId
                    },
                    { read: false },
                    { upsert: true, new: true }
                );

                const populatedNotif = await notif.populate('sender', 'username profilePic');
                if (io) {
                    io.to(post.owner.toString()).emit("new-notification", populatedNotif);
                }
            } catch (notifErr) {
                console.error("Comment notification error:", notifErr);
            }
        }

        return res.status(201).json(newComment);
    } catch (err) {
        console.error("Create comment error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getPostComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;

        const comments = await Comment.find({ postId })
            .populate('userId', 'username profilePic')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        return res.status(200).json(comments);
    } catch (err) {
        console.error("Get comments error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.userId;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // Check ownership or admin (placeholder for admin)
        if (comment.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const postId = comment.postId;
        await Comment.findByIdAndDelete(commentId);

        // Update Post comment count
        const post = await Post.findByIdAndUpdate(
            postId,
            { $inc: { commentCount: -1 } },
            { new: true }
        );

        // Track engagement
        await EngagementService.trackEngagement(postId, 'comments', -1);

        // Emit live update
        const io = req.app.get("io");
        if (io) {
            io.emit("commentDeleted", {
                postId,
                commentId,
                commentCount: post ? post.commentCount : 0
            });
        }

        return res.status(200).json({ message: "Comment deleted" });
    } catch (err) {
        console.error("Delete comment error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
