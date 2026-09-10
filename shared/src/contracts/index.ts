import { User, DeveloperProfile, Project, BlogPost, UserSkill, Connection, Notification, DashboardStats } from '../types/index.js';
import { ConnectionStatus, SkillCategory } from '../enums/index.js';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  message: string;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;

// Auth DTOs
export interface RegisterDto {
  name: string;
  email: string;
  username: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthUserResponse {
  user: User;
}

// Profile DTOs
export interface UpdateProfileDto {
  name?: string;
  bio?: string;
  location?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
}

export interface AddSkillDto {
  name: string;
  category?: SkillCategory;
  yearsOfExperience?: number;
}

// Project DTOs
export interface CreateProjectDto {
  title: string;
  description: string;
  techStack: string[];
  githubUrl?: string;
  liveDemoUrl?: string;
  imageUrl?: string;
}

export interface UpdateProjectDto extends Partial<CreateProjectDto> {}

// Blog DTOs
export interface CreateBlogDto {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  tags: string[];
  isPublished?: boolean;
}

export interface UpdateBlogDto extends Partial<CreateBlogDto> {}

// Search & Discovery DTOs
export interface SearchDevelopersQuery {
  q?: string;
  skill?: string;
  location?: string;
  page?: number;
  limit?: number;
}

export interface GlobalSearchQuery {
  q?: string;
  type?: 'all' | 'developers' | 'projects' | 'publications';
  page?: number;
  limit?: number;
}

export interface DiscoveryFiltersResponse {
  skills: string[];
  locations: string[];
  techStacks: string[];
  blogTags: string[];
}

export interface GlobalSearchResult {
  developers: {
    items: any[];
    total: number;
  };
  projects: {
    items: Project[];
    total: number;
  };
  publications: {
    items: BlogPost[];
    total: number;
  };
  counts: {
    developers: number;
    projects: number;
    publications: number;
    total: number;
  };
}

// Connection DTOs
export interface CreateConnectionRequestDto {
  receiverId: string;
}

export interface RespondConnectionRequestDto {
  action: 'ACCEPT' | 'REJECT';
}

// Endorsement DTOs
export interface EndorseSkillDto {
  userSkillId: string;
}

// Socket Realtime Contracts
export interface SocketNotificationPayload {
  notification: Notification;
}

// Dashboard Contracts
export interface DashboardDataResponse {
  stats: DashboardStats;
  userProjects: Project[];
  userBlogs: BlogPost[];
  network: {
    incomingRequests: Array<{
      id: string;
      createdAt: string;
      requester: {
        id: string;
        username: string;
        name: string;
        avatarUrl?: string | null;
        bio?: string | null;
        location?: string | null;
        skills?: Array<{ id: string; name: string }>;
      };
    }>;
    recentConnections: Array<{
      id: string;
      connectedSince: string;
      connectedUser: {
        id: string;
        username: string;
        name: string;
        avatarUrl?: string | null;
        bio?: string | null;
        location?: string | null;
      };
    }>;
    totalConnections: number;
    pendingCount: number;
  };
  recentActivity: Notification[];
  suggestions: Array<{
    id: string;
    username: string;
    name: string;
    avatarUrl?: string | null;
    bio?: string | null;
    location?: string | null;
    skills: string[];
  }>;
  latestProjects: Project[];
  trendingBlogs: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    tags: string[];
    createdAt: string;
    author?: {
      id: string;
      username: string;
      name: string;
      avatarUrl?: string | null;
    };
  }>;
}
