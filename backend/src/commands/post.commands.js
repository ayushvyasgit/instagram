import postRepository from '../repositories/post.repository.js';
import { uploadService } from '../config/minio.js';
import { publishEvent, TOPICS } from '../config/kafka.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { cacheService } from '../config/redis.js';

export class PostCommands {
  async createPost({ userId, caption, files, mediaType = 'image' }) {
    // Upload files to MinIO
    const uploadPromises = files.map((file) =>
      uploadService.uploadFile(file, userId, 'posts')
    );
    const uploadedFiles = await Promise.all(uploadPromises);

    // Extract URLs
    const mediaUrls = uploadedFiles.map((file) => file.url);

    // Create post in database
    const post = await postRepository.createPost({
      userId,
      caption,
      mediaUrls,
      mediaType: files.length > 1 ? 'carousel' : mediaType,
    });

    // Publish event to Kafka
    await publishEvent(TOPICS.POST_CREATED, {
      type: 'POST_CREATED',
      aggregateId: post.id,
      data: {
        postId: post.id,
        userId: post.user_id,
        caption: post.caption,
        mediaUrls: post.media_urls,
        mediaType: post.media_type,
        createdAt: post.created_at,
      },
      timestamp: new Date().toISOString(),
    });

    // Invalidate user's posts cache
    await cacheService.delPattern(`posts:user:${userId}:*`);
    await cacheService.delPattern(`feed:*`); // Invalidate all feeds

    return post;
  }

  async deletePost(postId, userId) {
    // Find post
    const post = await postRepository.findById(postId);
    
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    if (post.user_id !== userId) {
      throw new ForbiddenError('You can only delete your own posts');
    }

    // Delete from database (soft delete)
    await postRepository.deletePost(postId, userId);

    // Delete media files from MinIO (async, don't wait)
    if (post.media_urls && post.media_urls.length > 0) {
      post.media_urls.forEach((url) => {
        const fileName = url.split('/').slice(-3).join('/'); // Extract filename
        uploadService.deleteFile(fileName).catch((err) => {
          console.error('Error deleting file:', err);
        });
      });
    }

    // Publish event
    await publishEvent(TOPICS.POST_DELETED, {
      type: 'POST_DELETED',
      aggregateId: postId,
      data: {
        postId,
        userId,
        deletedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

    // Invalidate caches
    await cacheService.del(`post:${postId}`);
    await cacheService.delPattern(`posts:user:${userId}:*`);
    await cacheService.delPattern(`feed:*`);

    return { success: true, message: 'Post deleted successfully' };
  }
}

export default new PostCommands();