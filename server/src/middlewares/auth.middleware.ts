import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { ApiResponse } from '@devconnect/shared';

export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    name: string;
  };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    // Check httpOnly cookies first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } 
    // Fallback to Bearer token in header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      const response: ApiResponse = {
        success: false,
        data: null,
        message: 'Authentication required. Please log in.',
      };
      return res.status(401).json(response);
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, username: true, name: true },
    });

    if (!user) {
      const response: ApiResponse = {
        success: false,
        data: null,
        message: 'User session invalid. Please log in again.',
      };
      return res.status(401).json(response);
    }

    req.user = user;
    next();
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      data: null,
      message: 'Invalid or expired session. Please log in again.',
    };
    return res.status(401).json(response);
  }
}

export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, username: true, name: true },
      });
      if (user) {
        req.user = user;
      }
    }
  } catch {
    // Ignore invalid tokens for optional auth
  }
  next();
}
