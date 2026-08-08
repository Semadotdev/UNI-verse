import { prisma } from '@/infrastructure/database/prisma-client';
import { requireAdmin } from '@/lib/admin';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('AdminService');

export interface AdminStats {
  totalUsers: number;
  newUsersToday: number;
  totalPosts: number;
  postsToday: number;
  totalComments: number;
  commentsToday: number;
  pendingReports: number;
  totalLikes: number;
  libraryEntries: number;
  providersEnabled: number;
  providersTotal: number;
  recentUsers: {
    id: string;
    username: string | null;
    name: string | null;
    createdAt: string;
  }[];
}

function startOfToday(): Date {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return start;
}

export class AdminService {
  async getStats(viewerId: string): Promise<AdminStats> {
    await requireAdmin(viewerId);

    const sinceToday = startOfToday();
    const [totalUsers, newUsersToday, totalPosts, postsToday, totalComments, commentsToday, pendingPostReports, pendingCommentReports, totalLikes, libraryEntries, providersEnabled, providersTotal, recentUsers] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: sinceToday } } }),
        prisma.post.count(),
        prisma.post.count({ where: { createdAt: { gte: sinceToday } } }),
        prisma.comment.count(),
        prisma.comment.count({ where: { createdAt: { gte: sinceToday } } }),
        prisma.postReport.count(),
        prisma.commentReport.count(),
        prisma.like.count(),
        prisma.library.count(),
        prisma.provider.count({ where: { enabled: true } }),
        prisma.provider.count(),
        prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, username: true, name: true, createdAt: true },
        }),
      ]);

    const stats: AdminStats = {
      totalUsers,
      newUsersToday,
      totalPosts,
      postsToday,
      totalComments,
      commentsToday,
      pendingReports: pendingPostReports + pendingCommentReports,
      totalLikes,
      libraryEntries,
      providersEnabled,
      providersTotal,
      recentUsers: recentUsers.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })),
    };

    logger.info('Admin stats fetched');
    return stats;
  }
}
