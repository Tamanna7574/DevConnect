import { Response, NextFunction } from 'express';
import { DiscoveryService } from '../services/discovery.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { ApiResponse } from '@devconnect/shared';

export class DiscoveryController {
  static async searchDevelopers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { q, skill, location, page, limit } = req.query;

      const result = await DiscoveryService.searchDevelopers(
        {
          q: q as string,
          skill: skill as string,
          location: location as string,
          page: page ? parseInt(page as string, 10) : 1,
          limit: limit ? parseInt(limit as string, 10) : 12,
        },
        req.user?.id
      );

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Developers retrieved successfully.',
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async globalSearch(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { q, type, page, limit } = req.query;

      const result = await DiscoveryService.globalSearch(
        {
          q: q as string,
          type: type as any,
          page: page ? parseInt(page as string, 10) : 1,
          limit: limit ? parseInt(limit as string, 10) : undefined,
        },
        req.user?.id
      );

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Global search results retrieved successfully.',
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getFilters(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await DiscoveryService.getDiscoveryFilters();

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Discovery filters retrieved successfully.',
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
