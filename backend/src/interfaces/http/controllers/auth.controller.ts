import { Request, Response } from "express";
import { z } from "zod";
import { hashPassword, verifyPassword } from "../../infrastructure/security/password-hasher";
import { signAccessToken } from "../../application/auth/token.service";
import { getPool } from "../../infrastructure/persistence/postgres/connection";

const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8)
});

export const register = async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.errors });
  const { username, email, password } = parsed.data;

  const pool = getPool();
  const hashed = await hashPassword(password);

  const existing = await pool.query(
    "SELECT 1 FROM users WHERE username = $1 OR email = $2",
    [username, email]
  );
  if (existing.rowCount) return res.status(409).json({ error: "User exists" });

  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash, created_at)
     VALUES ($1,$2,$3,NOW()) RETURNING id`,
    [username, email, hashed]
  );
  const id = result.rows[0].id;
  const accessToken = signAccessToken({ sub: id, username });

  return res.status(201).json({ accessToken });
};

const loginSchema = z.object({
  emailOrUsername: z.string().min(1),
  password: z.string().min(8)
});

export const login = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.errors });

  const { emailOrUsername, password } = parsed.data;
  const pool = getPool();
  const userRes = await pool.query(
    `SELECT id, username, password_hash FROM users
     WHERE email = $1 OR username = $1`,
    [emailOrUsername]
  );
  if (!userRes.rowCount) return res.status(401).json({ error: "Invalid credentials" });

  const user = userRes.rows[0];
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signAccessToken({ sub: user.id, username: user.username });
  return res.json({ accessToken: token });
};