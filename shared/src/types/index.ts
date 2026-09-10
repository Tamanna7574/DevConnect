import { ConnectionStatus, NotificationType, SkillCategory } from '../enums/index.js';

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  githubId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  createdAt: string;
}

export interface Endorsement {
  id: string;
  userSkillId: string;
  endorserId: string;
  endorser: UserSummary;
  createdAt: string;
}

export interface UserSkill {
  id: string;
  userId: string;
  skillId: string;
  yearsOfExperience: number | null;
  skill: Skill;
  endorsements: Endorsement[];
  _count?: {
    endorsements: number;
  };
  createdAt: string;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  techStack: string[];
  githubUrl: string | null;
  liveDemoUrl: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  user?: UserSummary;
}

export interface BlogPost {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string | null;
  tags: string[];
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author?: UserSummary;
}

export interface Connection {
  id: string;
  requesterId: string;
  receiverId: string;
  status: ConnectionStatus;
  createdAt: string;
  updatedAt: string;
  requester?: UserSummary;
  receiver?: UserSummary;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityId: string | null;
  entityType?: string | null;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, any> | null;
}

export interface DeveloperProfile extends User {
  skills: UserSkill[];
  projects: Project[];
  blogPosts: BlogPost[];
  connectionsCount: number;
  mutualConnectionsCount?: number;
  connectionStatus?: {
    id?: string;
    status: ConnectionStatus | 'NONE' | 'SELF';
    isRequester?: boolean;
  };
}

export interface DashboardStats {
  projectsCount: number;
  blogPostsCount: number;
  connectionsCount: number;
  endorsementsCount: number;
  pendingRequestsCount: number;
  skillsCount: number;
}
