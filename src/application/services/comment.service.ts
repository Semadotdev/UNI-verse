import { prisma } from '@/infrastructure/database/prisma-client';
import type { Comment } from '@/domain/entities/comment';
import type { PaginatedResult } from '@/domain/types/api';
import { NotificationService } from '@/application/services/notification.service';
import { ForbiddenError } from '@/shared/errors/forbidden-error';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('CommentService');

const DEFAULT_PAGE_SIZE = 20;

interface CommentWithAuthor {
  id: string;
  body: string;
  parentId: string | null;
  createdAt: Date;
  authorId: string;
  author: { username: string | null; name: string | null; avatarUrl: string | null };
}

function mapComment(c: CommentWithAuthor, viewerId: string, isAdmin: boolean): Comment {
  return {
    id: c.id,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
    author: c.author,
    parentId: c.parentId,
    replies: [],
    canDelete: c.authorId === viewerId || isAdmin,
  };
}

export class CommentService {
  private readonly notificationService = new NotificationService();

  async list(postId: string, viewerId: string, page = 1, limit = DEFAULT_PAGE_SIZE): Promise<PaginatedResult<Comment>> {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const skip = (page - 1) * safeLimit;

    const [comments, total, viewer] = await Promise.all([
      prisma.comment.findMany({
        where: { postId, parentId: null },
        orderBy: { createdAt: 'asc' },
        skip,
        take: safeLimit,
        include: {
          author: { select: { username: true, name: true, avatarUrl: true } },
          replies: {
            orderBy: { createdAt: 'asc' },
            include: { author: { select: { username: true, name: true, avatarUrl: true } } },
          },
        },
      }),
      prisma.comment.count({ where: { postId, parentId: null } }),
      prisma.user.findUnique({ where: { id: viewerId }, select: { role: true } }),
    ]);

    const isAdmin = viewer?.role === 'admin';
    const data: Comment[] = comments.map((c) => {
      const mapped: Comment = {
        ...mapComment(c, viewerId, isAdmin),
        replies: c.replies.map((r) => mapComment(r, viewerId, isAdmin)),
      };
      return mapped;
    });
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));

    return { data, page, totalPages, hasMore: page < totalPages };
  }

  async create(postId: string, authorId: string, body: string, parentId?: string): Promise<Comment> {
    const text = body.trim();
    if (!text) throw new Error('Comment is empty');
    if (text.length > 1000) throw new Error('Comment too long');

    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, authorId: true } });
    if (!post) throw new Error('Post not found');

    let normalizedParentId: string | undefined;
    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent) throw new Error('Comment not found');
      if (parent.postId !== postId) throw new Error('Reply must belong to the same post');
      normalizedParentId = parent.parentId ?? parent.id;
    }

    const comment = await prisma.comment.create({
      data: { postId, authorId, body: text, parentId: normalizedParentId },
      include: { author: { select: { username: true, name: true, avatarUrl: true } } },
    });

    await this.notificationService.onPostCommented(postId, authorId, comment.id);
    if (normalizedParentId) {
      const parentAuthor = await prisma.comment.findUnique({
        where: { id: normalizedParentId },
        select: { authorId: true },
      });
      if (parentAuthor && parentAuthor.authorId !== authorId && parentAuthor.authorId !== post.authorId) {
        await this.notificationService.onCommentReplied(normalizedParentId, postId, authorId, comment.id);
      }
    }

    logger.info(`Comment created on post ${postId}`);
    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      author: comment.author,
      parentId: comment.parentId,
      replies: [],
      canDelete: true,
    };
  }

  async delete(commentId: string, userId: string): Promise<void> {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return;

    const viewer = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (comment.authorId !== userId && viewer?.role !== 'admin') throw new ForbiddenError();

    if (comment.authorId !== userId) {
      await this.notificationService.onContentRemoved(
        comment.authorId,
        userId,
        'comment_removed',
        comment.body,
        comment.postId
      );
    }

    await prisma.comment.delete({ where: { id: commentId } });
    logger.info(`Comment deleted: ${commentId}`);
  }
}
