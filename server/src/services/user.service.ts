import { prisma } from '../config/prisma.js';
import { AppError } from '../middlewares/error.middleware.js';
import { uploadImageBuffer } from '../config/cloudinary.js';
import {
  UpdateProfileDto,
  AddSkillDto,
  DeveloperProfile,
  ConnectionStatus,
  UserSkill as SharedUserSkill,
  Project as SharedProject,
  BlogPost as SharedBlogPost,
} from '@devconnect/shared';

export class UserService {
  static async getProfileByUsername(
    usernameOrId: string,
    viewerUserId?: string
  ): Promise<DeveloperProfile> {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: usernameOrId.toLowerCase() },
          { id: usernameOrId },
        ],
      },
      include: {
        userSkills: {
          include: {
            skill: true,
            endorsements: {
              include: {
                endorser: {
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
            },
          },
        },
        projects: {
          orderBy: { createdAt: 'desc' },
        },
        blogPosts: {
          where: { isPublished: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new AppError('Developer profile not found.', 404);
    }

    // Count accepted connections
    const connectionsCount = await prisma.connection.count({
      where: {
        OR: [
          { requesterId: user.id, status: 'ACCEPTED' },
          { receiverId: user.id, status: 'ACCEPTED' },
        ],
      },
    });

    let mutualConnectionsCount = 0;
    let connectionStatus: DeveloperProfile['connectionStatus'] = {
      status: 'NONE',
    };

    if (viewerUserId) {
      if (viewerUserId === user.id) {
        connectionStatus = { status: 'SELF' };
      } else {
        // Find connection record between viewer and profile user
        const existingConnection = await prisma.connection.findFirst({
          where: {
            OR: [
              { requesterId: viewerUserId, receiverId: user.id },
              { requesterId: user.id, receiverId: viewerUserId },
            ],
          },
        });

        if (existingConnection) {
          connectionStatus = {
            id: existingConnection.id,
            status: existingConnection.status as ConnectionStatus,
            isRequester: existingConnection.requesterId === viewerUserId,
          };
        }

        // Calculate mutual connections
        // 1. Viewer's accepted connected users
        const viewerConnections = await prisma.connection.findMany({
          where: {
            OR: [
              { requesterId: viewerUserId, status: 'ACCEPTED' },
              { receiverId: viewerUserId, status: 'ACCEPTED' },
            ],
          },
        });
        const viewerConnectedIds = new Set(
          viewerConnections.map((c) =>
            c.requesterId === viewerUserId ? c.receiverId : c.requesterId
          )
        );

        // 2. Profile user's accepted connections
        const profileConnections = await prisma.connection.findMany({
          where: {
            OR: [
              { requesterId: user.id, status: 'ACCEPTED' },
              { receiverId: user.id, status: 'ACCEPTED' },
            ],
          },
        });
        const profileConnectedIds = profileConnections.map((c) =>
          c.requesterId === user.id ? c.receiverId : c.requesterId
        );

        mutualConnectionsCount = profileConnectedIds.filter((id) =>
          viewerConnectedIds.has(id)
        ).length;
      }
    }

    const formattedUserSkills: SharedUserSkill[] = user.userSkills.map((us) => ({
      id: us.id,
      userId: us.userId,
      skillId: us.skillId,
      yearsOfExperience: us.yearsOfExperience,
      createdAt: us.createdAt.toISOString(),
      skill: {
        id: us.skill.id,
        name: us.skill.name,
        category: us.skill.category as any,
        createdAt: us.skill.createdAt.toISOString(),
      },
      endorsements: us.endorsements.map((e) => ({
        id: e.id,
        userSkillId: e.userSkillId,
        endorserId: e.endorserId,
        createdAt: e.createdAt.toISOString(),
        endorser: {
          id: e.endorser.id,
          username: e.endorser.username,
          name: e.endorser.name,
          avatarUrl: e.endorser.avatarUrl,
          bio: e.endorser.bio,
          location: e.endorser.location,
        },
      })),
      _count: {
        endorsements: us.endorsements.length,
      },
    }));

    const formattedProjects: SharedProject[] = user.projects.map((p) => ({
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
    }));

    const formattedBlogs: SharedBlogPost[] = user.blogPosts.map((b) => ({
      id: b.id,
      authorId: b.authorId,
      title: b.title,
      slug: b.slug,
      content: b.content,
      excerpt: b.excerpt,
      coverImage: b.coverImage,
      tags: b.tags,
      isPublished: b.isPublished,
      publishedAt: b.publishedAt ? b.publishedAt.toISOString() : null,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    }));

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      location: user.location,
      githubUrl: user.githubUrl,
      linkedinUrl: user.linkedinUrl,
      portfolioUrl: user.portfolioUrl,
      githubId: user.githubId,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      skills: formattedUserSkills,
      projects: formattedProjects,
      blogPosts: formattedBlogs,
      connectionsCount,
      mutualConnectionsCount,
      connectionStatus,
    };
  }

  static async updateProfile(userId: string, dto: UpdateProfileDto) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name?.trim(),
        bio: dto.bio?.trim(),
        location: dto.location?.trim(),
        githubUrl: dto.githubUrl?.trim() || null,
        linkedinUrl: dto.linkedinUrl?.trim() || null,
        portfolioUrl: dto.portfolioUrl?.trim() || null,
      },
    });

    return updated;
  }

  static async uploadAvatar(userId: string, fileBuffer: Buffer): Promise<string> {
    const avatarUrl = await uploadImageBuffer(fileBuffer, 'avatars', `user_${userId}`);

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return avatarUrl;
  }

  static async addSkill(userId: string, dto: AddSkillDto) {
    const normalizedName = dto.name.trim();
    if (!normalizedName) {
      throw new AppError('Skill name is required.', 400);
    }

    // Find or create global skill
    let skill = await prisma.skill.findFirst({
      where: { name: { equals: normalizedName, mode: 'insensitive' } },
    });

    if (!skill) {
      skill = await prisma.skill.create({
        data: {
          name: normalizedName,
          category: dto.category || 'OTHER',
        },
      });
    }

    // Check if user already added this skill
    const existingUserSkill = await prisma.userSkill.findUnique({
      where: {
        userId_skillId: {
          userId,
          skillId: skill.id,
        },
      },
    });

    if (existingUserSkill) {
      throw new AppError('You have already added this skill to your profile.', 409);
    }

    const userSkill = await prisma.userSkill.create({
      data: {
        userId,
        skillId: skill.id,
        yearsOfExperience: dto.yearsOfExperience || null,
      },
      include: {
        skill: true,
        endorsements: {
          include: {
            endorser: {
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
        },
      },
    });

    return userSkill;
  }

  static async removeSkill(userId: string, userSkillId: string) {
    const userSkill = await prisma.userSkill.findUnique({
      where: { id: userSkillId },
    });

    if (!userSkill || userSkill.userId !== userId) {
      throw new AppError('Skill not found on your profile.', 404);
    }

    await prisma.userSkill.delete({
      where: { id: userSkillId },
    });

    return { message: 'Skill removed successfully.' };
  }
}
