import { prisma } from '../config/prisma.js';
import { NotificationType, Notification as SharedNotification } from '@devconnect/shared';
import { sendRealTimeNotification } from '../sockets/socket.js';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityId?: string | null;
  entityType?: string | null;
  metadata?: Record<string, any>;
}

export class NotificationService {
  static async createNotification(params: CreateNotificationParams): Promise<SharedNotification> {
    const created = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        entityId: params.entityId || null,
        entityType: params.entityType || null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });

    const formatted: SharedNotification = {
      id: created.id,
      userId: created.userId,
      type: created.type as NotificationType,
      title: created.title,
      message: created.message,
      entityId: created.entityId,
      entityType: created.entityType,
      isRead: created.isRead,
      createdAt: created.createdAt.toISOString(),
      metadata: created.metadata ? JSON.parse(created.metadata) : null,
    };

    // Emit real-time notification via Socket.io
    sendRealTimeNotification(params.userId, formatted);

    return formatted;
  }

  static async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({
        where: { userId },
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    const formattedItems: SharedNotification[] = items.map((item) => ({
      id: item.id,
      userId: item.userId,
      type: item.type as NotificationType,
      title: item.title,
      message: item.message,
      entityId: item.entityId,
      entityType: item.entityType,
      isRead: item.isRead,
      createdAt: item.createdAt.toISOString(),
      metadata: item.metadata ? JSON.parse(item.metadata) : null,
    }));

    return {
      items: formattedItems,
      unreadCount,
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

  static async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
