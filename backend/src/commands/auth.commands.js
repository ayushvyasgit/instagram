import userRepository from '../repositories/user.repository.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { ConflictError, UnauthorizedError } from '../utils/errors.js';
import { cacheService } from '../config/redis.js';

export class AuthCommands {
  async register({ username, email, password, bio }) {
    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const existingUsername = await userRepository.findByUsername(username);
    if (existingUsername) {
      throw new ConflictError('Username already taken');
    }

    // Create user
    const user = await userRepository.createUser({
      username,
      email,
      password,
      bio,
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
    });

    // Store refresh token in Redis (optional, for revocation)
    await cacheService.set(
      `refresh_token:${user.id}`,
      refreshToken,
      30 * 24 * 60 * 60 // 30 days
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profilePictureUrl: user.profile_picture_url,
        createdAt: user.created_at,
      },
      accessToken,
      refreshToken,
    };
  }

  async login({ email, password }) {
    // Find user
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await userRepository.verifyPassword(user, password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
    });

    // Store refresh token
    await cacheService.set(
      `refresh_token:${user.id}`,
      refreshToken,
      30 * 24 * 60 * 60
    );

    // Update last login (optional)
    // await userRepository.updateLastLogin(user.id);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profilePictureUrl: user.profile_picture_url,
      },
      accessToken,
      refreshToken,
    };
  }

  async logout(userId) {
    // Remove refresh token from Redis
    await cacheService.del(`refresh_token:${userId}`);
    return { success: true };
  }

  async refreshAccessToken(refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);
    
    // Verify refresh token in Redis
    const storedToken = await cacheService.get(`refresh_token:${decoded.userId}`);
    if (storedToken !== refreshToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Get user
    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    return { accessToken };
  }
}

export default new AuthCommands();