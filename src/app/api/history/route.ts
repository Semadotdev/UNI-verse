import { NextRequest, NextResponse } from 'next/server';
import { HistoryService } from '@/application/services/history.service';
import { RewardService } from '@/application/services/reward.service';
import { successResponse, errorResponse } from '@/domain/types/api';
import { getAuthUserId } from '@/lib/auth';

const historyService = new HistoryService();
const rewardService = new RewardService();

export async function GET() {
  try {
    const userId = await getAuthUserId();
    const history = await historyService.getHistory(userId);
    const mapped = history.map((h) => ({
      id: h.id,
      mangaId: h.mangaId,
      providerId: h.providerId,
      chapterId: h.chapterId,
      chapterNumber: h.chapterNum,
      mangaTitle: h.title,
      coverUrl: h.coverUrl,
      readAt: h.readAt,
    }));
    return NextResponse.json(successResponse(mapped));
  } catch (error) {
    return NextResponse.json(
      errorResponse('HISTORY_ERROR', error instanceof Error ? error.message : 'Failed to get history'),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const body = await request.json();
    const { providerId, mangaId, chapterId, chapterNum, title, coverUrl, progress, completed } = body;

    if (!providerId || !mangaId || !chapterId || chapterNum === undefined) {
      return NextResponse.json(
        errorResponse('MISSING_FIELDS', 'providerId, mangaId, chapterId, and chapterNum are required'),
        { status: 400 }
      );
    }

    await historyService.updateProgress(userId, providerId, mangaId, {
      chapterId,
      chapterNum,
      title,
      coverUrl,
      progress,
      completed,
    });

    let rewarded: boolean | undefined;
    let balance: number | undefined;
    if (completed === true) {
      const result = await rewardService.awardChapterCompletion(userId, providerId, mangaId, chapterId);
      rewarded = result.rewarded;
      if (result.rewarded) balance = result.balance;
    }

    return NextResponse.json(successResponse({ updated: true, rewarded, balance }));
  } catch (error) {
    return NextResponse.json(
      errorResponse('HISTORY_ERROR', error instanceof Error ? error.message : 'Failed to update history'),
      { status: 500 }
    );
  }
}
