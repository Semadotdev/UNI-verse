import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { isAdult } from '@/lib/age';
import { prisma } from '@/infrastructure/database/prisma-client';
import { AccountService } from '@/application/services/account.service';
import { successResponse, errorResponse } from '@/domain/types/api';

const MAX_BIO_LENGTH = 200;
const MAX_NAME_LENGTH = 50;
const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

function validationError(message: string) {
  return NextResponse.json(errorResponse('VALIDATION_ERROR', message), { status: 400 });
}

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
        birthDate: true,
        showNsfw: true,
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
        showNsfw: user.showNsfw,
        isAdult: isAdult(user.birthDate),
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

    const data: { bio?: string | null; avatarUrl?: string | null; username?: string; name?: string | null; showNsfw?: boolean } = {};

    if (body.username !== undefined) {
      const username = typeof body.username === 'string' ? body.username.trim() : '';
      if (username.length < 3 || username.length > 20) {
        return validationError('Username must be 3-20 characters');
      }
      if (!USERNAME_PATTERN.test(username)) {
        return validationError('Username can only contain letters, numbers, and underscores');
      }
      const existing = await prisma.user.findUnique({ where: { username }, select: { id: true } });
      if (existing && existing.id !== userId) {
        return validationError('Username already taken');
      }
      data.username = username;
    }

    if (body.name !== undefined) {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (name.length > MAX_NAME_LENGTH) {
        return validationError(`Name must be ${MAX_NAME_LENGTH} characters or fewer`);
      }
      data.name = name || null;
    }

    if (body.bio !== undefined) {
      const bio = typeof body.bio === 'string' ? body.bio.trim() : '';
      if (bio.length > MAX_BIO_LENGTH) {
        return validationError(`Bio must be ${MAX_BIO_LENGTH} characters or fewer`);
      }
      data.bio = bio || null;
    }

    if (body.avatarUrl !== undefined) {
      data.avatarUrl = typeof body.avatarUrl === 'string' ? body.avatarUrl : null;
    }

    if (body.showNsfw !== undefined) {
      data.showNsfw = Boolean(body.showNsfw);
    }

    const user = await prisma.user.update({ where: { id: userId }, data });
    return NextResponse.json(
      successResponse({
        id: user.id,
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        showNsfw: user.showNsfw,
      })
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse('AUTH_ERROR', error instanceof Error ? error.message : 'Failed to update user'),
      { status: 401 }
    );
  }
}

export async function DELETE() {
  try {
    const userId = await getAuthUserId();
    await new AccountService().deleteAccount(userId);
    return NextResponse.json(successResponse({ deleted: true }));
  } catch (error) {
    return NextResponse.json(
      errorResponse(
        'ACCOUNT_DELETE_ERROR',
        error instanceof Error ? error.message : 'Failed to delete account'
      ),
      { status: 500 }
    );
  }
}
