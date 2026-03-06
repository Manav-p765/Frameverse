import { Router } from "express";
import { isLoggedIn, isOwner } from "../middleware.js";
import { createPost, deletePost, getExplorePosts, likePost, updatePost } from "../controllers/post.js";
import { upload } from "../config/multer.js"


const postRouter = Router();

postRouter.get("/explore", isLoggedIn, getExplorePosts);

import { verifyRecaptcha } from "../controllers/recaptca.js";
postRouter.post("/create", isLoggedIn, verifyRecaptcha, upload.single("image"), createPost);

postRouter.delete("/posts/:id", isLoggedIn, isOwner, deletePost);

postRouter.post("/:postId/like", isLoggedIn, likePost);

postRouter.post("/update/:id", isLoggedIn, isOwner, updatePost);



export default postRouter;