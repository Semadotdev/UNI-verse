import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from '@/application/services/report.service';
import { getAuthUserId } from '@/lib/auth';
import { successResponse, errorResponse } from '@/domain/types/api';

const reportService = new ReportService();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === 'string' ? body.reason.slice(0, 500) : undefined;

    await reportService.reportComment(id, userId, reason);
    return NextResponse.json(successResponse({ reported: true }));
  } catch (error) {
    return NextResponse.json(
      errorResponse('REPORT_ERROR', error instanceof Error ? error.message : 'Failed to report comment'),
      { status: error instanceof Error && error.message === 'Comment not found' ? 404 : 400 }
    );
  }
}
