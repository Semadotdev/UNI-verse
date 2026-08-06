import { prisma } from '@/infrastructure/database/prisma-client';
import type { AppNotification } from '@/domain/entities/notification';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('NotificationService');

const DEFAULT_LIMIT = 30;

export class NotificationService {
  async onPostLiked(postId: string, actorId: string): Promise<void> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    if (!post || post.authorId === actorId) return;

    const existing = await prisma.notification.findFirst({
      where: { userId: post.authorId, actorId, postId, type: 'like' },
      select: { id: true },
    });
    if (existing) return;

    await prisma.notification.create({
      data: { userId: post.authorId, actorId, postId, type: 'like' },
    });
    logger.info(`Like notification created for post ${postId}`);
  }

  async onPostCommented(postId: string, actorId: string, commentId: string): Promise<void> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    if (!post || post.authorId === actorId) return;

    await prisma.notification.create({
      data: { userId: post.authorId, actorId, postId, commentId, type: 'comment' },
    });
    logger.info(`Comment notification created for post ${postId}`);
  }

  async onCommentReplied(parentCommentId: string, postId: string, actorId: string, commentId: string): Promise<void> {
    const parent = await prisma.comment.findUnique({
      where: { id: parentCommentId },
      select: { authorId: true },
    });
    if (!parent || parent.authorId === actorId) return;

    await prisma.notification.create({
      data: { userId: parent.authorId, actorId, postId, commentId, type: 'reply' },
    });
    logger.info(`Reply notification created for comment ${parentCommentId}`);
  }

  async onFriendAdded(actorId: string, friendId: string): Promise<void> {
    const existing = await prisma.notification.findFirst({
      where: { userId: friendId, actorId, type: 'friend' },
      select: { id: true },
    });
    if (existing) return;

    await prisma.notification.create({
      data: { userId: friendId, actorId, type: 'friend' },
    });
    logger.info(`Friend notification created for ${friendId}`);
  }

  async listForUser(userId: string, limit = DEFAULT_LIMIT): Promise<AppNotification[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
      include: {
        actor: { select: { username: true, name: true, avatarUrl: true } },
        post: { select: { body: true } },
        comment: { select: { body: true } },
      },
    });

    return notifications.map((n) => ({
      id: n.id,
      type: n.type as AppNotification['type'],
      postId: n.postId,
      commentId: n.commentId,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
      actor: n.actor,
      postSnippet: n.post?.body ?? null,
      commentSnippet: n.comment?.body ?? null,
    }));
  }

  async unreadCount(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, read: false } });
  }

  async markAllRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
}
