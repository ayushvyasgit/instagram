import express from 'express';
import likeCommands from '../commands/like.commands.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { apiRateLimiter } from '../middleware/rateLimit.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/likes/post/:postId
 * @desc    Like a post
 * @access  Private
 */
router.post('/post/:postId', authenticate, apiRateLimiter, async (req, res, next) => {
  try {
    const result = await likeCommands.likePost(req.user.id, req.params.postId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/likes/post/:postId
 * @desc    Unlike a post
 * @access  Private
 */
router.delete('/post/:postId', authenticate, async (req, res, next) => {
  try {
    const result = await likeCommands.unlikePost(req.user.id, req.params.postId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/likes/comment/:commentId
 * @desc    Like a comment
 * @access  Private
 */
router.post('/comment/:commentId', authenticate, apiRateLimiter, async (req, res, next) => {
  try {
    const result = await likeCommands.likeComment(req.user.id, req.params.commentId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/likes/comment/:commentId
 * @desc    Unlike a comment
 * @access  Private
 */
router.delete('/comment/:commentId', authenticate, async (req, res, next) => {
  try {
    const result = await likeCommands.unlikeComment(req.user.id, req.params.commentId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
});

export default router;