import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { EndorsementService } from '../services/endorsement.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { ApiResponse } from '@devconnect/shared';
import { AppError } from '../middlewares/error.middleware.js';

const endorseSchema = z.object({
  userSkillId: z.string().min(1, 'User skill ID is required'),
});

export class EndorsementController {
  static async endorseSkill(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const { userSkillId } = endorseSchema.parse(req.body);
      const endorsement = await EndorsementService.endorseSkill(req.user.id, userSkillId);

      const response: ApiResponse = {
        success: true,
        data: endorsement,
        message: 'Skill endorsed successfully.',
      };
      return res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async removeEndorsement(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const { userSkillId } = req.params;
      const result = await EndorsementService.removeEndorsement(req.user.id, userSkillId);

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

  static async listEndorsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userSkillId } = req.params;
      const endorsers = await EndorsementService.listEndorsers(userSkillId);

      const response: ApiResponse = {
        success: true,
        data: endorsers,
        message: 'Endorsers retrieved successfully.',
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
