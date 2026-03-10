import express from "express";
import { getSuggestedUsers } from "../controllers/recommendationController.js";
import { isLoggedIn } from "../middleware.js";

const router = express.Router();

router.get("/users", isLoggedIn, getSuggestedUsers);

export default router;
