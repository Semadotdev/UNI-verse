import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { prisma } from '@/infrastructure/database/prisma-client';
import { FriendService } from '@/application/services/friend.service';
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
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json(errorResponse('NOT_FOUND', 'User not found'), { status: 404 });
    }

    if (viewerId !== user.id) {
      return NextResponse.json(successResponse({ friends: [] }));
    }

    const friends = await friendService.listFriends(user.id);
    return NextResponse.json(successResponse({ friends }));
  } catch (error) {
    return NextResponse.json(
      errorResponse('AUTH_ERROR', error instanceof Error ? error.message : 'Failed to load friends'),
      { status: 401 }
    );
  }
}
