import { Router } from "express";
import { isLoggedIn, isOwner } from "../middleware.js";
import { createPost } from "../controllers/post.js";


const postRouter = Router();

postRouter.post("/create", isLoggedIn, createPost);



export default postRouter;