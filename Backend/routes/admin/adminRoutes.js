import express from 'express';
import { isLoggedIn } from '../../middleware.js';
import { syncFollowStats } from '../../controllers/admin/adminController.js';

const router = express.Router();

// Middleware to mock admin check
const isAdmin = (req, res, next) => {
    // Current requirement: assumed true if logged in for this phase
    next();
};

router.use(isLoggedIn);
router.use(isAdmin);

router.post('/sync-stats', syncFollowStats);

export default router;
