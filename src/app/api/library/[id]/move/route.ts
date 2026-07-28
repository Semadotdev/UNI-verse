import { NextRequest, NextResponse } from 'next/server';
import { LibraryService } from '@/application/services/library.service';
import { successResponse, errorResponse } from '@/domain/types/api';
import { getAuthUserId } from '@/lib/auth';

const libraryService = new LibraryService();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;
    const body = await request.json();
    const { folderId } = body;

    const item = await libraryService.moveToFolder(
      userId,
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
