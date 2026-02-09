import { Router } from "express";
import { isLoggedIn, isOwner, verifyToken } from "../middleware.js";
import { createPost, deletePost } from "../controllers/post.js";


const postRouter = Router();

postRouter.post("/create", isLoggedIn, createPost);

postRouter.delete("/posts/:id", verifyToken,isOwner, deletePost);



export default postRouter;