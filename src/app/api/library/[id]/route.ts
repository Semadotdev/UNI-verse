import { NextRequest, NextResponse } from 'next/server';
import { LibraryService } from '@/application/services/library.service';
import { successResponse, errorResponse } from '@/domain/types/api';
import { DEFAULT_USER_ID, ensureDefaultUser } from '@/lib/default-user';

const libraryService = new LibraryService();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDefaultUser();
    const { id } = await params;
    await libraryService.removeFromLibrary(DEFAULT_USER_ID, id);
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
    await ensureDefaultUser();
    const { id } = await params;
    const body = await request.json();
    const { chapterId, chapterNum, title, read, progress } = body;

    if (!chapterId || chapterNum === undefined) {
      return NextResponse.json(
        errorResponse('MISSING_FIELDS', 'chapterId and chapterNum are required'),
        { status: 400 }
      );
    }

    const bookmark = await libraryService.updateBookmark(DEFAULT_USER_ID, id, chapterId, {
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
