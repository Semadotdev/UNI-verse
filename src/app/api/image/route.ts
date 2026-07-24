import { proxyImage } from '@/infrastructure/proxy/image-proxy';
import { errorResponse } from '@/domain/types/api';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const headersParam = searchParams.get('headers');

    if (!url) {
      return Response.json(errorResponse('MISSING_URL', 'URL parameter is required'), { status: 400 });
    }

    let headers: Record<string, string> | undefined;
    if (headersParam) {
      try {
        headers = JSON.parse(headersParam);
      } catch {
        return Response.json(errorResponse('INVALID_HEADERS', 'Headers must be valid JSON'), { status: 400 });
      }
    }

    const result = await proxyImage(url, headers);

    return new Response(result.stream, {
      headers: {
        'Content-Type': result.contentType,
        'Cache-Control': result.cacheControl,
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return Response.json(
      errorResponse('PROXY_ERROR', error instanceof Error ? error.message : 'Failed to proxy image'),
      { status: 502 }
    );
  }
}
