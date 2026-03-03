import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AuthCommands } from './auth.commands.js';
import userRepository from '../repositories/user.repository.js';
import { ConflictError, UnauthorizedError } from '../utils/errors.js';

jest.mock('../repositories/user.repository.js');
jest.mock('../config/redis.js');

describe('Auth Commands', () => {
  let authCommands;

  beforeEach(() => {
    authCommands = new AuthCommands();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        bio: 'Test bio',
      };

      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.findByUsername.mockResolvedValue(null);
      userRepository.createUser.mockResolvedValue({
        id: '123',
        username: userData.username,
        email: userData.email,
        bio: userData.bio,
        profile_picture_url: null,
        created_at: new Date(),
      });

      const result = await authCommands.register(userData);

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.username).toBe(userData.username);
    });

    it('should throw error if email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue({ id: '123' });

      await expect(
        authCommands.register({
          username: 'test',
          email: 'existing@example.com',
          password: 'password',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should throw error if username already exists', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.findByUsername.mockResolvedValue({ id: '123' });

      await expect(
        authCommands.register({
          username: 'existinguser',
          email: 'new@example.com',
          password: 'password',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const user = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed',
      };

      userRepository.findByEmail.mockResolvedValue(user);
      userRepository.verifyPassword.mockResolvedValue(true);

      const result = await authCommands.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error for invalid email', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authCommands.login({
          email: 'nonexistent@example.com',
          password: 'password',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw error for invalid password', async () => {
      userRepository.findByEmail.mockResolvedValue({ id: '123' });
      userRepository.verifyPassword.mockResolvedValue(false);

      await expect(
        authCommands.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});