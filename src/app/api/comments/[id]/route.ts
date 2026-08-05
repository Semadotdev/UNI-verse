import { NextRequest, NextResponse } from 'next/server';
import { CommentService } from '@/application/services/comment.service';
import { getAuthUserId } from '@/lib/auth';
import { ForbiddenError } from '@/shared/errors/forbidden-error';
import { successResponse, errorResponse } from '@/domain/types/api';

const commentService = new CommentService();

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;
    await commentService.delete(id, userId);
    return NextResponse.json(successResponse({ deleted: true }));
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json(errorResponse('FORBIDDEN', error.message), { status: 403 });
    }
    return NextResponse.json(
      errorResponse('COMMENTS_ERROR', error instanceof Error ? error.message : 'Failed to delete comment'),
      { status: 500 }
    );
  }
}
