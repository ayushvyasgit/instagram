import { query, getClient } from '../config/database.js';

export class PostRepository {
  async createPost({ userId, caption, mediaUrls, mediaType }) {
    const result = await query(
      `INSERT INTO posts (user_id, caption, media_urls, media_type, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, user_id, caption, media_urls, media_type, like_count, comment_count, created_at`,
      [userId, caption, mediaUrls, mediaType]
    );

    return result.rows[0];
  }

  async findById(postId) {
    const result = await query(
      `SELECT p.*, u.username, u.profile_picture_url
       FROM posts p
       INNER JOIN users u ON p.user_id = u.id
       WHERE p.id = $1 AND p.deleted_at IS NULL`,
      [postId]
    );

    return result.rows[0];
  }

  async findByUserId(userId, limit = 20, offset = 0) {
    const result = await query(
      `SELECT p.*, u.username, u.profile_picture_url,
              EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) as user_liked
       FROM posts p
       INNER JOIN users u ON p.user_id = u.id
       WHERE p.user_id = $1 AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  }

  async getFeed(userId, limit = 20, offset = 0) {
    const result = await query(
      `SELECT p.*, u.username, u.profile_picture_url,
              EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) as user_liked
       FROM posts p
       INNER JOIN follows f ON p.user_id = f.following_id
       INNER JOIN users u ON p.user_id = u.id
       WHERE f.follower_id = $1 AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  }

  async getAllPosts(currentUserId, limit = 10, offset = 0) {
    const result = await query(
      `SELECT p.*, u.username, u.profile_picture_url,
              EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) as user_liked
       FROM posts p
       INNER JOIN users u ON p.user_id = u.id
       WHERE p.deleted_at IS NULL
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [currentUserId, limit, offset]
    );
    return result.rows;
  }

  async getTotalPostCount() {
    const result = await query(
      'SELECT COUNT(*) as total FROM posts WHERE deleted_at IS NULL'
    );
    return parseInt(result.rows[0].total);
  }

  async getUserPostCount(userId) {
    const result = await query(
      'SELECT COUNT(*) as total FROM posts WHERE user_id = $1 AND deleted_at IS NULL',
      [userId]
    );
    return parseInt(result.rows[0].total);
  }

  async deletePost(postId, userId) {
    const result = await query(
      `UPDATE posts 
       SET deleted_at = NOW()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [postId, userId]
    );

    return result.rows[0];
  }

  async incrementViewCount(postId) {
    await query(
      'UPDATE posts SET view_count = view_count + 1 WHERE id = $1',
      [postId]
    );
  }
}

export default new PostRepository();