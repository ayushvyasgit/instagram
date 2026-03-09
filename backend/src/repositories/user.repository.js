import { query, getClient } from '../config/database.js';
import bcrypt from 'bcryptjs';

export class UserRepository {
  async createUser({ username, email, password, bio = null }) {
    const passwordHash = await bcrypt.hash(password, 10);
    
    const result = await query(
      `INSERT INTO users (username, email, password_hash, bio, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, username, email, bio, profile_picture_url, created_at`,
      [username, email, passwordHash, bio]
    );

    return result.rows[0];
  }

  async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );
    return result.rows[0];
  }

  async findByUsername(username) {
    const result = await query(
      'SELECT * FROM users WHERE username = $1 AND deleted_at IS NULL',
      [username]
    );
    return result.rows[0];
  }

  async findById(id) {
    const result = await query(
      `SELECT id, username, email, bio, profile_picture_url, 
              is_verified, created_at, updated_at
       FROM users 
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return result.rows[0];
  }

  async updateUser(userId, updates) {
    const allowedFields = ['username', 'bio', 'profile_picture_url'];
    const setClause = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        setClause.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (setClause.length === 0) {
      throw new Error('No valid fields to update');
    }

    setClause.push(`updated_at = NOW()`);
    values.push(userId);

    const result = await query(
      `UPDATE users 
       SET ${setClause.join(', ')}
       WHERE id = $${paramCount} AND deleted_at IS NULL
       RETURNING id, username, email, bio, profile_picture_url, updated_at`,
      values
    );

    return result.rows[0];
  }

  async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
  }

  async getUserStats(userId) {
    const result = await query(
      `SELECT 
        (SELECT COUNT(*) FROM posts WHERE user_id = $1 AND deleted_at IS NULL) as posts_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = $1) as following_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = $1) as followers_count`,
      [userId]
    );
    return result.rows[0];
  }
  async searchUsers(searchQuery, limit = 20) {
    const result = await query(
      `SELECT id, username, bio, profile_picture_url
       FROM users
       WHERE username ILIKE $1 AND deleted_at IS NULL
       ORDER BY username ASC
       LIMIT $2`,
      [`%${searchQuery}%`, limit]
    );
    return result.rows;
  }
}
export default new UserRepository();