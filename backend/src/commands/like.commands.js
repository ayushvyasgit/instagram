import likeRepository from '../repositories/like.repository.js';
import postRepository from '../repositories/post.repository.js';
import commentRepository from '../repositories/comment.repository.js';
import { publishEvent, TOPICS } from '../config/kafka.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { cacheService } from '../config/redis.js';

export class LikeCommands {
  async likePost(userId, postId) {
    // Verify post exists
    const post = await postRepository.findById(postId);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    // Check if already liked
    const alreadyLiked = await likeRepository.hasUserLikedPost(userId, postId);
    if (alreadyLiked) {
      throw new ConflictError('Post already liked');
    }

    // Add like
    const like = await likeRepository.likePost(userId, postId);

    // Publish event
    await publishEvent(TOPICS.LIKE_ADDED, {
      type: 'LIKE_ADDED',
      aggregateId: like.id,
      data: {
        likeId: like.id,
        userId,
        postId,
        targetType: 'post',
        createdAt: like.created_at,
      },
      timestamp: new Date().toISOString(),
    });

    // Invalidate caches
    await cacheService.del(`post:${postId}`);
    await cacheService.delPattern(`feed:*`);

    return { success: true, message: 'Post liked successfully' };
  }

  async unlikePost(userId, postId) {
    // Check if liked
    const hasLiked = await likeRepository.hasUserLikedPost(userId, postId);
    if (!hasLiked) {
      throw new NotFoundError('Like not found');
    }

    // Remove like
    await likeRepository.unlikePost(userId, postId);
 
    // Publish event
    await publishEvent(TOPICS.LIKE_REMOVED, {
      type: 'LIKE_REMOVED',
      aggregateId: `${userId}-${postId}`,
      data: {
        userId,
        postId,
        targetType: 'post',
        removedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

    // Invalidate caches
    await cacheService.del(`post:${postId}`);
    await cacheService.delPattern(`feed:*`);

    return { success: true, message: 'Post unliked successfully' };
  }

  async likeComment(userId, commentId) {
    // Verify comment exists
    const comment = await commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    // Check if already liked
    const alreadyLiked = await likeRepository.hasUserLikedComment(
      userId,
      commentId
    );
    if (alreadyLiked) {
      throw new ConflictError('Comment already liked');
    }

    // Add like
    const like = await likeRepository.likeComment(userId, commentId);

    // Publish event
    await publishEvent(TOPICS.LIKE_ADDED, {
      type: 'LIKE_ADDED',
      aggregateId: like.id,
      data: {
        likeId: like.id,
        userId,
        commentId,
        targetType: 'comment',
        createdAt: like.created_at,
      },
      timestamp: new Date().toISOString(),
    });

    // Invalidate cache
    await cacheService.del(`comment:${commentId}`);

    return { success: true, message: 'Comment liked successfully' };
  }

  async unlikeComment(userId, commentId) {
    // Check if liked
    const hasLiked = await likeRepository.hasUserLikedComment(
      userId,
      commentId
    );
    if (!hasLiked) {
      throw new NotFoundError('Like not found');
    }

    // Remove like
    await likeRepository.unlikeComment(userId, commentId);

    // Publish event
    await publishEvent(TOPICS.LIKE_REMOVED, {
      type: 'LIKE_REMOVED',
      aggregateId: `${userId}-${commentId}`,
      data: {
        userId,
        commentId,
        targetType: 'comment',
        removedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

    // Invalidate cache
    await cacheService.del(`comment:${commentId}`);

    return { success: true, message: 'Comment unliked successfully' };
  }
}

export default new LikeCommands();