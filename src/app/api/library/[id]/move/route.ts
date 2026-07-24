import { NextRequest, NextResponse } from 'next/server';
import { LibraryService } from '@/application/services/library.service';
import { successResponse, errorResponse } from '@/domain/types/api';
import { DEFAULT_USER_ID, ensureDefaultUser } from '@/lib/default-user';

const libraryService = new LibraryService();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDefaultUser();
    const { id } = await params;
    const body = await request.json();
    const { folderId } = body;

    const item = await libraryService.moveToFolder(
      DEFAULT_USER_ID,
      id,
      folderId || null
    );
    return NextResponse.json(successResponse(item));
  } catch (error) {
    return NextResponse.json(
      errorResponse('LIBRARY_ERROR', error instanceof Error ? error.message : 'Failed to move item'),
      { status: 500 }
    );
  }
}
