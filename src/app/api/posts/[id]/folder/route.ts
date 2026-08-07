import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { isAdult } from '@/lib/age';
import { prisma } from '@/infrastructure/database/prisma-client';
import { successResponse, errorResponse } from '@/domain/types/api';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;

    const [post, viewer] = await Promise.all([
      prisma.post.findUnique({
        where: { id },
        select: {
          nsfw: true,
          folder: {
            select: {
              id: true,
              name: true,
              _count: { select: { items: true } },
              items: {
                orderBy: { updatedAt: 'desc' },
                select: {
                  providerId: true,
                  mangaId: true,
                  title: true,
                  coverUrl: true,
                  status: true,
                  categories: true,
                },
              },
            },
          },
        },
      }),
      prisma.user.findUnique({ where: { id: userId }, select: { birthDate: true } }),
    ]);

    if (!post?.folder) {
      return NextResponse.json(errorResponse('NOT_FOUND', 'Folder not found'), { status: 404 });
    }

    if (post.nsfw && !isAdult(viewer?.birthDate ?? null)) {
      return NextResponse.json(errorResponse('NOT_FOUND', 'Folder not found'), { status: 404 });
    }

    return NextResponse.json(
      successResponse({
        id: post.folder.id,
        name: post.folder.name,
        itemCount: post.folder._count.items,
        items: post.folder.items,
      })
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse('AUTH_ERROR', error instanceof Error ? error.message : 'Failed to load folder'),
      { status: 401 }
    );
  }
}
