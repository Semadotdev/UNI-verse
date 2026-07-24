import { NextRequest, NextResponse } from 'next/server';
import { MangaService } from '@/application/services/manga.service';
import { successResponse, errorResponse } from '@/domain/types/api';

const mangaService = new MangaService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string; mangaId: string }> }
) {
  try {
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
