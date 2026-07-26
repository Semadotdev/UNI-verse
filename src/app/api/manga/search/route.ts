import { NextRequest, NextResponse } from 'next/server';
import { SearchService } from '@/application/services/search.service';
import { successResponse, errorResponse } from '@/domain/types/api';
import type { ProviderFilters } from '@/domain/interfaces/provider';

const searchService = new SearchService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const providers = searchParams.get('providers')?.split(',').filter(Boolean);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const sort = searchParams.get('sort') || undefined;
    const status = searchParams.get('status') || undefined;
    const minChapters = parseInt(searchParams.get('minChapters') || '0', 10) || undefined;

    if (!query) {
      return NextResponse.json(errorResponse('MISSING_QUERY', 'Search query is required'), { status: 400 });
    }

    const filters: ProviderFilters | undefined = (tags?.length || sort || status || minChapters) ? { tags, sort, status, minChapters } : undefined;
    const results = await searchService.search(query, providers, page, filters);
    return NextResponse.json(successResponse(results.data, {
      page: results.page,
      totalPages: results.totalPages,
      totalItems: results.data.length,
      hasMore: results.hasMore,
    }));
  } catch (error) {
    return NextResponse.json(
      errorResponse('SEARCH_ERROR', error instanceof Error ? error.message : 'Search failed'),
      { status: 500 }
    );
  }
}
