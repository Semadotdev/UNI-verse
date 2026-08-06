import { prisma } from '@/infrastructure/database/prisma-client';
import type { Prisma } from '@prisma/client';
import type { Post, CreatePostInput, UpdatePostInput } from '@/domain/entities/post';
import type { PaginatedResult } from '@/domain/types/api';
import { UploadService } from '@/application/services/upload.service';
import { NotificationService } from '@/application/services/notification.service';
import { isAdult } from '@/lib/age';
import { buildFeedWhere, type PostFeed } from '@/application/services/post-feed-where';
import { isNsfwCategories } from '@/domain/constants/nsfw-genres';
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
  private readonly notificationService = new NotificationService();

  async listFeed(
    userId: string,
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    filter?: { username?: string; feed?: PostFeed }
  ): Promise<PaginatedResult<Post>> {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const skip = (page - 1) * safeLimit;

    let authorId: string | undefined;
    if (filter?.username) {
      const author = await prisma.user.findUnique({
        where: { username: filter.username },
        select: { id: true },
      });
      if (!author) return { data: [], page, totalPages: 0, hasMore: false };
      authorId = author.id;
    }

    const [viewer, friendRows] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { role: true, birthDate: true } }),
      filter?.feed === 'friends'
        ? prisma.friend.findMany({
            where: { OR: [{ userId }, { friendId: userId }] },
            select: { userId: true, friendId: true },
          })
        : Promise.resolve([]),
    ]);

    const friendIds = friendRows.map((r) => (r.userId === userId ? r.friendId : r.userId));
    const where = buildFeedWhere({
      username: filter?.username,
      authorId,
      feed: filter?.feed,
      viewerIsAdult: isAdult(viewer?.birthDate ?? null),
      friendIds,
    });

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: POST_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      prisma.post.count({ where }),
    ]);
    const liked = await prisma.like.findMany({
      where: { userId, postId: { in: posts.map((p) => p.id) } },
      select: { postId: true },
    });

    const likedSet = new Set(liked.map((l) => l.postId));
    const isAdmin = viewer?.role === 'admin';
    const data = posts.map((p) => this.toPost(p, userId, isAdmin, likedSet.has(p.id)));
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));

    return { data, page, totalPages, hasMore: page < totalPages };
  }

  async get(postId: string, viewerId: string, skipAgeGate = false): Promise<Post | null> {
    const post = await prisma.post.findUnique({ where: { id: postId }, include: POST_INCLUDE });
    if (!post) return null;

    const [liked, viewer] = await Promise.all([
      prisma.like.findUnique({ where: { postId_userId: { postId, userId: viewerId } } }),
      prisma.user.findUnique({ where: { id: viewerId }, select: { role: true, birthDate: true } }),
    ]);

    if (!skipAgeGate && post.nsfw && !isAdult(viewer?.birthDate ?? null)) {
      return null;
    }

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

    const folderNsfw = input.folderId ? await this.folderHasNsfw(input.folderId) : false;
    const explicitNsfw = Boolean(input.nsfw);

    const post = await prisma.post.create({
      data: {
        authorId,
        body,
        folderId: input.folderId ?? null,
        nsfw: explicitNsfw || folderNsfw,
        nsfwExplicit: explicitNsfw,
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

    const folderId = input.folderId === undefined ? existing.folderId : input.folderId;
    if (folderId) {
      await this.assertOwnedFolder(folderId, authorId);
    }

    const explicit = input.nsfw === undefined ? existing.nsfwExplicit : Boolean(input.nsfw);
    const folderNsfw = folderId ? await this.folderHasNsfw(folderId) : false;

    await prisma.post.update({
      where: { id: postId },
      data: {
        body,
        folderId,
        nsfw: explicit || folderNsfw,
        nsfwExplicit: explicit,
      },
    });

    const updated = await this.get(postId, authorId, true);
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
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, authorId: true } });
    if (!post) throw new Error('Post not found');
    await prisma.like.upsert({
      where: { postId_userId: { postId, userId } },
      create: { postId, userId },
      update: {},
    });
    await this.notificationService.onPostLiked(postId, userId);
  }

  async unlike(postId: string, userId: string): Promise<void> {
    await prisma.like.deleteMany({ where: { postId, userId } });
  }

  private async assertOwnedFolder(folderId: string, userId: string): Promise<void> {
    const folder = await prisma.folder.findFirst({ where: { id: folderId, userId } });
    if (!folder) throw new Error('Folder not found');
  }

  private async folderHasNsfw(folderId: string): Promise<boolean> {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      select: { items: { select: { categories: true } } },
    });
    return folder ? folder.items.some((item) => isNsfwCategories(item.categories)) : false;
  }

  private toPost(p: PostWithRelations, viewerId: string, isAdmin: boolean, likedByMe: boolean): Post {
    return {
      id: p.id,
      nsfw: p.nsfw,
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
