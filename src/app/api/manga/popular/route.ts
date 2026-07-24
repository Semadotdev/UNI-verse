import { NextRequest, NextResponse } from 'next/server';
import { SearchService } from '@/application/services/search.service';
import { ProviderService } from '@/application/services/provider.service';
import { successResponse, errorResponse } from '@/domain/types/api';
import type { ProviderFilters } from '@/domain/interfaces/provider';

const searchService = new SearchService();
const providerService = new ProviderService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let providerId = searchParams.get('providerId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const sort = searchParams.get('sort') || undefined;

    if (!providerId) {
      const providers = await providerService.getEnabled();
      const enabled = providers.find((p) => p.enabled);
      if (!enabled) {
        return NextResponse.json(errorResponse('NO_PROVIDERS', 'No enabled providers available'), { status: 404 });
      }
      providerId = enabled.providerId;
    }

    const filters: ProviderFilters | undefined = (tags?.length || sort) ? { tags, sort } : undefined;
    const results = await searchService.getPopular(providerId, page, filters);
    return NextResponse.json(successResponse(results.data, {
      page: results.page,
      totalPages: results.totalPages,
      totalItems: results.data.length,
      hasMore: results.hasMore,
    }));
  } catch (error) {
    return NextResponse.json(
      errorResponse('POPULAR_ERROR', error instanceof Error ? error.message : 'Failed to get popular manga'),
      { status: 500 }
    );
  }
}
