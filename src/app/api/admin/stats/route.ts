import { NextResponse } from 'next/server';
import { AdminService } from '@/application/services/admin.service';
import { getAuthUserId } from '@/lib/auth';
import { ForbiddenError } from '@/shared/errors/forbidden-error';
import { successResponse, errorResponse } from '@/domain/types/api';

const adminService = new AdminService();

export async function GET() {
  try {
    const userId = await getAuthUserId();
    const stats = await adminService.getStats(userId);
    return NextResponse.json(successResponse(stats));
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json(errorResponse('FORBIDDEN', error.message), { status: 403 });
    }
    return NextResponse.json(
      errorResponse('STATS_ERROR', error instanceof Error ? error.message : 'Failed to load stats'),
      { status: 500 }
    );
  }
}
