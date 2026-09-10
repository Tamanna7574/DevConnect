import { prisma } from '../config/prisma.js';
import { AppError } from '../middlewares/error.middleware.js';
import { NotificationService } from './notification.service.js';
import { NotificationType, ConnectionStatus } from '@devconnect/shared';

export class EndorsementService {
  static async endorseSkill(endorserId: string, userSkillId: string) {
    // 1. Fetch the userSkill and skill owner
    const userSkill = await prisma.userSkill.findUnique({
      where: { id: userSkillId },
      include: {
        skill: true,
        user: true,
      },
    });

    if (!userSkill) {
      throw new AppError('Skill not found on developer profile.', 404);
    }

    const skillOwnerId = userSkill.userId;

    // Rule 1: Cannot endorse oneself
    if (endorserId === skillOwnerId) {
      throw new AppError('You cannot endorse your own skill.', 400);
    }

    // Rule 2: Must be connected with the developer to endorse skills
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: endorserId, receiverId: skillOwnerId, status: ConnectionStatus.ACCEPTED },
          { requesterId: skillOwnerId, receiverId: endorserId, status: ConnectionStatus.ACCEPTED },
        ],
      },
    });

    if (!connection) {
      throw new AppError(
        'You must be connected with this developer to endorse their skills.',
        403
      );
    }

    // Rule 3: Check for duplicate endorsement
    const existingEndorsement = await prisma.endorsement.findUnique({
      where: {
        userSkillId_endorserId: {
          userSkillId,
          endorserId,
        },
      },
    }).catch(() => null);

    if (existingEndorsement) {
      throw new AppError('You have already endorsed this skill.', 409);
    }

    // Create endorsement
    const endorsement = await prisma.endorsement.create({
      data: {
        userSkillId,
        endorserId,
      },
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
    });

    // Notify skill owner
    const endorser = await prisma.user.findUnique({ where: { id: endorserId } });
    await NotificationService.createNotification({
      userId: skillOwnerId,
      type: NotificationType.SKILL_ENDORSEMENT,
      title: 'Skill Endorsed!',
      message: `${endorser?.name || 'A developer'} endorsed your ${userSkill.skill.name} skill.`,
      entityId: userSkillId,
      entityType: 'UserSkill',
      metadata: {
        skillName: userSkill.skill.name,
        endorserId,
        endorserUsername: endorser?.username,
        endorserAvatarUrl: endorser?.avatarUrl,
      },
    });

    return endorsement;
  }

  static async removeEndorsement(endorserId: string, userSkillId: string) {
    const existing = await prisma.endorsement.findUnique({
      where: {
        userSkillId_endorserId: {
          userSkillId,
          endorserId,
        },
      },
    });

    if (!existing) {
      throw new AppError('Endorsement not found.', 404);
    }

    await prisma.endorsement.delete({
      where: { id: existing.id },
    });

    return { message: 'Endorsement removed successfully.' };
  }

  static async listEndorsers(userSkillId: string) {
    const endorsements = await prisma.endorsement.findMany({
      where: { userSkillId },
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
      orderBy: { createdAt: 'desc' },
    });

    return endorsements.map((e) => ({
      id: e.id,
      createdAt: e.createdAt.toISOString(),
      endorser: e.endorser,
    }));
  }
}
