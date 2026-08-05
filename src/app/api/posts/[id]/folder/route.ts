import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { prisma } from '@/infrastructure/database/prisma-client';
import { successResponse, errorResponse } from '@/domain/types/api';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAuthUserId();
    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
      select: {
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
    });

    if (!post?.folder) {
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
