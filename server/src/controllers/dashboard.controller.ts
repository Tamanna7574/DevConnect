import { Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { ApiResponse } from '@devconnect/shared';
import { AppError } from '../middlewares/error.middleware.js';

export class DashboardController {
  static async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const data = await DashboardService.getDashboardData(req.user.id);

      const response: ApiResponse = {
        success: true,
        data,
        message: 'Dashboard data retrieved successfully.',
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
