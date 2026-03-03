import express from 'express';
import commentCommands from '../commands/comment.commands.js';
import commentQueries from '../queries/comment.queries.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { apiRateLimiter } from '../middleware/rateLimit.middleware.js';
import { validate } from '../utils/validators.js';
import { createCommentSchema } from '../utils/validators.js';

const router = express.Router();

/**
 * @route   POST /api/comments
 * @desc    Create a comment
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  apiRateLimiter,
  validate(createCommentSchema),
  async (req, res, next) => {
    try {
      const { postId, content, parentId } = req.body;

      const comment = await commentCommands.createComment({
        postId,
        userId: req.user.id,
        content,
        parentId,
      });

      res.status(201).json({
        success: true,
        message: 'Comment created successfully',
        data: { comment },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/comments/post/:postId
 * @desc    Get comments for a post
 * @access  Public
 */
router.get('/post/:postId', apiRateLimiter, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const comments = await commentQueries.getPostComments(
      req.params.postId,
      parseInt(page),
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: comments.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/comments/:commentId/replies
 * @desc    Get replies to a comment
 * @access  Public
 */
router.get('/:commentId/replies', apiRateLimiter, async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const replies = await commentQueries.getCommentReplies(
      req.params.commentId,
      parseInt(page),
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: {
        replies,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: replies.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/comments/:id
 * @desc    Update a comment
 * @access  Private
 */
router.put(
  '/:id',
  authenticate,
  validate(createCommentSchema),
  async (req, res, next) => {
    try {
      const { content } = req.body;

      const comment = await commentCommands.updateComment(
        req.params.id,
        req.user.id,
        content
      );

      res.status(200).json({
        success: true,
        message: 'Comment updated successfully',
        data: { comment },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   DELETE /api/comments/:id
 * @desc    Delete a comment
 * @access  Private
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await commentCommands.deleteComment(
      req.params.id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
});

export default router;