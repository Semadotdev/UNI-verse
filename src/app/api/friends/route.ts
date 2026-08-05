import { NextRequest, NextResponse } from 'next/server';
import { FriendService } from '@/application/services/friend.service';
import { getAuthUserId } from '@/lib/auth';
import { successResponse, errorResponse } from '@/domain/types/api';

const friendService = new FriendService();

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const body = await request.json().catch(() => ({}));
    const username = typeof body.username === 'string' ? body.username.trim() : '';

    if (!username) {
      return NextResponse.json(errorResponse('VALIDATION_ERROR', 'Username is required'), { status: 400 });
    }

    const result = await friendService.addFriend(userId, username);
    return NextResponse.json(successResponse({ isFriend: true, ...result }), { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      return NextResponse.json(errorResponse('NOT_FOUND', error.message), { status: 404 });
    }
    return NextResponse.json(
      errorResponse('FRIENDS_ERROR', error instanceof Error ? error.message : 'Failed to add friend'),
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username') || '';

    if (!username) {
      return NextResponse.json(errorResponse('VALIDATION_ERROR', 'Username is required'), { status: 400 });
    }

    await friendService.removeFriend(userId, username);
    return NextResponse.json(successResponse({ isFriend: false, username }));
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      return NextResponse.json(errorResponse('NOT_FOUND', error.message), { status: 404 });
    }
    return NextResponse.json(
      errorResponse('FRIENDS_ERROR', error instanceof Error ? error.message : 'Failed to remove friend'),
      { status: 400 }
    );
  }
}
