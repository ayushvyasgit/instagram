import express from 'express';
import postCommands from '../commands/post.commands.js';
import postQueries from '../queries/post.queries.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload, handleUploadError } from '../middleware/upload.middleware.js';
import { apiRateLimiter, uploadRateLimiter } from '../middleware/rateLimit.middleware.js';
import { validate } from '../utils/validators.js';
import { createPostSchema } from '../utils/validators.js';

const router = express.Router();

/**
 * @route   POST /api/posts
 * @desc    Create a new post
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  uploadRateLimiter,
  upload.array('media', 10), // Max 10 files
  handleUploadError,
  async (req, res, next) => {
    try {
      const { caption, mediaType } = req.body;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one media file is required',
        });
      }

      const post = await postCommands.createPost({
        userId: req.user.id,
        caption,
        files,
        mediaType,
      });

      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: { post },
      });
    } catch (error) {
      console.error('Error creating post:', error);
      next(error);
    }
  }
);

/**
 * @route   GET /api/posts/:id
 * @desc    Get a single post
 * @access  Public
 */
router.get('/:id', apiRateLimiter, async (req, res, next) => {
  try {
    const post = await postQueries.getPostById(req.params.id);

    res.status(200).json({
      success: true,
      data: { post },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/posts/user/:userId
 * @desc    Get user's posts
 * @access  Public
 */
router.get('/user/:userId', apiRateLimiter, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const posts = await postQueries.getUserPosts(
      req.params.userId,
      parseInt(page),
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: posts.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/posts/feed
 * @desc    Get personalized feed
 * @access  Private
 */
router.get('/', authenticate, apiRateLimiter, async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await postQueries.getFeed(
      req.user.id,
      parseInt(page),
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: {
        posts: result.posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          hasMore: (parseInt(page) * parseInt(limit)) < result.total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a post
 * @access  Private
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await postCommands.deletePost(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
});

export default router;