import { prisma } from '@/infrastructure/database/prisma-client';

export const CHAPTER_REWARD_COINS = 1;

export class RewardService {
  async awardChapterCompletion(
    userId: string,
    providerId: string,
    mangaId: string,
    chapterId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.readChapter.updateMany({
        where: { userId, providerId, mangaId, chapterId, rewardedAt: null },
        data: { rewardedAt: new Date() },
      });
      if (updated.count === 0) {
        const existing = await tx.readChapter.findUnique({
          where: {
            userId_providerId_mangaId_chapterId: { userId, providerId, mangaId, chapterId },
          },
          select: { rewardedAt: true },
        });
        if (existing?.rewardedAt) {
          return { rewarded: false as const, alreadyRewarded: true as const };
        }
        await tx.readChapter.create({
          data: { userId, providerId, mangaId, chapterId, rewardedAt: new Date() },
        });
      }
      const user = await tx.user.update({
        where: { id: userId },
        data: { coins: { increment: CHAPTER_REWARD_COINS } },
        select: { coins: true },
      });
      return { rewarded: true as const, balance: user.coins };
    });
  }
}
