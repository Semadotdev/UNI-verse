import { NextRequest, NextResponse } from 'next/server';
import { MangaService } from '@/application/services/manga.service';
import { successResponse, errorResponse } from '@/domain/types/api';
import { enforceRateLimit } from '@/shared/utils/rate-limit';

const mangaService = new MangaService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string; mangaId: string }> }
) {
  try {
    const rateLimit = await enforceRateLimit(request, 'manga:chapters', 60 * 1000, 20, 'ip', 'chapters');
    if (rateLimit.response) return rateLimit.response;

    const { providerId, mangaId } = await params;
    const chapters = await mangaService.getChapters(providerId, mangaId);
    return NextResponse.json(successResponse(chapters));
  } catch (error) {
    return NextResponse.json(
      errorResponse('CHAPTERS_ERROR', error instanceof Error ? error.message : 'Failed to get chapters'),
      { status: 500 }
    );
  }
}
