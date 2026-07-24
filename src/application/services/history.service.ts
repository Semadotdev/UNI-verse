import { prisma } from '@/infrastructure/database/prisma-client';

export class HistoryService {
  async getHistory(userId: string) {
    return prisma.readingHistory.findMany({
      where: { userId },
      orderBy: { readAt: 'desc' },
      take: 50,
    });
  }

  async updateProgress(
    userId: string,
    providerId: string,
    mangaId: string,
    data: {
      chapterId: string;
      chapterNum: number;
      title?: string;
      coverUrl?: string;
      progress?: number;
      completed?: boolean;
    }
  ) {
    return prisma.readingHistory.upsert({
      where: { userId_providerId_mangaId: { userId, providerId, mangaId } },
      create: {
        userId,
        providerId,
        mangaId,
        ...data,
      },
      update: {
        ...data,
        readAt: new Date(),
      },
    });
  }

  async clearHistory(userId: string, id: string) {
    return prisma.readingHistory.deleteMany({
      where: { id, userId },
    });
  }

  async clearAllHistory(userId: string) {
    return prisma.readingHistory.deleteMany({
      where: { userId },
    });
  }
}
