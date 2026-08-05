import { prisma } from '@/infrastructure/database/prisma-client';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('FriendService');

export class FriendService {
  async addFriend(userId: string, username: string): Promise<{ username: string }> {
    const friend = await prisma.user.findUnique({ where: { username }, select: { id: true, username: true } });
    if (!friend) throw new Error('User not found');
    if (friend.id === userId) throw new Error("You can't add yourself");

    await prisma.$transaction([
      prisma.friend.upsert({
        where: { userId_friendId: { userId, friendId: friend.id } },
        create: { userId, friendId: friend.id },
        update: {},
      }),
      prisma.friend.upsert({
        where: { userId_friendId: { userId: friend.id, friendId: userId } },
        create: { userId: friend.id, friendId: userId },
        update: {},
      }),
    ]);

    logger.info(`User ${userId} added ${friend.id} as friend`);
    return { username: friend.username ?? username };
  }

  async removeFriend(userId: string, username: string): Promise<void> {
    const friend = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!friend) throw new Error('User not found');
    if (friend.id === userId) throw new Error("You can't unfriend yourself");

    await prisma.$transaction([
      prisma.friend.deleteMany({ where: { userId, friendId: friend.id } }),
      prisma.friend.deleteMany({ where: { userId: friend.id, friendId: userId } }),
    ]);

    logger.info(`User ${userId} removed ${friend.id} as friend`);
  }

  async isFriend(userId: string, friendId: string): Promise<boolean> {
    const row = await prisma.friend.findUnique({
      where: { userId_friendId: { userId, friendId } },
      select: { id: true },
    });
    return Boolean(row);
  }

  async friendCount(userId: string): Promise<number> {
    return prisma.friend.count({ where: { userId } });
  }
}
