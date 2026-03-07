import { Router } from "express";
import { isLoggedIn, isOwner, validatepost } from "../middleware.js";
import { createPost, deletePost, getExplorePosts, getPostById, likePost, updatePost, sharePost, addComment } from "../controllers/post.js";
import { upload } from "../config/multer.js";
import { verifyRecaptcha } from "../controllers/recaptca.js";
import { engagementLimiter } from "../config/rateLimit.js";

const postRouter = Router();

postRouter.get("/explore", isLoggedIn, getExplorePosts);
postRouter.get("/:postId", isLoggedIn, (req, res, next) => {
    // We'll use the controller we're about to add
    return getPostById(req, res, next);
});
postRouter.post("/create", isLoggedIn, upload.single("image"), verifyRecaptcha, createPost);

postRouter.delete("/:postId", isLoggedIn, isOwner, deletePost);

postRouter.post("/:postId/like", isLoggedIn, engagementLimiter, likePost);
postRouter.post("/:postId/share", isLoggedIn, engagementLimiter, sharePost);
postRouter.post("/:postId/comment", isLoggedIn, engagementLimiter, addComment);
postRouter.get("/:postId/comments", isLoggedIn, (req, res) => res.json([])); // Placeholder

postRouter.put("/:postId", isLoggedIn, isOwner, validatepost, updatePost);

export default postRouter;