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

    const readChapters = await historyService.getReadChapters(userId, providerId, mangaId);
    return NextResponse.json(successResponse({ readChapters: Array.from(readChapters) }));
  } catch (error) {
    return NextResponse.json(
      errorResponse('HISTORY_ERROR', error instanceof Error ? error.message : 'Failed to get read chapters'),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const body = await request.json();
    const { providerId, mangaId, chapterId } = body;

    if (!providerId || !mangaId || !chapterId) {
      return NextResponse.json(
        errorResponse('MISSING_FIELDS', 'providerId, mangaId, and chapterId are required'),
        { status: 400 }
      );
    }

    await historyService.markChapterRead(userId, providerId, mangaId, chapterId);
    return NextResponse.json(successResponse({ marked: true }));
  } catch (error) {
    return NextResponse.json(
      errorResponse('HISTORY_ERROR', error instanceof Error ? error.message : 'Failed to mark chapter as read'),
      { status: 500 }
    );
  }
}
