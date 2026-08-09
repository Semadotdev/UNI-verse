import { NextRequest, NextResponse } from 'next/server';
import { LeaderboardService } from '@/application/services/leaderboard.service';
import { getAuthUserId } from '@/lib/auth';
import { successResponse, errorResponse } from '@/domain/types/api';

const leaderboardService = new LeaderboardService();

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;

function parseType(value: string | null): 'posts' | 'readers' | null {
  return value === 'posts' || value === 'readers' ? value : null;
}

export async function GET(request: NextRequest) {
  try {
    await getAuthUserId();

    const { searchParams } = new URL(request.url);
    const type = parseType(searchParams.get('type'));
    if (!type) {
      return NextResponse.json(errorResponse('INVALID_TYPE', 'type must be "posts" or "readers"'), { status: 400 });
    }

    const requested = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
    const limit = Number.isNaN(requested) ? DEFAULT_LIMIT : Math.min(Math.max(requested, 1), MAX_LIMIT);

    const entries = type === 'posts'
      ? await leaderboardService.getTopPosters(limit)
      : await leaderboardService.getTopReaders(limit);

    return NextResponse.json(successResponse({ type, entries }));
  } catch (error) {
    return NextResponse.json(
      errorResponse('LEADERBOARD_ERROR', error instanceof Error ? error.message : 'Failed to load leaderboard'),
      { status: 500 }
    );
  }
}
