import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { ConnectionService } from '../services/connection.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { ApiResponse } from '@devconnect/shared';
import { AppError } from '../middlewares/error.middleware.js';

const requestSchema = z.object({
  receiverId: z.string().uuid('Invalid user ID'),
});

const respondSchema = z.object({
  action: z.enum(['ACCEPT', 'REJECT']),
});

export class ConnectionController {
  static async sendRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const { receiverId } = requestSchema.parse(req.body);
      const connection = await ConnectionService.sendConnectionRequest(req.user.id, receiverId);

      const response: ApiResponse = {
        success: true,
        data: connection,
        message: 'Connection request sent successfully.',
      };
      return res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async respondRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const { action } = respondSchema.parse(req.body);

      const connection = await ConnectionService.respondConnectionRequest(id, req.user.id, action);

      const response: ApiResponse = {
        success: true,
        data: connection,
        message: `Connection request ${action === 'ACCEPT' ? 'accepted' : 'rejected'}.`,
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async removeConnection(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const result = await ConnectionService.removeConnection(id, req.user.id);

      const response: ApiResponse = {
        success: true,
        data: null,
        message: result.message,
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async listConnections(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const connections = await ConnectionService.listUserConnections(req.user.id);

      const response: ApiResponse = {
        success: true,
        data: connections,
        message: 'Connections retrieved successfully.',
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
