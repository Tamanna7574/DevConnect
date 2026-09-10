import { prisma } from '../config/prisma.js';
import { AppError } from '../middlewares/error.middleware.js';
import { uploadImageBuffer } from '../config/cloudinary.js';
import { CreateProjectDto, UpdateProjectDto, Project as SharedProject } from '@devconnect/shared';

export class ProjectService {
  static formatProject(p: any): SharedProject {
    return {
      id: p.id,
      userId: p.userId,
      title: p.title,
      description: p.description,
      techStack: p.techStack,
      githubUrl: p.githubUrl,
      liveDemoUrl: p.liveDemoUrl,
      imageUrl: p.imageUrl,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      user: p.user
        ? {
            id: p.user.id,
            username: p.user.username,
            name: p.user.name,
            avatarUrl: p.user.avatarUrl,
            bio: p.user.bio,
            location: p.user.location,
          }
        : undefined,
    };
  }

  static async listProjects(params: {
    page?: number;
    limit?: number;
    search?: string;
    tech?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 9;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (params.tech && params.tech.trim() && params.tech !== 'All') {
      whereClause.techStack = {
        has: params.tech.trim(),
      };
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      const techVariations = [
        q,
        q.toLowerCase(),
        q.toUpperCase(),
        q.charAt(0).toUpperCase() + q.slice(1).toLowerCase(),
      ];
      whereClause.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { techStack: { hasSome: techVariations } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { username: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.project.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
              bio: true,
              location: true,
            },
          },
        },
      }),
      prisma.project.count({ where: whereClause }),
    ]);

    return {
      items: items.map(this.formatProject),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: skip + items.length < total,
        hasPrevPage: page > 1,
      },
    };
  }

  static async listUserProjects(userId: string): Promise<SharedProject[]> {
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
            bio: true,
            location: true,
          },
        },
      },
    });

    return projects.map(this.formatProject);
  }

  static async getProjectById(projectId: string): Promise<SharedProject> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
            bio: true,
            location: true,
          },
        },
      },
    });

    if (!project) {
      throw new AppError('Project not found.', 404);
    }

    return this.formatProject(project);
  }

  static async createProject(
    userId: string,
    dto: CreateProjectDto,
    imageBuffer?: Buffer
  ): Promise<SharedProject> {
    let imageUrl = dto.imageUrl || null;

    if (imageBuffer) {
      imageUrl = await uploadImageBuffer(imageBuffer, 'projects', `proj_${userId}`);
    }

    const created = await prisma.project.create({
      data: {
        userId,
        title: dto.title.trim(),
        description: dto.description.trim(),
        techStack: dto.techStack || [],
        githubUrl: dto.githubUrl?.trim() || null,
        liveDemoUrl: dto.liveDemoUrl?.trim() || null,
        imageUrl,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
            bio: true,
            location: true,
          },
        },
      },
    });

    return this.formatProject(created);
  }

  static async updateProject(
    userId: string,
    projectId: string,
    dto: UpdateProjectDto,
    imageBuffer?: Buffer
  ): Promise<SharedProject> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new AppError('Project not found.', 404);
    }

    if (project.userId !== userId) {
      throw new AppError('You do not have permission to modify this project.', 403);
    }

    let imageUrl = project.imageUrl;
    if (imageBuffer) {
      imageUrl = await uploadImageBuffer(imageBuffer, 'projects', `proj_${userId}`);
    } else if (dto.imageUrl !== undefined) {
      imageUrl = dto.imageUrl || null;
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        title: dto.title !== undefined ? dto.title.trim() : project.title,
        description:
          dto.description !== undefined ? dto.description.trim() : project.description,
        techStack: dto.techStack !== undefined ? dto.techStack : project.techStack,
        githubUrl:
          dto.githubUrl !== undefined ? dto.githubUrl?.trim() || null : project.githubUrl,
        liveDemoUrl:
          dto.liveDemoUrl !== undefined
            ? dto.liveDemoUrl?.trim() || null
            : project.liveDemoUrl,
        imageUrl,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
            bio: true,
            location: true,
          },
        },
      },
    });

    return this.formatProject(updated);
  }

  static async deleteProject(userId: string, projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new AppError('Project not found.', 404);
    }

    if (project.userId !== userId) {
      throw new AppError('You do not have permission to delete this project.', 403);
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return { message: 'Project deleted successfully.' };
  }
}
