import express from 'express';
import { createComment, getPostComments, deleteComment } from '../controllers/comment.controller.js';
import { isLoggedIn } from '../middleware.js';

const router = express.Router();

router.post('/create', isLoggedIn, createComment);
router.get('/post/:postId', getPostComments);
router.delete('/:commentId', isLoggedIn, deleteComment);

export default router;
