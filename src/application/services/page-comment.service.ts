import { prisma } from '@/infrastructure/database/prisma-client';
import type { PageComment } from '@/domain/entities/page-comment';
import { NotificationService } from '@/application/services/notification.service';
import { ForbiddenError } from '@/shared/errors/forbidden-error';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('PageCommentService');

interface PageCommentWithAuthor {
  id: string;
  body: string;
  parentId: string | null;
  createdAt: Date;
  authorId: string;
  providerId: string;
  mangaId: string;
  chapterId: string;
  pageIndex: number;
  pageY: number;
  author: { username: string | null; name: string | null; avatarUrl: string | null };
  replies?: PageCommentWithAuthor[];
}

function mapComment(c: PageCommentWithAuthor, viewerId: string, isAdmin: boolean): PageComment {
  return {
    id: c.id,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
    author: c.author,
    parentId: c.parentId,
    replies: [],
    pageIndex: c.pageIndex,
    pageY: c.pageY,
    canDelete: c.authorId === viewerId || isAdmin,
  };
}

export class PageCommentService {
  private readonly notificationService = new NotificationService();

  async listByChapter(
    providerId: string,
    mangaId: string,
    chapterId: string,
    viewerId: string
  ): Promise<PageComment[]> {
    const [comments, viewer] = await Promise.all([
      prisma.pageComment.findMany({
        where: { providerId, mangaId, chapterId, parentId: null },
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { username: true, name: true, avatarUrl: true } },
          replies: {
            orderBy: { createdAt: 'asc' },
            include: { author: { select: { username: true, name: true, avatarUrl: true } } },
          },
        },
      }),
      prisma.user.findUnique({ where: { id: viewerId }, select: { role: true } }),
    ]);

    const isAdmin = viewer?.role === 'admin';
    return comments.map((c) => {
      const mapped: PageComment = {
        ...mapComment(c, viewerId, isAdmin),
        replies: c.replies.map((r) => mapComment(r, viewerId, isAdmin)),
      };
      return mapped;
    });
  }

  async create(
    providerId: string,
    mangaId: string,
    chapterId: string,
    pageIndex: number,
    pageY: number,
    body: string,
    authorId: string,
    parentId?: string
  ): Promise<PageComment> {
    const text = body.trim();
    if (!text) throw new Error('Comment is empty');
    if (text.length > 1000) throw new Error('Comment too long');

    let normalizedParentId: string | undefined;
    if (parentId) {
      const parent = await prisma.pageComment.findUnique({ where: { id: parentId } });
      if (!parent) throw new Error('Comment not found');
      if (parent.chapterId !== chapterId) throw new Error('Reply must belong to the same chapter');
      normalizedParentId = parent.parentId ?? parent.id;
    }

    const comment = await prisma.pageComment.create({
      data: {
        providerId,
        mangaId,
        chapterId,
        pageIndex,
        pageY,
        authorId,
        body: text,
        parentId: normalizedParentId,
      },
      include: { author: { select: { username: true, name: true, avatarUrl: true } } },
    });

    await this.notificationService.onPageCommentCreated(
      providerId, mangaId, chapterId, authorId, comment.id
    );
    if (normalizedParentId) {
      const parentAuthor = await prisma.pageComment.findUnique({
        where: { id: normalizedParentId },
        select: { authorId: true },
      });
      if (parentAuthor && parentAuthor.authorId !== authorId) {
        await this.notificationService.onPageCommentReplied(
          normalizedParentId, providerId, mangaId, chapterId, authorId, comment.id
        );
      }
    }

    logger.info(`Page comment created on ${providerId}/${mangaId}/${chapterId} page ${pageIndex}`);
    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      author: comment.author,
      parentId: comment.parentId,
      replies: [],
      pageIndex: comment.pageIndex,
      pageY: comment.pageY,
      canDelete: true,
    };
  }

  async delete(commentId: string, userId: string): Promise<void> {
    const comment = await prisma.pageComment.findUnique({ where: { id: commentId } });
    if (!comment) return;

    const viewer = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (comment.authorId !== userId && viewer?.role !== 'admin') throw new ForbiddenError();

    if (comment.authorId !== userId) {
      await this.notificationService.onContentRemoved(
        comment.authorId,
        userId,
        'comment_removed',
        comment.body
      );
    }

    await prisma.pageComment.delete({ where: { id: commentId } });
    logger.info(`Page comment deleted: ${commentId}`);
  }

  async report(commentId: string, reporterId: string, reason?: string): Promise<void> {
    const comment = await prisma.pageComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new Error('Comment not found');
    if (comment.authorId === reporterId) throw new Error('Cannot report your own comment');

    await prisma.pageCommentReport.upsert({
      where: { commentId_reporterId: { commentId, reporterId } },
      create: { commentId, reporterId, reason: reason ?? null },
      update: { reason: reason ?? null },
    });
    logger.info(`Page comment reported: ${commentId} by ${reporterId}`);
  }
}
