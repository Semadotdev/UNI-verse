import { NextRequest, NextResponse } from 'next/server';
import { PageCommentService } from '@/application/services/page-comment.service';
import { getAuthUserId } from '@/lib/auth';
import { successResponse, errorResponse } from '@/domain/types/api';

const pageCommentService = new PageCommentService();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ providerId: string; mangaId: string; chapterId: string[] }> }
) {
  try {
    const userId = await getAuthUserId();
    const { providerId, mangaId, chapterId } = await params;
    const comments = await pageCommentService.listByChapter(providerId, mangaId, chapterId.join('/'), userId);
    return NextResponse.json(successResponse(comments));
  } catch (error) {
    return NextResponse.json(
      errorResponse('PAGE_COMMENTS_ERROR', error instanceof Error ? error.message : 'Failed to load comments'),
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string; mangaId: string; chapterId: string[] }> }
) {
  try {
    const userId = await getAuthUserId();
    const { providerId, mangaId, chapterId } = await params;
    const joinedChapterId = chapterId.join('/');
    const body = await request.json().catch(() => ({}));

    const pageIndex = typeof body.pageIndex === 'number' ? body.pageIndex : 0;
    const pageY = typeof body.pageY === 'number' ? body.pageY : 0;
    const text = typeof body.body === 'string' ? body.body : '';
    const parentId = typeof body.parentId === 'string' ? body.parentId : undefined;

    const comment = await pageCommentService.create(
      providerId, mangaId, joinedChapterId, pageIndex, pageY, text, userId, parentId
    );
    return NextResponse.json(successResponse(comment), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      errorResponse('PAGE_COMMENTS_ERROR', error instanceof Error ? error.message : 'Failed to add comment'),
      { status: 400 }
    );
  }
}
