import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validateuser, isLoggedIn } from "../middleware.js";
import wrapAsync from "../utils/wrapAsync.js";
import { upload } from "../config/multer.js";
import {
  authMe,
  firebaseAuth,
  logoutUser,
  getFollowing,
  getFeed,
  followUser,
  getUserProfile,
  searchUsers,
  updateUserProfile,
  unfollowUser,
} from "../controllers/user.js";

const router = Router({ mergeParams: true });

// ─── Rate Limiters ────────────────────────────────────────────────────────────

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in 15 minutes." },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please slow down." },
});

// ─── Firebase Auth (all auth — email/password, Google, GitHub) ───────────────
import { verifyRecaptcha } from "../controllers/recaptca.js";

router.post("/auth/firebase", authLimiter, verifyRecaptcha, wrapAsync(firebaseAuth));
router.post("/auth/verify-recaptcha-only", authLimiter, verifyRecaptcha, (req, res) => res.status(200).json({ success: true }));
router.post("/logout", isLoggedIn, logoutUser);

// ─── Protected Routes ─────────────────────────────────────────────────────────

router.get("/auth/me", isLoggedIn, wrapAsync(authMe));
router.get("/profile", isLoggedIn, wrapAsync(getUserProfile));
router.get("/profile/:id", isLoggedIn, wrapAsync(getUserProfile));
router.get("/search", isLoggedIn, apiLimiter, wrapAsync(searchUsers));
router.get("/feed", isLoggedIn, apiLimiter, wrapAsync(getFeed));
router.get("/following", isLoggedIn, wrapAsync(getFollowing));

router.put(
  "/updateProfile",
  isLoggedIn,
  validateuser,
  upload.single("profilePic"),
  wrapAsync(updateUserProfile)
);

router.post("/follow/:id", isLoggedIn, wrapAsync(followUser));
router.post("/unfollow/:id", isLoggedIn, wrapAsync(unfollowUser));

export default router;