import { query, getClient } from '../config/database.js';

export class CommentRepository {
  async createComment({ postId, userId, content, parentId = null }) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      let depth = 0;
      let path = '';

      // If this is a reply, calculate depth and path
      if (parentId) {
        const parentResult = await client.query(
          'SELECT depth, path, id FROM comments WHERE id = $1 FOR UPDATE',
          [parentId]
        );

        if (parentResult.rows.length === 0) {
          throw new Error('Parent comment not found');
        }

        const parent = parentResult.rows[0];
        depth = parent.depth + 1;
        path = parent.path ? `${parent.path}.${parent.id}` : parent.id;

        // Update parent reply count
        await client.query(
          'UPDATE comments SET reply_count = reply_count + 1 WHERE id = $1',
          [parentId]
        );
      }

      // Insert comment
      const result = await client.query(
        `INSERT INTO comments (post_id, user_id, parent_id, content, path, depth, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING id, post_id, user_id, parent_id, content, depth, like_count, reply_count, created_at`,
        [postId, userId, parentId, content, path, depth]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(commentId) {
    const result = await query(
      `SELECT c.*, u.username, u.profile_picture_url
       FROM comments c
       INNER JOIN users u ON c.user_id = u.id
       WHERE c.id = $1 AND c.deleted_at IS NULL`,
      [commentId]
    );

    return result.rows[0];
  }

  async findByPostId(postId, limit = 20, offset = 0) {
    const result = await query(
      `SELECT c.*, u.username, u.profile_picture_url
       FROM comments c
       INNER JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1 AND c.parent_id IS NULL AND c.deleted_at IS NULL
       ORDER BY c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [postId, limit, offset]
    );

    return result.rows;
  }

  async findReplies(commentId, limit = 10, offset = 0) {
    const result = await query(
      `SELECT c.*, u.username, u.profile_picture_url
       FROM comments c
       INNER JOIN users u ON c.user_id = u.id
       WHERE c.parent_id = $1 AND c.deleted_at IS NULL
       ORDER BY c.created_at ASC
       LIMIT $2 OFFSET $3`,
      [commentId, limit, offset]
    );

    return result.rows;
  }

  async updateComment(commentId, userId, content) {
    const result = await query(
      `UPDATE comments 
       SET content = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL
       RETURNING id, post_id, user_id, content, updated_at`,
      [content, commentId, userId]
    );

    return result.rows[0];
  }

  async deleteComment(commentId, userId) {
    const result = await query(
      `UPDATE comments 
       SET deleted_at = NOW()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING id, parent_id`,
      [commentId, userId]
    );

    return result.rows[0];
  }
}

export default new CommentRepository();