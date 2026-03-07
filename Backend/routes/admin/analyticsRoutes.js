import express from 'express';
import { isLoggedIn } from '../../middleware.js';
import { analyticsLimiter } from '../../config/rateLimit.js';
import {
    getOverview,
    getUserGrowth,
    getMessageActivity,
    getTopUsers,
    getSystemHealth,
    getTrendingPosts,
    getPlatformActivity
} from '../../controllers/admin/analyticsController.js';

const router = express.Router();
router.use(analyticsLimiter);

// Middleware to mock admin check since User schema lacks an explicit role field
const isAdmin = (req, res, next) => {
    // Normally: if (req.user.role !== 'admin') throw Error...
    // For Frameverse current phase, we will assume true if logged in,
    // or you can restrict to a specific hardcoded ID here:
    next();
};

router.use(isLoggedIn);
router.use(isAdmin);

router.get('/overview', getOverview);
router.get('/trending', getTrendingPosts);
router.get('/platform-activity', getPlatformActivity);
router.get('/user-growth', getUserGrowth);
router.get('/message-activity', getMessageActivity);
router.get('/top-users', getTopUsers);
router.get('/system-health', getSystemHealth);

export default router;
