import { NextRequest, NextResponse } from 'next/server';
import { HistoryService } from '@/application/services/history.service';
import { successResponse, errorResponse } from '@/domain/types/api';
import { DEFAULT_USER_ID, ensureDefaultUser } from '@/lib/default-user';

const historyService = new HistoryService();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDefaultUser();
    const { id } = await params;
    await historyService.clearHistory(DEFAULT_USER_ID, id);
    return NextResponse.json(successResponse({ deleted: true }));
  } catch (error) {
    return NextResponse.json(
      errorResponse('HISTORY_ERROR', error instanceof Error ? error.message : 'Failed to clear history'),
      { status: 500 }
    );
  }
}
