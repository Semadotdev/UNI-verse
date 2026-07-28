import { NextRequest, NextResponse } from 'next/server';
import { LibraryService } from '@/application/services/library.service';
import { successResponse, errorResponse } from '@/domain/types/api';
import { getAuthUserId } from '@/lib/auth';

const libraryService = new LibraryService();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;
    await libraryService.removeFromLibrary(userId, id);
    return NextResponse.json(successResponse({ deleted: true }));
  } catch (error) {
    return NextResponse.json(
      errorResponse('LIBRARY_ERROR', error instanceof Error ? error.message : 'Failed to remove from library'),
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;
    const body = await request.json();
    const { chapterId, chapterNum, title, read, progress } = body;

    if (!chapterId || chapterNum === undefined) {
      return NextResponse.json(
        errorResponse('MISSING_FIELDS', 'chapterId and chapterNum are required'),
        { status: 400 }
      );
    }

    const bookmark = await libraryService.updateBookmark(userId, id, chapterId, {
      chapterNum,
      title,
      read,
      progress,
    });

    return NextResponse.json(successResponse(bookmark));
  } catch (error) {
    return NextResponse.json(
      errorResponse('LIBRARY_ERROR', error instanceof Error ? error.message : 'Failed to update bookmark'),
      { status: 500 }
    );
  }
}
