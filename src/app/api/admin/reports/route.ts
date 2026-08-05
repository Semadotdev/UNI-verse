import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from '@/application/services/report.service';
import { getAuthUserId } from '@/lib/auth';
import { ForbiddenError } from '@/shared/errors/forbidden-error';
import { successResponse, errorResponse } from '@/domain/types/api';

const reportService = new ReportService();

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);

    const result = await reportService.listReports(userId, page);
    return NextResponse.json(successResponse(result.data, {
      page: result.page,
      totalPages: result.totalPages,
      totalItems: result.data.length,
      hasMore: result.hasMore,
    }));
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json(errorResponse('FORBIDDEN', error.message), { status: 403 });
    }
    return NextResponse.json(
      errorResponse('REPORTS_ERROR', error instanceof Error ? error.message : 'Failed to list reports'),
      { status: 500 }
    );
  }
}
