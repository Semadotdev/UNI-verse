import { NextRequest, NextResponse } from 'next/server';
import { HistoryService } from '@/application/services/history.service';
import { successResponse, errorResponse } from '@/domain/types/api';
import { getAuthUserId } from '@/lib/auth';

const historyService = new HistoryService();

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const mangaId = searchParams.get('mangaId');

    if (!providerId || !mangaId) {
      return NextResponse.json(
        errorResponse('MISSING_FIELDS', 'providerId and mangaId are required'),
        { status: 400 }
      );
    }

    const latest = await historyService.getLatestReadChapter(userId, providerId, mangaId);
    return NextResponse.json(successResponse({ latestReadChapter: latest?.chapterId ?? null }));
  } catch (error) {
    return NextResponse.json(
      errorResponse('HISTORY_ERROR', error instanceof Error ? error.message : 'Failed to get latest read chapter'),
      { status: 500 }
    );
  }
}
