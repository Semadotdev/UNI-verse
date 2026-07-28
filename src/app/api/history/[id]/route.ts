import { NextRequest, NextResponse } from 'next/server';
import { HistoryService } from '@/application/services/history.service';
import { successResponse, errorResponse } from '@/domain/types/api';
import { getAuthUserId } from '@/lib/auth';

const historyService = new HistoryService();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;
    await historyService.clearHistory(userId, id);
    return NextResponse.json(successResponse({ deleted: true }));
  } catch (error) {
    return NextResponse.json(
      errorResponse('HISTORY_ERROR', error instanceof Error ? error.message : 'Failed to clear history'),
      { status: 500 }
    );
  }
}
