import { prisma } from '@/infrastructure/database/prisma-client';
import type { Comment } from '@/domain/entities/comment';
import type { PaginatedResult } from '@/domain/types/api';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('CommentService');

const DEFAULT_PAGE_SIZE = 20;

export class CommentService {
  async list(postId: string, viewerId: string, page = 1, limit = DEFAULT_PAGE_SIZE): Promise<PaginatedResult<Comment>> {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const skip = (page - 1) * safeLimit;

    const [comments, total, viewer] = await Promise.all([
      prisma.comment.findMany({
        where: { postId },
        orderBy: { createdAt: 'asc' },
        skip,
        take: safeLimit,
        include: { author: { select: { username: true, name: true, avatarUrl: true } } },
      }),
      prisma.comment.count({ where: { postId } }),
      prisma.user.findUnique({ where: { id: viewerId }, select: { role: true } }),
    ]);

    const isAdmin = viewer?.role === 'admin';
    const data: Comment[] = comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
      author: c.author,
      canDelete: c.authorId === viewerId || isAdmin,
    }));
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));

    return { data, page, totalPages, hasMore: page < totalPages };
  }

  async create(postId: string, authorId: string, body: string): Promise<Comment> {
    const text = body.trim();
    if (!text) throw new Error('Comment is empty');
    if (text.length > 1000) throw new Error('Comment too long');

    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) throw new Error('Post not found');

    const comment = await prisma.comment.create({
      data: { postId, authorId, body: text },
      include: { author: { select: { username: true, name: true, avatarUrl: true } } },
    });

    logger.info(`Comment created on post ${postId}`);
    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      author: comment.author,
      canDelete: true,
    };
  }

  async delete(commentId: string, userId: string): Promise<void> {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return;

    const viewer = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (comment.authorId !== userId && viewer?.role !== 'admin') throw new Error('Forbidden');

    await prisma.comment.delete({ where: { id: commentId } });
    logger.info(`Comment deleted: ${commentId}`);
  }
}
