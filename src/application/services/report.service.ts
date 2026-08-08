import { prisma } from '@/infrastructure/database/prisma-client';
import type { PaginatedResult } from '@/domain/types/api';
import { requireAdmin } from '@/lib/admin';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('ReportService');

export interface AdminReportItem {
  id: string;
  type: 'post' | 'comment';
  contentId: string;
  content: string;
  reason: string | null;
  createdAt: string;
  reporter: { username: string | null; name: string | null };
}

const DEFAULT_PAGE_SIZE = 20;

export class ReportService {
  async reportPost(postId: string, reporterId: string, reason?: string): Promise<void> {
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) throw new Error('Post not found');

    await prisma.postReport.upsert({
      where: { postId_reporterId: { postId, reporterId } },
      create: { postId, reporterId, reason },
      update: { reason },
    });
    logger.info(`Post reported: ${postId}`);
  }

  async reportComment(commentId: string, reporterId: string, reason?: string): Promise<void> {
    const comment = await prisma.comment.findUnique({ where: { id: commentId }, select: { id: true } });
    if (!comment) throw new Error('Comment not found');

    await prisma.commentReport.upsert({
      where: { commentId_reporterId: { commentId, reporterId } },
      create: { commentId, reporterId, reason },
      update: { reason },
    });
    logger.info(`Comment reported: ${commentId}`);
  }

  async listReports(viewerId: string, page = 1, limit = DEFAULT_PAGE_SIZE): Promise<PaginatedResult<AdminReportItem>> {
    await this.assertAdmin(viewerId);

    const [postReports, commentReports] = await Promise.all([
      prisma.postReport.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          reporter: { select: { username: true, name: true } },
          post: { select: { id: true, body: true } },
        },
      }),
      prisma.commentReport.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          reporter: { select: { username: true, name: true } },
          comment: { select: { id: true, body: true } },
        },
      }),
    ]);

    const all: AdminReportItem[] = [
      ...postReports.map((r) => ({
        id: r.id,
        type: 'post' as const,
        contentId: r.post.id,
        content: r.post.body.slice(0, 200),
        reason: r.reason,
        createdAt: r.createdAt.toISOString(),
        reporter: r.reporter,
      })),
      ...commentReports.map((r) => ({
        id: r.id,
        type: 'comment' as const,
        contentId: r.comment.id,
        content: r.comment.body.slice(0, 200),
        reason: r.reason,
        createdAt: r.createdAt.toISOString(),
        reporter: r.reporter,
      })),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const skip = (page - 1) * safeLimit;
    const data = all.slice(skip, skip + safeLimit);
    const totalPages = Math.max(1, Math.ceil(all.length / safeLimit));

    return { data, page, totalPages, hasMore: page < totalPages };
  }

  async dismiss(viewerId: string, type: 'post' | 'comment', reportId: string): Promise<void> {
    await this.assertAdmin(viewerId);

    if (type === 'post') {
      await prisma.postReport.deleteMany({ where: { id: reportId } });
    } else {
      await prisma.commentReport.deleteMany({ where: { id: reportId } });
    }
    logger.info(`Report dismissed: ${reportId}`);
  }

  private async assertAdmin(userId: string): Promise<void> {
    await requireAdmin(userId);
  }
}
