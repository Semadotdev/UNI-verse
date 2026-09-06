import { getSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/infrastructure/database/prisma-client';

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

const knownUsers = new Set<string>();

export function resetKnownUsers(): void {
  knownUsers.clear();
}

export async function getAuthUserId(): Promise<string> {
  const supabase = await getSupabaseServerClient();

  let user: { id: string; email: string | null; user_metadata: Record<string, unknown> };

  try {
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();
    if (error || !authUser) {
      throw new UnauthorizedError();
    }
    user = authUser as { id: string; email: string | null; user_metadata: Record<string, unknown> };
  } catch (origin) {
    if (origin instanceof UnauthorizedError) {
      throw origin;
    }
    throw new UnauthorizedError();
  }

  if (knownUsers.has(user.id)) {
    return user.id;
  }

  const existing = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true },
  });

  if (existing) {
    knownUsers.add(user.id);
    return user.id;
  }

  await prisma.user.create({
    data: {
      id: user.id,
      email: user.email ?? '',
      username: (user.user_metadata?.username as string | undefined) ?? user.email?.split('@')[0] ?? '',
      name: (user.user_metadata?.name as string | undefined) ?? user.email?.split('@')[0] ?? '',
    },
  });
  knownUsers.add(user.id);

  return user.id;
}