import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { ApiResponse } from '@devconnect/shared';
import { ENV } from '../config/env.js';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and hyphens'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const cookieOptions = {
  httpOnly: true,
  secure: ENV.NODE_ENV === 'production',
  sameSite: (ENV.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const { user, token } = await AuthService.register(validatedData);

      res.cookie('token', token, cookieOptions);

      const response: ApiResponse = {
        success: true,
        data: { user, token },
        message: 'Account created successfully.',
      };
      return res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { user, token } = await AuthService.login(validatedData);

      res.cookie('token', token, cookieOptions);

      const response: ApiResponse = {
        success: true,
        data: { user, token },
        message: 'Logged in successfully.',
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      const { maxAge: _unused, ...clearOptions } = cookieOptions;
      res.clearCookie('token', clearOptions);
      const response: ApiResponse = {
        success: true,
        data: null,
        message: 'Logged out successfully.',
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const response: ApiResponse = {
          success: false,
          data: null,
          message: 'Not authenticated.',
        };
        return res.status(401).json(response);
      }

      const user = await AuthService.getMe(req.user.id);
      const response: ApiResponse = {
        success: true,
        data: { user },
        message: 'User profile retrieved.',
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
