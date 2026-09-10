import { prisma } from '../config/prisma.js';
import { ConnectionStatus, DashboardDataResponse, NotificationType } from '@devconnect/shared';
import { ProjectService } from './project.service.js';
import { BlogService } from './blog.service.js';

export class DashboardService {
  static async getDashboardData(userId: string): Promise<DashboardDataResponse> {
    const [
      projectsCount,
      blogPostsCount,
      connectionsCount,
      endorsementsCount,
      pendingRequestsCount,
      skillsCount,
      userProjects,
      userBlogs,
      incomingRequests,
      recentConnections,
      recentNotifications,
      suggestedDevelopers,
      latestProjects,
      trendingBlogs,
    ] = await Promise.all([
      // Projects count
      prisma.project.count({ where: { userId } }),
      // Blog posts count
      prisma.blogPost.count({ where: { authorId: userId } }),
      // Accepted connections count
      prisma.connection.count({
        where: {
          OR: [
            { requesterId: userId, status: ConnectionStatus.ACCEPTED },
            { receiverId: userId, status: ConnectionStatus.ACCEPTED },
          ],
        },
      }),
      // Endorsements received count
      prisma.endorsement.count({
        where: {
          userSkill: { userId },
        },
      }),
      // Pending requests received count
      prisma.connection.count({
        where: {
          receiverId: userId,
          status: ConnectionStatus.PENDING,
        },
      }),
      // Skills count
      prisma.userSkill.count({
        where: { userId },
      }),
      // User's own projects (recent 3)
      prisma.project.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 3,
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
      // User's own publications (recent 3)
      prisma.blogPost.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          author: {
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
      // Incoming connection requests
      prisma.connection.findMany({
        where: {
          receiverId: userId,
          status: ConnectionStatus.PENDING,
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          requester: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
              bio: true,
              location: true,
              userSkills: {
                take: 2,
                include: { skill: true },
              },
            },
          },
        },
      }),
      // Recently accepted connections
      prisma.connection.findMany({
        where: {
          OR: [
            { requesterId: userId, status: ConnectionStatus.ACCEPTED },
            { receiverId: userId, status: ConnectionStatus.ACCEPTED },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        take: 3,
        include: {
          requester: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
              bio: true,
              location: true,
            },
          },
          receiver: {
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
      // Recent notifications / activity
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      // Suggested developers (other users not connected yet)
      prisma.user.findMany({
        where: {
          id: { not: userId },
          sentConnections: {
            none: {
              receiverId: userId,
              status: ConnectionStatus.ACCEPTED,
            },
          },
          receivedConnections: {
            none: {
              requesterId: userId,
              status: ConnectionStatus.ACCEPTED,
            },
          },
        },
        take: 4,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          name: true,
          avatarUrl: true,
          bio: true,
          location: true,
          userSkills: {
            take: 3,
            include: { skill: true },
          },
        },
      }),
      // Latest community projects (from other developers)
      prisma.project.findMany({
        where: { userId: { not: userId } },
        take: 3,
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
      }),
      // Trending/Recent technical blogs
      prisma.blogPost.findMany({
        where: { isPublished: true },
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      }),
    ]);

    return {
      stats: {
        projectsCount,
        blogPostsCount,
        connectionsCount,
        endorsementsCount,
        pendingRequestsCount,
        skillsCount,
      },
      userProjects: userProjects.map((p) => ProjectService.formatProject(p)),
      userBlogs: userBlogs.map((b) => BlogService.formatBlogPost(b)),
      network: {
        incomingRequests: incomingRequests.map((c) => ({
          id: c.id,
          createdAt: c.createdAt.toISOString(),
          requester: {
            id: c.requester.id,
            username: c.requester.username,
            name: c.requester.name,
            avatarUrl: c.requester.avatarUrl,
            bio: c.requester.bio,
            location: c.requester.location,
            skills: c.requester.userSkills?.map((us) => ({
              id: us.skill.id,
              name: us.skill.name,
            })),
          },
        })),
        recentConnections: recentConnections.map((c) => {
          const connectedUser = c.requesterId === userId ? c.receiver : c.requester;
          return {
            id: c.id,
            connectedSince: c.updatedAt.toISOString(),
            connectedUser: {
              id: connectedUser.id,
              username: connectedUser.username,
              name: connectedUser.name,
              avatarUrl: connectedUser.avatarUrl,
              bio: connectedUser.bio,
              location: connectedUser.location,
            },
          };
        }),
        totalConnections: connectionsCount,
        pendingCount: pendingRequestsCount,
      },
      recentActivity: recentNotifications.map((n) => ({
        id: n.id,
        userId: n.userId,
        type: n.type as NotificationType,
        title: n.title,
        message: n.message,
        entityId: n.entityId,
        entityType: n.entityType,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
        metadata: n.metadata ? (typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata) : null,
      })),
      suggestions: suggestedDevelopers.map((u) => ({
        id: u.id,
        username: u.username,
        name: u.name,
        avatarUrl: u.avatarUrl,
        bio: u.bio,
        location: u.location,
        skills: u.userSkills.map((us) => us.skill.name),
      })),
      latestProjects: latestProjects.map((p) => ProjectService.formatProject(p)),
      trendingBlogs: trendingBlogs.map((b) => ({
        id: b.id,
        title: b.title,
        slug: b.slug,
        excerpt: b.excerpt,
        tags: b.tags,
        createdAt: b.createdAt.toISOString(),
        author: b.author,
      })),
    };
  }
}
