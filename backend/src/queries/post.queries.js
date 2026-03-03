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

  async getUserPosts(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    // Try cache
    const cacheKey = `posts:user:${userId}:page:${page}:limit:${limit}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Query database
    const posts = await postRepository.findByUserId(userId, limit, offset);

    // Cache for 3 minutes
    await cacheService.set(cacheKey, posts, 180);

    return posts;
  }

  async getFeed(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    // Try cache
    const cacheKey = `feed:${userId}:page:${page}:limit:${limit}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Query database
    const posts = await postRepository.getFeed(userId, limit, offset);

    // Cache for 3 minutes (feed changes frequently)
    await cacheService.set(cacheKey, posts, 180);

    return posts;
  }
}

export default new PostQueries();