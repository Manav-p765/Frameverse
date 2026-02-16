import { Router } from "express";
import { validateuser, isLoggedIn, verifyToken } from "../middleware.js";
import wrapAsync from "../utils/wrapAsync.js";
import {upload} from "../config/multer.js";
import { getFeed,followUser, getUserProfile, loginUser, logoutUser, registerUser, searchUsers, updateUserProfile, unfollowUser, authMe } from "../controllers/user.js";

const router = Router({ mergeParams: true });

router.get("/profile", isLoggedIn, wrapAsync(getUserProfile));

router.get("/profile/:id", verifyToken, getUserProfile);

router.post("/register", validateuser, wrapAsync(registerUser));

router.post("/login", wrapAsync(loginUser));

router.post("/logout", isLoggedIn, logoutUser);

router.get("/search", wrapAsync(searchUsers));

router.put("/updateProfile", isLoggedIn, validateuser,  upload.single("profilePic"), wrapAsync(updateUserProfile));

router.post("/follow/:id", isLoggedIn, followUser);

router.post("/unfollow/:id", isLoggedIn, unfollowUser);

router.get("/feed",isLoggedIn, getFeed);

router.get("/auth/me", isLoggedIn, verifyToken, authMe);

export default router;
