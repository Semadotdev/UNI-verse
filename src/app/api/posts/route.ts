import { NextRequest, NextResponse } from 'next/server';
import { PostService } from '@/application/services/post.service';
import { getAuthUserId } from '@/lib/auth';
import { ForbiddenError } from '@/shared/errors/forbidden-error';
import { successResponse, errorResponse } from '@/domain/types/api';

const postService = new PostService();

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const username = searchParams.get('username') || undefined;

    const result = await postService.listFeed(userId, page, limit, { username });
    return NextResponse.json(successResponse(result.data, {
      page: result.page,
      totalPages: result.totalPages,
      totalItems: result.data.length,
      hasMore: result.hasMore,
    }));
  } catch (error) {
    return NextResponse.json(
      errorResponse('POSTS_ERROR', error instanceof Error ? error.message : 'Failed to load posts'),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const body = await request.json().catch(() => ({}));

    const post = await postService.create(userId, {
      body: typeof body.body === 'string' ? body.body : '',
      folderId: typeof body.folderId === 'string' ? body.folderId : null,
      imageUrls: Array.isArray(body.imageUrls)
        ? body.imageUrls.filter((u: unknown): u is string => typeof u === 'string')
        : [],
    });

    return NextResponse.json(successResponse(post), { status: 201 });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json(errorResponse('FORBIDDEN', error.message), { status: 403 });
    }
    return NextResponse.json(
      errorResponse('POSTS_ERROR', error instanceof Error ? error.message : 'Failed to create post'),
      { status: 400 }
    );
  }
}
