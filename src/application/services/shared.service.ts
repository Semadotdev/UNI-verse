import { prisma } from '@/infrastructure/database/prisma-client';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('SharedService');

export class SharedService {
  private async getOwnedShare(folderId: string, userId: string) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId },
      include: { shared: true },
    });
    if (!folder) throw new Error('Folder not found');
    return { folder, share: folder.shared };
  }

  async getShare(folderId: string, userId: string): Promise<{ token: string; url: string } | null> {
    const { share } = await this.getOwnedShare(folderId, userId);
    return share ? this.toShare(share.token) : null;
  }

  async enableShare(folderId: string, userId: string): Promise<{ token: string; url: string }> {
    const { share } = await this.getOwnedShare(folderId, userId);
    if (share) return this.toShare(share.token);

    const created = await prisma.sharedFolder.create({
      data: {
        folderId,
        token: this.generateToken(),
      },
    });
    logger.info(`Enabled sharing for folder: ${folderId}`);
    return this.toShare(created.token);
  }

  async disableShare(folderId: string, userId: string): Promise<void> {
    await this.getOwnedShare(folderId, userId);
    await prisma.sharedFolder.deleteMany({ where: { folderId } });
    logger.info(`Disabled sharing for folder: ${folderId}`);
  }

  async getSharedFolder(token: string) {
    const shared = await prisma.sharedFolder.findUnique({
      where: { token },
      include: {
        folder: {
          include: {
            user: true,
            items: {
              orderBy: { updatedAt: 'desc' },
            },
          },
        },
      },
    });
    if (!shared) return null;

    return {
      folderName: shared.folder.name,
      ownerName:
        shared.folder.user.username ??
        shared.folder.user.name ??
        shared.folder.user.email,
      items: shared.folder.items.map((item) => ({
        providerId: item.providerId,
        mangaId: item.mangaId,
        title: item.title,
        coverUrl: item.coverUrl,
        categories: item.categories,
      })),
    };
  }

  private toShare(token: string) {
    return { token, url: `/s/${token}` };
  }

  private generateToken(): string {
    return crypto.randomUUID().replace(/-/g, '');
  }
}
