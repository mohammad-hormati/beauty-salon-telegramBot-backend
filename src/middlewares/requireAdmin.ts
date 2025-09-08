import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtAdminPayload {
  id: number;
  email: string;
  role: 'SUPERADMIN' | 'STAFF';
}

declare global {
  namespace Express {
    interface Request {
      admin?: JwtAdminPayload;
    }
  }
}

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = req.headers.authorization;
    const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
    const token = bearer || (req as any).cookies?.access_token;

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtAdminPayload;
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
