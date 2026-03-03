import express from 'express';
import authCommands from '../commands/auth.commands.js';
import { validate } from '../utils/validators.js';
import { registerSchema, loginSchema } from '../utils/validators.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimit.middleware.js';

const router = express.Router();


router.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  async (req, res, next) => {
    try {
      const { username, email, password, bio } = req.body;
      
      const result = await authCommands.register({
        username,
        email,
        password,
        bio,
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);


router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      
      const result = await authCommands.login({ email, password });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);


router.post('/logout', authenticate, async (req, res, next) => {
  try {
    await authCommands.logout(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
});


router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    const result = await authCommands.refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/me', authenticate, async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;