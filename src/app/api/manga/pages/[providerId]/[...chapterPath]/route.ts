import { NextRequest, NextResponse } from 'next/server';
import { MangaService } from '@/application/services/manga.service';
import { successResponse, errorResponse } from '@/domain/types/api';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('PagesAPI');
const mangaService = new MangaService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string; chapterPath: string[] }> }
) {
  try {
    const { providerId, chapterPath } = await params;
    const chapterId = chapterPath.join('/');
    logger.info(`Fetching pages: provider=${providerId}, chapterId=${chapterId}`);
    const pages = await mangaService.getPages(providerId, chapterId);
    logger.info(`Got ${pages.length} pages for ${providerId}/${chapterId}`);
    return NextResponse.json(successResponse(pages));
  } catch (error) {
    logger.error(`Failed to get pages: ${error instanceof Error ? error.message : error}`);
    return NextResponse.json(
      errorResponse('PAGES_ERROR', error instanceof Error ? error.message : 'Failed to get pages'),
      { status: 500 }
    );
  }
}
