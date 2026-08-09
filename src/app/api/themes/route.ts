import { NextResponse } from 'next/server';
import { ThemesService } from '@/application/services/themes.service';
import { successResponse, errorResponse } from '@/domain/types/api';
import { getAuthUserId } from '@/lib/auth';

const themesService = new ThemesService();

export async function GET() {
  try {
    const userId = await getAuthUserId();
    const state = await themesService.getState(userId);
    return NextResponse.json(successResponse(state));
  } catch (error) {
    return NextResponse.json(
      errorResponse('THEMES_ERROR', error instanceof Error ? error.message : 'Failed to load themes'),
      { status: 500 }
    );
  }
}
