import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { prisma } from '@/infrastructure/database/prisma-client';
import { successResponse, errorResponse } from '@/domain/types/api';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    await getAuthUserId();
    const { username } = await params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        username: true,
        name: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        _count: { select: { posts: true } },
      },
    });
    if (!user) {
      return NextResponse.json(errorResponse('NOT_FOUND', 'User not found'), { status: 404 });
    }

    return NextResponse.json(
      successResponse({
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        createdAt: user.createdAt.toISOString(),
        postCount: user._count.posts,
      })
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse('AUTH_ERROR', error instanceof Error ? error.message : 'Failed to load user'),
      { status: 401 }
    );
  }
}
