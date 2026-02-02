import { Router } from "express";
import { isLoggedIn, isOwner } from "../middleware.js";
import { createPost, getFeed } from "../controllers/post.js";
import post from "../models/post.js";

const postRouter = Router();

postRouter.post("/create", isLoggedIn, createPost);

postRouter.get("/feed", isLoggedIn, getFeed);

export default postRouter;