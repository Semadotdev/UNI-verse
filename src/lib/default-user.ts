import { prisma } from '@/infrastructure/database/prisma-client';

export const DEFAULT_USER_ID = 'default-user';

export async function ensureDefaultUser() {
  await prisma.user.upsert({
    where: { id: DEFAULT_USER_ID },
    create: { id: DEFAULT_USER_ID, email: 'default@mihon.local', username: 'default_user', name: 'Default User' },
    update: {},
  });
}
