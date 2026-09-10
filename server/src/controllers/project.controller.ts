import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProjectService } from '../services/project.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { ApiResponse } from '@devconnect/shared';
import { AppError } from '../middlewares/error.middleware.js';

const projectSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  techStack: z.array(z.string()).or(
    z.string().transform((str) =>
      str
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    )
  ),
  githubUrl: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  liveDemoUrl: z.string().url('Invalid Live Demo URL').optional().or(z.literal('')),
  imageUrl: z.string().optional(),
});

export class ProjectController {
  static async listProjects(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 9;
      const tech = req.query.tech as string | undefined;
      const search = req.query.search as string | undefined;

      const result = await ProjectService.listProjects({
        page,
        limit,
        tech,
        search,
      });

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Projects retrieved successfully.',
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async listUserProjects(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const projects = await ProjectService.listUserProjects(userId || req.user!.id);

      const response: ApiResponse = {
        success: true,
        data: projects,
        message: 'Projects retrieved successfully.',
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const project = await ProjectService.getProjectById(id);

      const response: ApiResponse = {
        success: true,
        data: project,
        message: 'Project retrieved successfully.',
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async createProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      // If techStack was passed as string in multipart form, JSON parse or split
      if (typeof req.body.techStack === 'string') {
        try {
          req.body.techStack = JSON.parse(req.body.techStack);
        } catch {
          req.body.techStack = req.body.techStack.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }

      const validatedData = projectSchema.parse(req.body);
      const project = await ProjectService.createProject(
        req.user.id,
        validatedData as any,
        req.file?.buffer
      );

      const response: ApiResponse = {
        success: true,
        data: project,
        message: 'Project created successfully.',
      };
      return res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async updateProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;

      if (typeof req.body.techStack === 'string') {
        try {
          req.body.techStack = JSON.parse(req.body.techStack);
        } catch {
          req.body.techStack = req.body.techStack.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }

      const validatedData = projectSchema.partial().parse(req.body);
      const project = await ProjectService.updateProject(
        req.user.id,
        id,
        validatedData as any,
        req.file?.buffer
      );

      const response: ApiResponse = {
        success: true,
        data: project,
        message: 'Project updated successfully.',
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async deleteProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const result = await ProjectService.deleteProject(req.user.id, id);

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
