import { prisma } from '@/infrastructure/database/prisma-client';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('LibraryService');

export class LibraryService {
  async getLibrary(userId: string, folderId?: string) {
    const where: Record<string, unknown> = { userId };
    if (folderId === 'null') {
      where.folderId = null;
    } else if (folderId) {
      where.folderId = folderId;
    }
    return prisma.library.findMany({
      where,
      include: { bookmarks: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async addToLibrary(
    userId: string,
    providerId: string,
    mangaId: string,
    data: { title: string; coverUrl: string; status?: string; categories?: string[]; folderId?: string }
  ) {
    const existing = await prisma.library.findUnique({
      where: { userId_providerId_mangaId: { userId, providerId, mangaId } },
    });

    if (existing) {
      logger.info(`Manga already in library: ${mangaId}`);
      return existing;
    }

    return prisma.library.create({
      data: {
        userId,
        providerId,
        mangaId,
        title: data.title,
        coverUrl: data.coverUrl,
        status: data.status || 'unknown',
        categories: data.categories || [],
        folderId: data.folderId || null,
      },
    });
  }

  async removeFromLibrary(userId: string, id: string) {
    return prisma.library.deleteMany({
      where: { id, userId },
    });
  }

  async updateBookmark(
    userId: string,
    libraryId: string,
    chapterId: string,
    data: { chapterNum: number; title?: string; read?: boolean; progress?: number }
  ) {
    const library = await prisma.library.findFirst({
      where: { id: libraryId, userId },
    });
    if (!library) throw new Error('Library entry not found');

    const existing = await prisma.bookmark.findUnique({
      where: { libraryId_chapterId: { libraryId, chapterId } },
    });

    if (existing) {
      return prisma.bookmark.update({
        where: { id: existing.id },
        data,
      });
    }

    return prisma.bookmark.create({
      data: {
        libraryId,
        chapterId,
        ...data,
      },
    });
  }

  async getFolders(userId: string) {
    const folders = await prisma.folder.findMany({
      where: { userId },
      include: { _count: { select: { items: true } } },
      orderBy: { name: 'asc' },
    });
    return folders.map((f) => ({
      id: f.id,
      name: f.name,
      count: f._count.items,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    }));
  }

  async createFolder(userId: string, name: string) {
    return prisma.folder.create({
      data: { userId, name: name.trim() },
    });
  }

  async renameFolder(userId: string, folderId: string, name: string) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId },
    });
    if (!folder) throw new Error('Folder not found');

    return prisma.folder.update({
      where: { id: folderId },
      data: { name: name.trim() },
    });
  }

  async deleteFolder(userId: string, folderId: string) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId },
    });
    if (!folder) throw new Error('Folder not found');

    // Move items to uncategorized before deleting
    await prisma.library.updateMany({
      where: { folderId },
      data: { folderId: null },
    });

    return prisma.folder.delete({
      where: { id: folderId },
    });
  }

  async moveToFolder(userId: string, libraryId: string, folderId: string | null) {
    const item = await prisma.library.findFirst({
      where: { id: libraryId, userId },
    });
    if (!item) throw new Error('Library entry not found');

    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: { id: folderId, userId },
      });
      if (!folder) throw new Error('Folder not found');
    }

    return prisma.library.update({
      where: { id: libraryId },
      data: { folderId },
    });
  }
}
