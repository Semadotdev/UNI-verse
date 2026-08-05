import { NextRequest, NextResponse } from 'next/server';
import { PostService } from '@/application/services/post.service';
import { getAuthUserId } from '@/lib/auth';
import { ForbiddenError } from '@/shared/errors/forbidden-error';
import { successResponse, errorResponse } from '@/domain/types/api';

const postService = new PostService();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;
    const post = await postService.get(id, userId);
    if (!post) {
      return NextResponse.json(errorResponse('NOT_FOUND', 'Post not found'), { status: 404 });
    }
    return NextResponse.json(successResponse(post));
  } catch (error) {
    return NextResponse.json(
      errorResponse('POSTS_ERROR', error instanceof Error ? error.message : 'Failed to get post'),
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const post = await postService.update(id, userId, {
      body: typeof body.body === 'string' ? body.body : undefined,
      folderId: body.folderId === undefined ? undefined : typeof body.folderId === 'string' ? body.folderId : null,
    });

    return NextResponse.json(successResponse(post));
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json(errorResponse('FORBIDDEN', error.message), { status: 403 });
    }
    return NextResponse.json(
      errorResponse('POSTS_ERROR', error instanceof Error ? error.message : 'Failed to update post'),
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
    await postService.delete(id, userId);
    return NextResponse.json(successResponse({ deleted: true }));
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json(errorResponse('FORBIDDEN', error.message), { status: 403 });
    }
    return NextResponse.json(
      errorResponse('POSTS_ERROR', error instanceof Error ? error.message : 'Failed to delete post'),
      { status: error instanceof Error && error.message === 'Post not found' ? 404 : 500 }
    );
  }
}
