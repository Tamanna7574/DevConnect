import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BlogService } from '../services/blog.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { ApiResponse } from '@devconnect/shared';
import { AppError } from '../middlewares/error.middleware.js';

const blogSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(150),
  content: z.string().min(20, 'Content must be at least 20 characters'),
  excerpt: z.string().max(300).optional(),
  tags: z.array(z.string()).or(
    z.string().transform((str) =>
      str
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    )
  ),
  coverImage: z.string().optional(),
  isPublished: z.boolean().or(z.string().transform((v) => v === 'true')).optional(),
});

export class BlogController {
  static async listBlogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const tag = req.query.tag as string | undefined;
      const search = req.query.search as string | undefined;
      const authorId = req.query.authorId as string | undefined;

      const result = await BlogService.listBlogs({
        page,
        limit,
        tag,
        search,
        authorId,
        publishedOnly: true,
      });

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Blog posts retrieved successfully.',
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async listMyBlogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await BlogService.listBlogs({
        page,
        limit,
        authorId: req.user.id,
        publishedOnly: false,
      });

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'My blog posts retrieved successfully.',
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getBlog(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { idOrSlug } = req.params;
      const blog = await BlogService.getBlogByIdOrSlug(idOrSlug, req.user?.id);

      const response: ApiResponse = {
        success: true,
        data: blog,
        message: 'Blog post retrieved successfully.',
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async createBlog(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      if (typeof req.body.tags === 'string') {
        try {
          req.body.tags = JSON.parse(req.body.tags);
        } catch {
          req.body.tags = req.body.tags.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }

      const validatedData = blogSchema.parse(req.body);
      const blog = await BlogService.createBlog(
        req.user.id,
        validatedData as any,
        req.file?.buffer
      );

      const response: ApiResponse = {
        success: true,
        data: blog,
        message: 'Blog post published successfully.',
      };
      return res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async updateBlog(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;

      if (typeof req.body.tags === 'string') {
        try {
          req.body.tags = JSON.parse(req.body.tags);
        } catch {
          req.body.tags = req.body.tags.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }

      const validatedData = blogSchema.partial().parse(req.body);
      const blog = await BlogService.updateBlog(
        req.user.id,
        id,
        validatedData as any,
        req.file?.buffer
      );

      const response: ApiResponse = {
        success: true,
        data: blog,
        message: 'Blog post updated successfully.',
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async deleteBlog(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const result = await BlogService.deleteBlog(req.user.id, id);

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
