import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from '@/application/services/report.service';
import { getAuthUserId } from '@/lib/auth';
import { ForbiddenError } from '@/shared/errors/forbidden-error';
import { successResponse, errorResponse } from '@/domain/types/api';

const reportService = new ReportService();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type !== 'post' && type !== 'comment') {
      return NextResponse.json(errorResponse('INVALID_TYPE', 'type must be post or comment'), { status: 400 });
    }

    await reportService.dismiss(userId, type, id);
    return NextResponse.json(successResponse({ dismissed: true }));
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json(errorResponse('FORBIDDEN', error.message), { status: 403 });
    }
    return NextResponse.json(
      errorResponse('REPORTS_ERROR', error instanceof Error ? error.message : 'Failed to dismiss report'),
      { status: 500 }
    );
  }
}
