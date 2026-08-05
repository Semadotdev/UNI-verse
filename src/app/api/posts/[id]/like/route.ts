import { NextRequest, NextResponse } from 'next/server';
import { PostService } from '@/application/services/post.service';
import { getAuthUserId } from '@/lib/auth';
import { successResponse, errorResponse } from '@/domain/types/api';

const postService = new PostService();

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;
    await postService.like(id, userId);
    return NextResponse.json(successResponse({ liked: true }));
  } catch (error) {
    return NextResponse.json(
      errorResponse('LIKE_ERROR', error instanceof Error ? error.message : 'Failed to like post'),
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;
    await postService.unlike(id, userId);
    return NextResponse.json(successResponse({ liked: false }));
  } catch (error) {
    return NextResponse.json(
      errorResponse('LIKE_ERROR', error instanceof Error ? error.message : 'Failed to unlike post'),
      { status: 400 }
    );
  }
}
