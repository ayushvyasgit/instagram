import postRepository from '../repositories/post.repository.js';
import { cacheService } from '../config/redis.js';
import { NotFoundError } from '../utils/errors.js';

export class PostQueries {
  async getPostById(postId, currentUserId = null) {
    // Try cache first
    const cacheKey = `post:${postId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Query database
    const post = await postRepository.findById(postId);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    // Increment view count (async)
    postRepository.incrementViewCount(postId).catch((err) => {
      console.error('Error incrementing view count:', err);
    });

    // Cache for 5 minutes
    await cacheService.set(cacheKey, post, 300);

    return post;
  }

  async getUserPosts(userId, page = 1, limit = 20, currentUserId = null) {
    const offset = (page - 1) * limit;
    
    // Try cache
    const cacheKey = `posts:user:${userId}:page:${page}:limit:${limit}:viewer:${currentUserId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Query database
    const posts = await postRepository.findByUserId(userId, limit, offset, currentUserId);
    const total = await postRepository.getUserPostCount(userId);

    const result = { posts, total };

    // Cache for 3 minutes
    await cacheService.set(cacheKey, result, 180);

    return result;
  }

  async getFeed(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    // Try cache
    const cacheKey = `feed:all:page:${page}:limit:${limit}:user:${userId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Query database - get ALL posts from all users
    const posts = await postRepository.getAllPosts(userId, limit, offset);
    const total = await postRepository.getTotalPostCount();

    const result = { posts, total };

    // Cache for 1 minute (feed changes frequently)
    await cacheService.set(cacheKey, result, 60);

    return result;
  }
}

export default new PostQueries();