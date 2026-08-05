import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { prisma } from '@/infrastructure/database/prisma-client';
import { successResponse, errorResponse } from '@/domain/types/api';

const MAX_BIO_LENGTH = 200;

export async function GET() {
  try {
    const userId = await getAuthUserId();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
        bio: true,
        role: true,
        createdAt: true,
        _count: { select: { posts: true, friends: true } },
      },
    });
    if (!user) {
      return NextResponse.json(errorResponse('NOT_FOUND', 'User not found'), { status: 404 });
    }
    return NextResponse.json(
      successResponse({
        id: user.id,
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        postCount: user._count.posts,
        friendCount: user._count.friends,
      })
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse('AUTH_ERROR', error instanceof Error ? error.message : 'Failed to get user'),
      { status: 401 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const body = await request.json().catch(() => ({}));

    const data: { bio?: string | null; avatarUrl?: string | null } = {};

    if (body.bio !== undefined) {
      const bio = typeof body.bio === 'string' ? body.bio.trim() : '';
      if (bio.length > MAX_BIO_LENGTH) {
        return NextResponse.json(
          errorResponse('VALIDATION_ERROR', `Bio must be ${MAX_BIO_LENGTH} characters or fewer`),
          { status: 400 }
        );
      }
      data.bio = bio || null;
    }

    if (body.avatarUrl !== undefined) {
      data.avatarUrl = typeof body.avatarUrl === 'string' ? body.avatarUrl : null;
    }

    const user = await prisma.user.update({ where: { id: userId }, data });
    return NextResponse.json(
      successResponse({
        id: user.id,
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
      })
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse('AUTH_ERROR', error instanceof Error ? error.message : 'Failed to update user'),
      { status: 401 }
    );
  }
}
