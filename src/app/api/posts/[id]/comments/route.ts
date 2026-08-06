import { NextRequest, NextResponse } from 'next/server';
import { CommentService } from '@/application/services/comment.service';
import { getAuthUserId } from '@/lib/auth';
import { successResponse, errorResponse } from '@/domain/types/api';

const commentService = new CommentService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);

    const result = await commentService.list(id, userId, page);
    return NextResponse.json(successResponse(result.data, {
      page: result.page,
      totalPages: result.totalPages,
      totalItems: result.data.length,
      hasMore: result.hasMore,
    }));
  } catch (error) {
    return NextResponse.json(
      errorResponse('COMMENTS_ERROR', error instanceof Error ? error.message : 'Failed to load comments'),
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const comment = await commentService.create(
      id,
      userId,
      typeof body.body === 'string' ? body.body : '',
      typeof body.parentId === 'string' ? body.parentId : undefined
    );
    return NextResponse.json(successResponse(comment), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      errorResponse('COMMENTS_ERROR', error instanceof Error ? error.message : 'Failed to add comment'),
      { status: 400 }
    );
  }
}
