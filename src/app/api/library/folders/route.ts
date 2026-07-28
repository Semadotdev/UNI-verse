import { NextRequest, NextResponse } from 'next/server';
import { LibraryService } from '@/application/services/library.service';
import { successResponse, errorResponse } from '@/domain/types/api';
import { getAuthUserId } from '@/lib/auth';

const libraryService = new LibraryService();

export async function GET() {
  try {
    const userId = await getAuthUserId();
    const folders = await libraryService.getFolders(userId);
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
    const userId = await getAuthUserId();
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        errorResponse('MISSING_FIELDS', 'Folder name is required'),
        { status: 400 }
      );
    }

    const folder = await libraryService.createFolder(userId, name);
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
