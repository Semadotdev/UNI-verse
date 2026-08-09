import { prisma } from '@/infrastructure/database/prisma-client';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
  count: number;
}

export class LeaderboardService {
  async getTopPosters(limit: number): Promise<LeaderboardEntry[]> {
    const grouped = await prisma.post.groupBy({
      by: ['authorId'],
      _count: { authorId: true },
      orderBy: { _count: { authorId: 'desc' } },
      take: limit,
    });

    return this.buildEntries(
      grouped.map((g) => ({ userId: g.authorId, count: g._count?.authorId ?? 0 }))
    );
  }

  async getTopReaders(limit: number): Promise<LeaderboardEntry[]> {
    const grouped = await prisma.readingHistory.groupBy({
      by: ['userId'],
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
      take: limit,
    });

    return this.buildEntries(
      grouped.map((g) => ({ userId: g.userId, count: g._count?.userId ?? 0 }))
    );
  }

  private async buildEntries(rows: { userId: string; count: number }[]): Promise<LeaderboardEntry[]> {
    const userIds = rows.map((r) => r.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, name: true, avatarUrl: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));

    const entries: LeaderboardEntry[] = [];
    for (const [index, row] of rows.entries()) {
      const user = byId.get(row.userId);
      if (!user) continue;
      entries.push({
        rank: index + 1,
        userId: user.id,
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl,
        count: row.count,
      });
    }
    return entries;
  }
}
