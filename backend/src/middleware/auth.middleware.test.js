import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { authenticate, optionalAuth } from './auth.middleware.js';
import { generateAccessToken } from '../utils/jwt.js';
import * as db from '../config/database.js';

// Mock database
jest.mock('../config/database.js');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('authenticate', () => {
    it('should authenticate valid token and attach user to request', async () => {
      const token = generateAccessToken({ userId: '123', email: 'test@example.com' });
      req.headers.authorization = `Bearer ${token}`;

      db.query.mockResolvedValue({
        rows: [{ id: '123', username: 'testuser', email: 'test@example.com' }],
      });

      await authenticate(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe('123');
      expect(req.user.username).toBe('testuser');
      expect(next).toHaveBeenCalled();
    });

    it('should reject request without token', async () => {
      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'UNAUTHORIZED',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject token for non-existent user', async () => {
      const token = generateAccessToken({ userId: '999', email: 'fake@example.com' });
      req.headers.authorization = `Bearer ${token}`;

      db.query.mockResolvedValue({ rows: [] });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should attach user if valid token provided', async () => {
      const token = generateAccessToken({ userId: '123', email: 'test@example.com' });
      req.headers.authorization = `Bearer ${token}`;

      db.query.mockResolvedValue({
        rows: [{ id: '123', username: 'testuser', email: 'test@example.com' }],
      });

      await optionalAuth(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe('123');
      expect(next).toHaveBeenCalled();
    });

    it('should set user to null if no token provided', async () => {
      await optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });

    it('should set user to null if invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });
  });
});