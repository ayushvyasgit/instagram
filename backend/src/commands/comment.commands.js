import commentRepository from '../repositories/comment.repository.js';
import postRepository from '../repositories/post.repository.js';
import { publishEvent, TOPICS } from '../config/kafka.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { cacheService } from '../config/redis.js';

export class CommentCommands {
  async createComment({ postId, userId, content, parentId = null }) {
    // Verify post exists
    const post = await postRepository.findById(postId);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    // Create comment
    const comment = await commentRepository.createComment({
      postId,
      userId,
      content,
      parentId,
    });

    // Publish event
    await publishEvent(TOPICS.COMMENT_CREATED, {
      type: 'COMMENT_CREATED',
      aggregateId: comment.id,
      data: {
        commentId: comment.id,
        postId: comment.post_id,
        userId: comment.user_id,
        parentId: comment.parent_id,
        content: comment.content,
        depth: comment.depth,
        createdAt: comment.created_at,
      },
      timestamp: new Date().toISOString(),
    });

    // Invalidate caches
    await cacheService.delPattern(`comments:post:${postId}:*`);
    if (parentId) {
      await cacheService.delPattern(`comments:replies:${parentId}:*`);
    }

    return comment;
  }

  async updateComment(commentId, userId, content) {
    // Find comment
    const comment = await commentRepository.findById(commentId);
    
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    if (comment.user_id !== userId) {
      throw new ForbiddenError('You can only update your own comments');
    }

    // Update comment
    const updatedComment = await commentRepository.updateComment(
      commentId,
      userId,
      content
    );

    // Publish event
    await publishEvent(TOPICS.COMMENT_UPDATED, {
      type: 'COMMENT_UPDATED',
      aggregateId: commentId,
      data: {
        commentId,
        userId,
        content,
        updatedAt: updatedComment.updated_at,
      },
      timestamp: new Date().toISOString(),
    });

    // Invalidate caches
    await cacheService.del(`comment:${commentId}`);
    await cacheService.delPattern(`comments:post:${comment.post_id}:*`);

    return updatedComment;
  }

  async deleteComment(commentId, userId) {
    // Find comment
    const comment = await commentRepository.findById(commentId);
    
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    if (comment.user_id !== userId) {
      throw new ForbiddenError('You can only delete your own comments');
    }

    // Delete comment
    const deleted = await commentRepository.deleteComment(commentId, userId);

    // Publish event
    await publishEvent(TOPICS.COMMENT_DELETED, {
      type: 'COMMENT_DELETED',
      aggregateId: commentId,
      data: {
        commentId,
        postId: comment.post_id,
        userId,
        parentId: deleted.parent_id,
        deletedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

    // Invalidate caches
    await cacheService.del(`comment:${commentId}`);
    await cacheService.delPattern(`comments:post:${comment.post_id}:*`);

    return { success: true, message: 'Comment deleted successfully' };
  }
}

export default new CommentCommands();