import { verifyAccessToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../utils/errors.js';
import { query } from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyAccessToken(token);

    // Check if user exists and is active
    const result = await query(
      'SELECT id, username, email FROM users WHERE id = $1 AND deleted_at IS NULL',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedError('User not found or inactive');
    }

    // Attach user to request
    req.user = {
      id: result.rows[0].id,
      username: result.rows[0].username,
      email: result.rows[0].email,
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return res.status(401).json({
        success: false,
        message: error.message,
        code: 'UNAUTHORIZED',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      code: 'UNAUTHORIZED',
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    const result = await query(
      'SELECT id, username, email FROM users WHERE id = $1 AND deleted_at IS NULL',
      [decoded.userId]
    );

    req.user = result.rows.length > 0 ? result.rows[0] : null;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};