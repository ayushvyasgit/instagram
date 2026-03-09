import { describe, it, expect } from '@jest/globals';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from './jwt.js';

describe('JWT Utilities', () => {
  const payload = { userId: '123', email: 'test@example.com' };

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(payload);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(payload);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = generateAccessToken(payload);
      const decoded = verifyAccessToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(payload);
      const decoded = verifyRefreshToken(token);
      expect(decoded.userId).toBe(payload.userId);
    });

    it('should throw error for invalid refresh token', () => {
      expect(() => verifyRefreshToken('invalid-token')).toThrow();
    });
  });
});