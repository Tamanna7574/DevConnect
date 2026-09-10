import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiResponse } from '@devconnect/shared';
import { ENV } from '../config/env.js';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const errorMessages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    const response: ApiResponse = {
      success: false,
      data: null,
      message: `Validation error: ${errorMessages}`,
    };
    return res.status(400).json(response);
  }

  // Handle Custom AppError
  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      data: null,
      message: err.message,
    };
    return res.status(err.statusCode).json(response);
  }

  // Handle Prisma Known Request Errors
  if (err?.code === 'P2002') {
    const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
    const response: ApiResponse = {
      success: false,
      data: null,
      message: `A record with this ${target} already exists.`,
    };
    return res.status(409).json(response);
  }

  if (err?.code === 'P2025') {
    const response: ApiResponse = {
      success: false,
      data: null,
      message: 'The requested resource was not found.',
    };
    return res.status(404).json(response);
  }

  // Handle Multer Errors
  if (err.name === 'MulterError') {
    let msg = err.message;
    if (err.code === 'LIMIT_FILE_SIZE') {
      msg = 'File size exceeds the 2MB limit.';
    }
    const response: ApiResponse = {
      success: false,
      data: null,
      message: msg,
    };
    return res.status(400).json(response);
  }

  // General server error
  console.error('Unhandled server error:', err);
  const message =
    ENV.NODE_ENV === 'production'
      ? 'An unexpected internal server error occurred.'
      : err.message || 'Internal Server Error';

  const response: ApiResponse = {
    success: false,
    data: null,
    message,
  };
  return res.status(500).json(response);
}
