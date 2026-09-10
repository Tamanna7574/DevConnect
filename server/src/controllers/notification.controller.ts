import { Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { ApiResponse } from '@devconnect/shared';
import { AppError } from '../middlewares/error.middleware.js';

export class NotificationController {
  static async listNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await NotificationService.getUserNotifications(req.user.id, page, limit);

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Notifications retrieved successfully.',
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      await NotificationService.markAsRead(id, req.user.id);

      const response: ApiResponse = {
        success: true,
        data: null,
        message: 'Notification marked as read.',
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      await NotificationService.markAllAsRead(req.user.id);

      const response: ApiResponse = {
        success: true,
        data: null,
        message: 'All notifications marked as read.',
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
