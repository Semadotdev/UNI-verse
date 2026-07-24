import { NextRequest, NextResponse } from 'next/server';
import { LibraryService } from '@/application/services/library.service';
import { successResponse, errorResponse } from '@/domain/types/api';
import { DEFAULT_USER_ID, ensureDefaultUser } from '@/lib/default-user';

const libraryService = new LibraryService();

export async function GET() {
  try {
    await ensureDefaultUser();
    const folders = await libraryService.getFolders(DEFAULT_USER_ID);
    return NextResponse.json(successResponse(folders));
  } catch (error) {
    return NextResponse.json(
      errorResponse('LIBRARY_ERROR', error instanceof Error ? error.message : 'Failed to get folders'),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDefaultUser();
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        errorResponse('MISSING_FIELDS', 'Folder name is required'),
        { status: 400 }
      );
    }

    const folder = await libraryService.createFolder(DEFAULT_USER_ID, name);
    return NextResponse.json(successResponse(folder));
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        errorResponse('DUPLICATE_FOLDER', 'A folder with that name already exists'),
        { status: 409 }
      );
    }
    return NextResponse.json(
      errorResponse('LIBRARY_ERROR', error instanceof Error ? error.message : 'Failed to create folder'),
      { status: 500 }
    );
  }
}
