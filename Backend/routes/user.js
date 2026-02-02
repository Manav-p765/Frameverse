import { Router } from "express";
import { validateuser, isLoggedIn } from "../middleware.js";
import wrapAsync from "../utils/wrapAsync.js";
import { followUser, getUserProfile, loginUser, logoutUser, registerUser, searchUsers, updateUserProfile, unfollowUser } from "../controllers/user.js";

const router = Router({ mergeParams: true });

router.get("/profile", isLoggedIn, wrapAsync(getUserProfile));

router.post("/register", validateuser, wrapAsync(registerUser));

router.post("/login", wrapAsync(loginUser));

router.post("/logout", isLoggedIn, logoutUser);

router.get("/search", wrapAsync(searchUsers));

router.put("/updateProfile", isLoggedIn, validateuser, wrapAsync(updateUserProfile));

router.post("/follow/:id", isLoggedIn, followUser);

router.post("/unfollow/:id", isLoggedIn, unfollowUser);

export default router;
