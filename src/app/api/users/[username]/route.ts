import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { prisma } from '@/infrastructure/database/prisma-client';
import { FriendService } from '@/application/services/friend.service';
import { resolveProfileTheme } from '@/domain/constants/profile-themes';
import { successResponse, errorResponse } from '@/domain/types/api';

const friendService = new FriendService();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const viewerId = await getAuthUserId();
    const { username } = await params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        settings: { select: { profileThemeId: true } },
        _count: { select: { posts: true } },
      },
    });
    if (!user) {
      return NextResponse.json(errorResponse('NOT_FOUND', 'User not found'), { status: 404 });
    }

    const [isFriend, friendCount] = await Promise.all([
      friendService.isFriend(viewerId, user.id),
      friendService.friendCount(user.id),
    ]);

    return NextResponse.json(
      successResponse({
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        createdAt: user.createdAt.toISOString(),
        postCount: user._count.posts,
        friendCount,
        isFriend,
        theme: resolveProfileTheme(user.settings?.profileThemeId),
      })
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse('AUTH_ERROR', error instanceof Error ? error.message : 'Failed to load user'),
      { status: 401 }
    );
  }
}
