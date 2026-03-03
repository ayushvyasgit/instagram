import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { apiRateLimiter } from '../middleware/rateLimit.middleware.js';
import userRepository from '../repositories/user.repository.js';

const router = express.Router();

/**
 * @route   GET /api/users/search?q=username
 * @desc    Search users by username
 * @access  Private
 */
router.get('/search', authenticate, apiRateLimiter, async (req, res, next) => {
  try {
    const { q = '' } = req.query;
    
    if (!q || q.length < 1) {
      return res.status(200).json({
        success: true,
        data: { users: [] },
      });
    }

    const users = await userRepository.searchUsers(q, 20);

    res.status(200).json({
      success: true,
      data: { users },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get user profile by ID
 * @access  Private
 */
router.get('/:id', authenticate, apiRateLimiter, async (req, res, next) => {
  try {
    const user = await userRepository.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const stats = await userRepository.getUserStats(req.params.id);
    res.status(200).json({
      success: true,
      data: { user: { ...user, ...stats } },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
