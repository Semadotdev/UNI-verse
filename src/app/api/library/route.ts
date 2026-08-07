import { NextRequest, NextResponse } from 'next/server';
import { LibraryService } from '@/application/services/library.service';
import { successResponse, errorResponse } from '@/domain/types/api';
import { getAuthUserId } from '@/lib/auth';

const libraryService = new LibraryService();

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    const library = await libraryService.getLibrary(
      userId,
      folderId || undefined
    );
    return NextResponse.json(successResponse(library));
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Unauthorized'),
        { status: 401 }
      );
    }
    return NextResponse.json(
      errorResponse('LIBRARY_ERROR', error instanceof Error ? error.message : 'Failed to get library'),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const body = await request.json();
    const { providerId, mangaId, title, coverUrl, status, categories, folderId } = body;

    if (!providerId || !mangaId || !title) {
      return NextResponse.json(
        errorResponse('MISSING_FIELDS', 'providerId, mangaId, and title are required'),
        { status: 400 }
      );
    }

    const item = await libraryService.addToLibrary(userId, providerId, mangaId, {
      title,
      coverUrl: coverUrl || '',
      status,
      categories,
      folderId,
    });

    return NextResponse.json(successResponse(item));
  } catch (error) {
    return NextResponse.json(
      errorResponse('LIBRARY_ERROR', error instanceof Error ? error.message : 'Failed to add to library'),
      { status: 500 }
    );
  }
}
