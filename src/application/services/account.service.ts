import { prisma } from '@/infrastructure/database/prisma-client';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export class AccountService {
  async deleteAccount(userId: string) {
    await prisma.user.delete({ where: { id: userId } });

    const admin = getSupabaseAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      throw new Error(error.message);
    }

    return { deleted: true as const };
  }
}
