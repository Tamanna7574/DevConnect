import { prisma } from '../config/prisma.js';
import { AppError } from '../middlewares/error.middleware.js';
import { uploadImageBuffer } from '../config/cloudinary.js';
import { CreateBlogDto, UpdateBlogDto, BlogPost as SharedBlogPost } from '@devconnect/shared';

export class BlogService {
  static formatBlogPost(b: any): SharedBlogPost {
    return {
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
      author: b.author
        ? {
            id: b.author.id,
            username: b.author.username,
            name: b.author.name,
            avatarUrl: b.author.avatarUrl,
            bio: b.author.bio,
            location: b.author.location,
          }
        : undefined,
    };
  }

  static generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${base}-${Date.now().toString(36)}`;
  }

  static createExcerpt(content: string, length = 180): string {
    // Strip markdown formatting simple pass
    const clean = content
      .replace(/#+\s/g, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`.*?`/g, '')
      .trim();
    if (clean.length <= length) return clean;
    return `${clean.substring(0, length)}...`;
  }

  static async listBlogs(params: {
    page?: number;
    limit?: number;
    tag?: string;
    search?: string;
    authorId?: string;
    publishedOnly?: boolean;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (params.publishedOnly !== false) {
      whereClause.isPublished = true;
    }

    if (params.authorId) {
      whereClause.authorId = params.authorId;
    }

    if (params.tag) {
      whereClause.tags = { has: params.tag };
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      const tagVariations = [
        q,
        q.toLowerCase(),
        q.toUpperCase(),
        q.charAt(0).toUpperCase() + q.slice(1).toLowerCase(),
      ];
      whereClause.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { excerpt: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
        { tags: { hasSome: tagVariations } },
        { author: { name: { contains: q, mode: 'insensitive' } } },
        { author: { username: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.blogPost.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
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
      prisma.blogPost.count({ where: whereClause }),
    ]);

    return {
      items: items.map(this.formatBlogPost),
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

  static async getBlogByIdOrSlug(idOrSlug: string, viewerUserId?: string): Promise<SharedBlogPost> {
    const post = await prisma.blogPost.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
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
    });

    if (!post) {
      throw new AppError('Blog post not found.', 404);
    }

    if (!post.isPublished && post.authorId !== viewerUserId) {
      throw new AppError('Blog post is not published.', 404);
    }

    return this.formatBlogPost(post);
  }

  static async createBlog(
    userId: string,
    dto: CreateBlogDto,
    coverImageBuffer?: Buffer
  ): Promise<SharedBlogPost> {
    let coverImage = dto.coverImage || null;

    if (coverImageBuffer) {
      coverImage = await uploadImageBuffer(coverImageBuffer, 'blogs', `blog_${userId}`);
    }

    const slug = this.generateSlug(dto.title);
    const excerpt = dto.excerpt?.trim() || this.createExcerpt(dto.content);
    const isPublished = dto.isPublished ?? true;
    const publishedAt = isPublished ? new Date() : null;

    const created = await prisma.blogPost.create({
      data: {
        authorId: userId,
        title: dto.title.trim(),
        slug,
        content: dto.content,
        excerpt,
        coverImage,
        tags: dto.tags || [],
        isPublished,
        publishedAt,
      },
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
    });

    return this.formatBlogPost(created);
  }

  static async updateBlog(
    userId: string,
    blogId: string,
    dto: UpdateBlogDto,
    coverImageBuffer?: Buffer
  ): Promise<SharedBlogPost> {
    const post = await prisma.blogPost.findUnique({
      where: { id: blogId },
    });

    if (!post) {
      throw new AppError('Blog post not found.', 404);
    }

    if (post.authorId !== userId) {
      throw new AppError('You do not have permission to edit this blog post.', 403);
    }

    let coverImage = post.coverImage;
    if (coverImageBuffer) {
      coverImage = await uploadImageBuffer(coverImageBuffer, 'blogs', `blog_${userId}`);
    } else if (dto.coverImage !== undefined) {
      coverImage = dto.coverImage || null;
    }

    const isPublished = dto.isPublished !== undefined ? dto.isPublished : post.isPublished;
    let publishedAt = post.publishedAt;
    if (isPublished && !post.isPublished) {
      publishedAt = new Date();
    }

    const updated = await prisma.blogPost.update({
      where: { id: blogId },
      data: {
        title: dto.title !== undefined ? dto.title.trim() : post.title,
        content: dto.content !== undefined ? dto.content : post.content,
        excerpt:
          dto.excerpt !== undefined
            ? dto.excerpt.trim()
            : dto.content !== undefined
            ? this.createExcerpt(dto.content)
            : post.excerpt,
        tags: dto.tags !== undefined ? dto.tags : post.tags,
        coverImage,
        isPublished,
        publishedAt,
      },
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
    });

    return this.formatBlogPost(updated);
  }

  static async deleteBlog(userId: string, blogId: string) {
    const post = await prisma.blogPost.findUnique({
      where: { id: blogId },
    });

    if (!post) {
      throw new AppError('Blog post not found.', 404);
    }

    if (post.authorId !== userId) {
      throw new AppError('You do not have permission to delete this blog post.', 403);
    }

    await prisma.blogPost.delete({
      where: { id: blogId },
    });

    return { message: 'Blog post deleted successfully.' };
  }
}
