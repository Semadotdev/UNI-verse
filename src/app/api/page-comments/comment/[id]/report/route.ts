import { NextRequest, NextResponse } from 'next/server';
import { PageCommentService } from '@/application/services/page-comment.service';
import { getAuthUserId } from '@/lib/auth';
import { successResponse, errorResponse } from '@/domain/types/api';

const pageCommentService = new PageCommentService();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === 'string' ? body.reason : undefined;

    await pageCommentService.report(id, userId, reason);
    return NextResponse.json(successResponse({ reported: true }), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      errorResponse('PAGE_COMMENTS_ERROR', error instanceof Error ? error.message : 'Failed to report comment'),
      { status: 400 }
    );
  }
}
