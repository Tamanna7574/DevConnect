import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { UserService } from '../services/user.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { ApiResponse, SkillCategory } from '@devconnect/shared';
import { AppError } from '../middlewares/error.middleware.js';

const updateProfileSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  githubUrl: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  portfolioUrl: z.string().url('Invalid Portfolio URL').optional().or(z.literal('')),
});

const addSkillSchema = z.object({
  name: z.string().min(1, 'Skill name is required').max(50),
  category: z.nativeEnum(SkillCategory).optional(),
  yearsOfExperience: z.number().int().min(0).max(50).optional(),
});

export class UserController {
  static async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { username } = req.params;
      const viewerUserId = req.user?.id;

      const profile = await UserService.getProfileByUsername(username, viewerUserId);
      const response: ApiResponse = {
        success: true,
        data: profile,
        message: 'Profile retrieved successfully.',
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const validatedData = updateProfileSchema.parse(req.body);
      const updatedUser = await UserService.updateProfile(req.user.id, validatedData);

      const response: ApiResponse = {
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully.',
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async uploadAvatar(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      if (!req.file) {
        throw new AppError('Please select an image file to upload.', 400);
      }

      const avatarUrl = await UserService.uploadAvatar(req.user.id, req.file.buffer);

      const response: ApiResponse = {
        success: true,
        data: { avatarUrl },
        message: 'Avatar uploaded successfully.',
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async addSkill(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const validatedData = addSkillSchema.parse(req.body);
      const userSkill = await UserService.addSkill(req.user.id, validatedData as any);

      const response: ApiResponse = {
        success: true,
        data: userSkill,
        message: 'Skill added to profile.',
      };
      return res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async removeSkill(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const { skillId } = req.params;
      const result = await UserService.removeSkill(req.user.id, skillId);

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
}
