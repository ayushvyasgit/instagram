import { query } from '../config/database.js';

export class LikeRepository {
  async likePost(userId, postId) {
    try {
      const result = await query(
        `INSERT INTO likes (user_id, post_id, created_at)
         VALUES ($1, $2, NOW())
         RETURNING id, user_id, post_id, created_at`,
        [userId, postId]
      );

      return result.rows[0];
    } catch (error) {
      // Handle unique constraint violation (already liked)
      if (error.code === '23505') {
        throw new Error('Already liked');
      }
      throw error;
    }
  }

  async unlikePost(userId, postId) {
    const result = await query(
      'DELETE FROM likes WHERE user_id = $1 AND post_id = $2 RETURNING id',
      [userId, postId]
    );

    return result.rows[0];
  }

  async likeComment(userId, commentId) {
    try {
      const result = await query(
        `INSERT INTO likes (user_id, comment_id, created_at)
         VALUES ($1, $2, NOW())
         RETURNING id, user_id, comment_id, created_at`,
        [userId, commentId]
      );

      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Already liked');
      }
      throw error;
    }
  }

  async unlikeComment(userId, commentId) {
    const result = await query(
      'DELETE FROM likes WHERE user_id = $1 AND comment_id = $2 RETURNING id',
      [userId, commentId]
    );

    return result.rows[0];
  }

  async hasUserLikedPost(userId, postId) {
    const result = await query(
      'SELECT EXISTS(SELECT 1 FROM likes WHERE user_id = $1 AND post_id = $2)',
      [userId, postId]
    );

    return result.rows[0].exists;
  }

  async hasUserLikedComment(userId, commentId) {
    const result = await query(
      'SELECT EXISTS(SELECT 1 FROM likes WHERE user_id = $1 AND comment_id = $2)',
      [userId, commentId]
    );

    return result.rows[0].exists;
  }

  async getPostLikes(postId, limit = 20, offset = 0) {
    const result = await query(
      `SELECT l.*, u.username, u.profile_picture_url
       FROM likes l
       INNER JOIN users u ON l.user_id = u.id
       WHERE l.post_id = $1
       ORDER BY l.created_at DESC
       LIMIT $2 OFFSET $3`,
      [postId, limit, offset]
    );

    return result.rows;
  }
}

export default new LikeRepository();