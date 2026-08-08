import { prisma } from '@/infrastructure/database/prisma-client';
import { ForbiddenError } from '@/shared/errors/forbidden-error';

export async function requireAdmin(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== 'admin') throw new ForbiddenError();
}
