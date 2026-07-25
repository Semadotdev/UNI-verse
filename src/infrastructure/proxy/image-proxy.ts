import { createLogger } from '@/shared/utils/logger';
import { IMAGE_PROXY_CACHE_MAX_AGE } from '@/shared/constants';

const logger = createLogger('ImageProxy');
const BLOCKED_CONTENT_TYPES = ['text/html', 'text/plain', 'application/json'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

const REFERER_MAP: Record<string, string> = {
  'comix.to': 'https://comix.to/',
};

function getRefererForUrl(url: string): string | undefined {
  try {
    const hostname = new URL(url).hostname;
    for (const [domain, referer] of Object.entries(REFERER_MAP)) {
      if (hostname.includes(domain)) return referer;
    }
  } catch {}
  return undefined;
}

export interface ProxyImageResult {
  stream: ReadableStream;
  contentType: string;
  cacheControl: string;
}

export async function proxyImage(
  url: string,
  headers?: Record<string, string>
): Promise<ProxyImageResult> {
  const referer = getRefererForUrl(url);
  const fetchHeaders: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    ...(referer && { 'Referer': referer }),
    ...headers,
  };

  logger.debug(`Proxying image: ${url}`);

  const response = await fetch(url, { headers: fetchHeaders });

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg';

  if (BLOCKED_CONTENT_TYPES.some(t => contentType.includes(t))) {
    throw new Error(`Blocked content type: ${contentType}`);
  }

  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > MAX_SIZE_BYTES) {
    throw new Error(`Image too large: ${contentLength} bytes`);
  }

  const cacheControl = `public, max-age=${IMAGE_PROXY_CACHE_MAX_AGE}, immutable`;

  return {
    stream: response.body!,
    contentType,
    cacheControl,
  };
}
