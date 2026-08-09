import { NextRequest, NextResponse } from 'next/server';
import {
  InsufficientCoinsError,
  ThemeNotFoundError,
  ThemesService,
} from '@/application/services/themes.service';
import { successResponse, errorResponse } from '@/domain/types/api';
import { getAuthUserId } from '@/lib/auth';

const themesService = new ThemesService();

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const body = await request.json();
    const { themeId } = body;

    if (!themeId) {
      return NextResponse.json(errorResponse('MISSING_FIELDS', 'themeId is required'), { status: 400 });
    }

    const state = await themesService.purchase(userId, themeId);
    return NextResponse.json(successResponse(state));
  } catch (error) {
    if (error instanceof ThemeNotFoundError) {
      return NextResponse.json(errorResponse('THEME_NOT_FOUND', error.message), { status: 404 });
    }
    if (error instanceof InsufficientCoinsError) {
      return NextResponse.json(errorResponse('INSUFFICIENT_COINS', error.message), { status: 400 });
    }
    return NextResponse.json(
      errorResponse('THEMES_ERROR', error instanceof Error ? error.message : 'Failed to purchase theme'),
      { status: 500 }
    );
  }
}
