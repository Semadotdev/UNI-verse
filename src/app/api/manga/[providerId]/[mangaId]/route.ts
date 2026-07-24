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
    const manga = await mangaService.getDetails(providerId, mangaId);
    return NextResponse.json(successResponse(manga));
  } catch (error) {
    return NextResponse.json(
      errorResponse('MANGA_ERROR', error instanceof Error ? error.message : 'Failed to get manga details'),
      { status: 500 }
    );
  }
}
