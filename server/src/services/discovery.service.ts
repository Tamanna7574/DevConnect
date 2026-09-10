import { prisma } from '../config/prisma.js';
import {
  SearchDevelopersQuery,
  GlobalSearchQuery,
  DiscoveryFiltersResponse,
  GlobalSearchResult,
} from '@devconnect/shared';
import { ProjectService } from './project.service.js';
import { BlogService } from './blog.service.js';

export class DiscoveryService {
  static async searchDevelopers(query: SearchDevelopersQuery, viewerUserId?: string) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 12;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    // Do not show the current viewer in discovery if logged in
    if (viewerUserId) {
      whereClause.id = { not: viewerUserId };
    }

    if (query.q && query.q.trim()) {
      const q = query.q.trim();
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { username: { contains: q, mode: 'insensitive' } },
        { bio: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
        { userSkills: { some: { skill: { name: { contains: q, mode: 'insensitive' } } } } },
      ];
    }

    if (query.location && query.location.trim()) {
      whereClause.location = {
        contains: query.location.trim(),
        mode: 'insensitive',
      };
    }

    if (query.skill && query.skill.trim()) {
      whereClause.userSkills = {
        some: {
          skill: {
            name: {
              contains: query.skill.trim(),
              mode: 'insensitive',
            },
          },
        },
      };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          name: true,
          avatarUrl: true,
          bio: true,
          location: true,
          githubUrl: true,
          linkedinUrl: true,
          portfolioUrl: true,
          createdAt: true,
          userSkills: {
            take: 6,
            include: {
              skill: true,
              _count: {
                select: { endorsements: true },
              },
            },
          },
          _count: {
            select: {
              projects: true,
              blogPosts: true,
            },
          },
        },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    const formattedItems = users.map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
      location: u.location,
      githubUrl: u.githubUrl,
      linkedinUrl: u.linkedinUrl,
      portfolioUrl: u.portfolioUrl,
      createdAt: u.createdAt.toISOString(),
      skills: u.userSkills.map((us) => ({
        id: us.id,
        skillId: us.skillId,
        name: us.skill.name,
        category: us.skill.category,
        endorsementsCount: us._count.endorsements,
      })),
      projectsCount: u._count.projects,
      blogsCount: u._count.blogPosts,
    }));

    return {
      items: formattedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: skip + users.length < total,
        hasPrevPage: page > 1,
      },
    };
  }

  static async globalSearch(query: GlobalSearchQuery, viewerUserId?: string): Promise<GlobalSearchResult> {
    const q = query.q?.trim() || '';
    const type = query.type || 'all';
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || (type === 'all' ? 6 : 9);

    let developersResult = { items: [] as any[], total: 0 };
    let projectsResult = { items: [] as any[], total: 0 };
    let publicationsResult = { items: [] as any[], total: 0 };

    if (type === 'all' || type === 'developers') {
      const devData = await this.searchDevelopers(
        { q, page: type === 'all' ? 1 : page, limit: type === 'all' ? 6 : limit },
        viewerUserId
      );
      developersResult = { items: devData.items, total: devData.pagination.total };
    }

    if (type === 'all' || type === 'projects') {
      const projData = await ProjectService.listProjects({
        search: q,
        page: type === 'all' ? 1 : page,
        limit: type === 'all' ? 6 : limit,
      });
      projectsResult = { items: projData.items, total: projData.pagination.total };
    }

    if (type === 'all' || type === 'publications') {
      const blogData = await BlogService.listBlogs({
        search: q,
        page: type === 'all' ? 1 : page,
        limit: type === 'all' ? 6 : limit,
        publishedOnly: true,
      });
      publicationsResult = { items: blogData.items, total: blogData.pagination.total };
    }

    return {
      developers: developersResult,
      projects: projectsResult,
      publications: publicationsResult,
      counts: {
        developers: developersResult.total,
        projects: projectsResult.total,
        publications: publicationsResult.total,
        total: developersResult.total + projectsResult.total + publicationsResult.total,
      },
    };
  }

  static async getDiscoveryFilters(): Promise<DiscoveryFiltersResponse> {
    const [skills, usersWithLocations, projects, blogs] = await Promise.all([
      prisma.skill.findMany({
        select: { name: true },
        orderBy: { name: 'asc' },
        take: 30,
      }),
      prisma.user.findMany({
        where: { location: { not: null } },
        select: { location: true },
        distinct: ['location'],
        take: 30,
      }),
      prisma.project.findMany({
        select: { techStack: true },
      }),
      prisma.blogPost.findMany({
        where: { isPublished: true },
        select: { tags: true },
      }),
    ]);

    const skillNames = Array.from(new Set(skills.map((s) => s.name.trim()).filter(Boolean))).sort();
    const locations = Array.from(
      new Set(usersWithLocations.map((u) => u.location?.trim()).filter(Boolean) as string[])
    ).sort();
    const techStacks = Array.from(
      new Set(projects.flatMap((p) => p.techStack).map((t) => t.trim()).filter(Boolean))
    ).sort();
    const blogTags = Array.from(
      new Set(blogs.flatMap((b) => b.tags).map((t) => t.trim()).filter(Boolean))
    ).sort();

    return {
      skills: skillNames,
      locations,
      techStacks,
      blogTags,
    };
  }
}
