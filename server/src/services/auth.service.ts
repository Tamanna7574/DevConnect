import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { ENV } from '../config/env.js';
import { AppError } from '../middlewares/error.middleware.js';
import { RegisterDto, LoginDto, User as SharedUser } from '@devconnect/shared';

export class AuthService {
  static generateToken(userId: string, email: string, username: string): string {
    return jwt.sign({ userId, email, username }, ENV.JWT_SECRET, {
      expiresIn: '7d',
    });
  }

  static sanitizeUser(user: any): SharedUser {
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
    };
  }

  static async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const username = dto.username.toLowerCase().trim();

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      throw new AppError('An account with this email already exists.', 409);
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      throw new AppError('This username is already taken. Please choose another.', 409);
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        username,
        name: dto.name.trim(),
        passwordHash,
      },
    });

    const token = this.generateToken(user.id, user.email, user.username);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  static async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw new AppError('Invalid email or password.', 401);
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    const token = this.generateToken(user.id, user.email, user.username);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    return this.sanitizeUser(user);
  }

  static async handleGitHubAuth(githubProfile: {
    githubId: string;
    email: string;
    name: string;
    username: string;
    avatarUrl?: string;
  }) {
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { githubId: githubProfile.githubId },
          { email: githubProfile.email.toLowerCase() },
        ],
      },
    });

    if (user) {
      // Update githubId if not attached
      if (!user.githubId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { githubId: githubProfile.githubId },
        });
      }
    } else {
      // Generate a unique username if necessary
      let username = githubProfile.username.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) {
        username = `${username}_${Math.floor(1000 + Math.random() * 9000)}`;
      }

      user = await prisma.user.create({
        data: {
          email: githubProfile.email.toLowerCase(),
          username,
          name: githubProfile.name || username,
          avatarUrl: githubProfile.avatarUrl,
          githubId: githubProfile.githubId,
          githubUrl: `https://github.com/${githubProfile.username}`,
        },
      });
    }

    const token = this.generateToken(user.id, user.email, user.username);
    return {
      user: this.sanitizeUser(user),
      token,
    };
  }
}
