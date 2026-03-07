import { Router } from "express";
import { isLoggedIn, isOwner, validatepost } from "../middleware.js";
import { createPost, deletePost, getExplorePosts, likePost, updatePost, sharePost, addComment } from "../controllers/post.js";
import { upload } from "../config/multer.js";
import { verifyRecaptcha } from "../controllers/recaptca.js";
import { engagementLimiter } from "../config/rateLimit.js";

const postRouter = Router();

postRouter.get("/explore", isLoggedIn, getExplorePosts);
postRouter.post("/create", isLoggedIn, verifyRecaptcha, upload.single("image"), createPost);

postRouter.delete("/posts/:id", isLoggedIn, isOwner, deletePost);

postRouter.post("/:postId/like", isLoggedIn, engagementLimiter, likePost);
postRouter.post("/:postId/share", isLoggedIn, engagementLimiter, sharePost);
postRouter.post("/:postId/comment", isLoggedIn, engagementLimiter, addComment);
postRouter.get("/:postId/comments", isLoggedIn, (req, res) => res.json([])); // Placeholder

postRouter.post("/update/:id", isLoggedIn, isOwner, validatepost, updatePost);

export default postRouter;