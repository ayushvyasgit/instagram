import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../../../application/auth/token.service";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  const token = header.substring("Bearer ".length);
  try {
    const payload = verifyAccessToken(token);
    (req as any).user = { id: payload.sub, username: payload.username };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};