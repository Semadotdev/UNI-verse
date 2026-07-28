import { getSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/infrastructure/database/prisma-client';

export async function getAuthUserId(): Promise<string> {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  await prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email ?? '',
      username: user.user_metadata?.username ?? user.email?.split('@')[0] ?? '',
      name: user.user_metadata?.name ?? user.email?.split('@')[0] ?? '',
    },
    update: {},
  });

  return user.id;
}
