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
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        errorResponse('MISSING_FIELDS', 'Folder name is required'),
        { status: 400 }
      );
    }

    const folder = await libraryService.renameFolder(DEFAULT_USER_ID, id, name);
    return NextResponse.json(successResponse(folder));
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        errorResponse('DUPLICATE_FOLDER', 'A folder with that name already exists'),
        { status: 409 }
      );
    }
    return NextResponse.json(
      errorResponse('LIBRARY_ERROR', error instanceof Error ? error.message : 'Failed to rename folder'),
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDefaultUser();
    const { id } = await params;
    await libraryService.deleteFolder(DEFAULT_USER_ID, id);
    return NextResponse.json(successResponse({ deleted: true }));
  } catch (error) {
    return NextResponse.json(
      errorResponse('LIBRARY_ERROR', error instanceof Error ? error.message : 'Failed to delete folder'),
      { status: 500 }
    );
  }
}
