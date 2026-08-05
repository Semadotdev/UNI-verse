import { prisma } from '@/infrastructure/database/prisma-client';
import type { Prisma } from '@prisma/client';
import type { Post, CreatePostInput, UpdatePostInput } from '@/domain/entities/post';
import type { PaginatedResult } from '@/domain/types/api';
import { UploadService } from '@/application/services/upload.service';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('PostService');

const DEFAULT_PAGE_SIZE = 10;
const MAX_IMAGES = 4;
const MAX_BODY_LENGTH = 5000;

const POST_INCLUDE = {
  author: { select: { username: true, name: true, avatarUrl: true } },
  images: { orderBy: { position: 'asc' as const }, select: { url: true } },
  folder: {
    select: {
      id: true,
      name: true,
      _count: { select: { items: true } },
      items: { take: 6, orderBy: { updatedAt: 'desc' }, select: { providerId: true, mangaId: true, coverUrl: true } },
    },
  },
  _count: { select: { comments: true, likes: true } },
} satisfies Prisma.PostInclude;

type PostWithRelations = Prisma.PostGetPayload<{ include: typeof POST_INCLUDE }>;

export class PostService {
  private readonly uploadService = new UploadService();

  async listFeed(userId: string, page = 1, limit = DEFAULT_PAGE_SIZE): Promise<PaginatedResult<Post>> {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const skip = (page - 1) * safeLimit;

    const posts = await prisma.post.findMany({
      include: POST_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip,
      take: safeLimit,
    });
    const total = await prisma.post.count();
    const liked = await prisma.like.findMany({
      where: { userId, postId: { in: posts.map((p) => p.id) } },
      select: { postId: true },
    });
    const viewer = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });

    const likedSet = new Set(liked.map((l) => l.postId));
    const isAdmin = viewer?.role === 'admin';
    const data = posts.map((p) => this.toPost(p, userId, isAdmin, likedSet.has(p.id)));
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));

    return { data, page, totalPages, hasMore: page < totalPages };
  }

  async get(postId: string, viewerId: string): Promise<Post | null> {
    const post = await prisma.post.findUnique({ where: { id: postId }, include: POST_INCLUDE });
    if (!post) return null;

    const [liked, viewer] = await Promise.all([
      prisma.like.findUnique({ where: { postId_userId: { postId, userId: viewerId } } }),
      prisma.user.findUnique({ where: { id: viewerId }, select: { role: true } }),
    ]);

    return this.toPost(post, viewerId, viewer?.role === 'admin', Boolean(liked));
  }

  async create(authorId: string, input: CreatePostInput): Promise<Post> {
    const body = (input.body ?? '').trim();
    const imageUrls = input.imageUrls ?? [];

    if (!body && !input.folderId && imageUrls.length === 0) {
      throw new Error('Post is empty');
    }
    if (body.length > MAX_BODY_LENGTH) throw new Error('Body too long');
    if (imageUrls.length > MAX_IMAGES) throw new Error('Too many images');

    if (input.folderId) {
      await this.assertOwnedFolder(input.folderId, authorId);
    }

    const post = await prisma.post.create({
      data: {
        authorId,
        body,
        folderId: input.folderId ?? null,
        images: {
          create: imageUrls.map((url, index) => ({ url, position: index })),
        },
      },
      include: POST_INCLUDE,
    });

    logger.info(`Post created by ${authorId}`);
    return this.toPost(post, authorId, false, false);
  }

  async update(postId: string, authorId: string, input: UpdatePostInput): Promise<Post> {
    const existing = await prisma.post.findUnique({ where: { id: postId } });
    if (!existing) throw new Error('Post not found');
    if (existing.authorId !== authorId) throw new Error('Forbidden');

    const body = (input.body ?? existing.body).trim();
    if (body.length > MAX_BODY_LENGTH) throw new Error('Body too long');

    if (input.folderId !== undefined) {
      if (input.folderId) {
        await this.assertOwnedFolder(input.folderId, authorId);
      }
    }

    await prisma.post.update({
      where: { id: postId },
      data: {
        body,
        folderId: input.folderId === undefined ? existing.folderId : input.folderId,
      },
    });

    const updated = await this.get(postId, authorId);
    if (!updated) throw new Error('Post not found');
    return updated;
  }

  async delete(postId: string, userId: string): Promise<void> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { images: { select: { url: true } } },
    });
    if (!post) throw new Error('Post not found');

    const viewer = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (post.authorId !== userId && viewer?.role !== 'admin') throw new Error('Forbidden');

    await prisma.post.delete({ where: { id: postId } });
    await this.uploadService.deleteImages(post.images.map((img) => img.url));
    logger.info(`Post deleted: ${postId}`);
  }

  async like(postId: string, userId: string): Promise<void> {
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) throw new Error('Post not found');
    await prisma.like.upsert({
      where: { postId_userId: { postId, userId } },
      create: { postId, userId },
      update: {},
    });
  }

  async unlike(postId: string, userId: string): Promise<void> {
    await prisma.like.deleteMany({ where: { postId, userId } });
  }

  private async assertOwnedFolder(folderId: string, userId: string): Promise<void> {
    const folder = await prisma.folder.findFirst({ where: { id: folderId, userId } });
    if (!folder) throw new Error('Folder not found');
  }

  private toPost(p: PostWithRelations, viewerId: string, isAdmin: boolean, likedByMe: boolean): Post {
    return {
      id: p.id,
      body: p.body,
      createdAt: p.createdAt.toISOString(),
      images: p.images.map((i) => ({ url: i.url })),
      author: p.author,
      folder: p.folder
        ? {
            id: p.folder.id,
            name: p.folder.name,
            itemCount: p.folder._count.items,
            covers: p.folder.items.map((i) => ({
              providerId: i.providerId,
              mangaId: i.mangaId,
              coverUrl: i.coverUrl,
            })),
          }
        : null,
      commentCount: p._count.comments,
      likeCount: p._count.likes,
      likedByMe,
      canDelete: p.authorId === viewerId || isAdmin,
      canEdit: p.authorId === viewerId,
    };
  }
}
