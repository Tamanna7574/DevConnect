import rateLimit from 'express-rate-limit';
import { ApiResponse } from '@devconnect/shared';
import { ENV } from '../config/env.js';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  skip: () => ENV.NODE_ENV === 'test',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    const response: ApiResponse = {
      success: false,
      data: null,
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
    };
    res.status(429).json(response);
  },
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300,
  skip: () => ENV.NODE_ENV === 'test',
  standardHeaders: true,
  legacyHeaders: false,
});
