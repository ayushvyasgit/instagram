// src/application/post/post.command-service.ts
import { getPool } from "../../infrastructure/persistence/postgres/connection";
import { config } from "../../config/config";

export class PostCommandService {
  async createPost(params: {
    userId: string;
    imageUrl: string;
    caption?: string;
  }) {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO posts (user_id, image_url, caption, like_count, comment_count, created_at, updated_at)
       VALUES ($1,$2,$3,0,0,NOW(),NOW())
       RETURNING id`,
      [params.userId, params.imageUrl, params.caption ?? null]
    );
    const id = result.rows[0].id;

    // Publish Kafka event (post_created)
    // (see kafka.producer.ts)
    // await kafkaProducer.publish("post_created", { id, userId: params.userId });

    return { id };
  }

  async deleteOwnPost(userId: string, postId: string) {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE posts SET deleted_at = NOW()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [postId, userId]
    );
    if (!result.rowCount) throw new Error("NOT_FOUND_OR_FORBIDDEN");
  }
}