import { Router } from "express";
import { isLoggedIn, isOwner} from "../middleware.js";
import { createPost, deletePost, likePost, updatePost } from "../controllers/post.js";
import { upload } from "../config/multer.js"


const postRouter = Router();

postRouter.post("/create", isLoggedIn,  upload.single("image"), createPost);

postRouter.delete("/posts/:id", isLoggedIn,isOwner, deletePost);

postRouter.post("/:postId/like", isLoggedIn, likePost);

postRouter.post("/update/:id", isLoggedIn, isOwner, updatePost);



export default postRouter;