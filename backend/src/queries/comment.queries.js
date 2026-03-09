import commentRepository from '../repositories/comment.repository.js';
import { cacheService } from '../config/redis.js';

export class CommentQueries {
  async getPostComments(postId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    // Try cache
    const cacheKey = `comments:post:${postId}:page:${page}:limit:${limit}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Query database
    const comments = await commentRepository.findByPostId(postId, limit, offset);

    // Cache for 5 minutes
    await cacheService.set(cacheKey, comments, 300);

    return comments;
  }

  async getCommentReplies(commentId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    // Try cache
    const cacheKey = `comments:replies:${commentId}:page:${page}:limit:${limit}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Query database
    const replies = await commentRepository.findReplies(commentId, limit, offset);

    // Cache for 5 minutes
    await cacheService.set(cacheKey, replies, 300);

    return replies;
  }
}

export default new CommentQueries();