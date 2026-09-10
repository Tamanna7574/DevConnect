import { prisma } from '../config/prisma.js';
import { AppError } from '../middlewares/error.middleware.js';
import { NotificationService } from './notification.service.js';
import { NotificationType, ConnectionStatus } from '@devconnect/shared';

export class ConnectionService {
  static async sendConnectionRequest(requesterId: string, receiverId: string) {
    if (requesterId === receiverId) {
      throw new AppError('You cannot connect with yourself.', 400);
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });
    if (!receiver) {
      throw new AppError('Developer not found.', 404);
    }

    // Check existing connection
    const existing = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId, receiverId },
          { requesterId: receiverId, receiverId: requesterId },
        ],
      },
    });

    if (existing) {
      if (existing.status === ConnectionStatus.ACCEPTED) {
        throw new AppError('You are already connected with this developer.', 409);
      }
      if (existing.status === ConnectionStatus.PENDING) {
        if (existing.requesterId === requesterId) {
          throw new AppError('Connection request already sent and pending.', 409);
        } else {
          // If the other party had sent a pending request, auto-accept it!
          return this.respondConnectionRequest(existing.id, requesterId, 'ACCEPT');
        }
      }
      // If rejected earlier, update to pending
      const updated = await prisma.connection.update({
        where: { id: existing.id },
        data: {
          requesterId,
          receiverId,
          status: ConnectionStatus.PENDING,
        },
      });

      // Send notification
      const requester = await prisma.user.findUnique({ where: { id: requesterId } });
      await NotificationService.createNotification({
        userId: receiverId,
        type: NotificationType.CONNECTION_REQUEST,
        title: 'New Connection Request',
        message: `${requester?.name || 'A developer'} sent you a connection request.`,
        entityId: updated.id,
        entityType: 'Connection',
        metadata: {
          requesterId,
          requesterUsername: requester?.username,
          requesterAvatarUrl: requester?.avatarUrl,
        },
      });

      return updated;
    }

    // Create new connection request
    const connection = await prisma.connection.create({
      data: {
        requesterId,
        receiverId,
        status: ConnectionStatus.PENDING,
      },
    });

    const requester = await prisma.user.findUnique({ where: { id: requesterId } });
    await NotificationService.createNotification({
      userId: receiverId,
      type: NotificationType.CONNECTION_REQUEST,
      title: 'New Connection Request',
      message: `${requester?.name || 'A developer'} sent you a connection request.`,
      entityId: connection.id,
      entityType: 'Connection',
      metadata: {
        requesterId,
        requesterUsername: requester?.username,
        requesterAvatarUrl: requester?.avatarUrl,
      },
    });

    return connection;
  }

  static async respondConnectionRequest(
    connectionId: string,
    userId: string,
    action: 'ACCEPT' | 'REJECT'
  ) {
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
      include: {
        receiver: true,
        requester: true,
      },
    });

    if (!connection) {
      throw new AppError('Connection request not found.', 404);
    }

    if (connection.receiverId !== userId) {
      throw new AppError('You are not authorized to respond to this connection request.', 403);
    }

    if (connection.status !== ConnectionStatus.PENDING) {
      throw new AppError(`Connection request is already ${connection.status.toLowerCase()}.`, 400);
    }

    const newStatus = action === 'ACCEPT' ? ConnectionStatus.ACCEPTED : ConnectionStatus.REJECTED;

    const updated = await prisma.connection.update({
      where: { id: connectionId },
      data: { status: newStatus },
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
    });

    if (action === 'ACCEPT') {
      // Notify requester that their connection was accepted
      await NotificationService.createNotification({
        userId: connection.requesterId,
        type: NotificationType.CONNECTION_ACCEPTED,
        title: 'Connection Accepted',
        message: `${connection.receiver.name} accepted your connection request.`,
        entityId: updated.id,
        entityType: 'Connection',
        metadata: {
          connectedUserId: connection.receiverId,
          connectedUsername: connection.receiver.username,
          connectedAvatarUrl: connection.receiver.avatarUrl,
        },
      });
    }

    return updated;
  }

  static async removeConnection(connectionId: string, userId: string) {
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new AppError('Connection not found.', 404);
    }

    if (connection.requesterId !== userId && connection.receiverId !== userId) {
      throw new AppError('You are not authorized to remove this connection.', 403);
    }

    await prisma.connection.delete({
      where: { id: connectionId },
    });

    return { message: 'Connection removed successfully.' };
  }

  static async listUserConnections(userId: string) {
    const [accepted, incomingPending, outgoingPending] = await Promise.all([
      // Accepted connections
      prisma.connection.findMany({
        where: {
          OR: [
            { requesterId: userId, status: ConnectionStatus.ACCEPTED },
            { receiverId: userId, status: ConnectionStatus.ACCEPTED },
          ],
        },
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
      // Incoming pending requests
      prisma.connection.findMany({
        where: {
          receiverId: userId,
          status: ConnectionStatus.PENDING,
        },
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
        },
      }),
      // Outgoing pending requests
      prisma.connection.findMany({
        where: {
          requesterId: userId,
          status: ConnectionStatus.PENDING,
        },
        include: {
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
    ]);

    // Format accepted connections to expose the other party
    const formattedAccepted = accepted.map((c) => {
      const otherUser = c.requesterId === userId ? c.receiver : c.requester;
      return {
        id: c.id,
        connectedUser: otherUser,
        connectedSince: c.updatedAt.toISOString(),
      };
    });

    const formattedIncoming = incomingPending.map((c) => ({
      id: c.id,
      requester: c.requester,
      createdAt: c.createdAt.toISOString(),
    }));

    const formattedOutgoing = outgoingPending.map((c) => ({
      id: c.id,
      receiver: c.receiver,
      createdAt: c.createdAt.toISOString(),
    }));

    return {
      accepted: formattedAccepted,
      incoming: formattedIncoming,
      outgoing: formattedOutgoing,
    };
  }
}
