import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const IMAGE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const IMAGE_CACHE_MAX_FILES = 500;
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const EVICT_CHECK_MS = 60 * 1000;

export interface CachedImage {
  buffer: Buffer;
  contentType: string;
}

let lastEvictionCheck = 0;

function getCacheDir(): string {
  return process.env.IMAGE_CACHE_DIR ?? path.join(process.cwd(), '.cache', 'images');
}

function cacheId(url: string, headers?: Record<string, string>): string {
  return createHash('sha256').update(`${url}\n${JSON.stringify(headers ?? {})}`).digest('hex');
}

function metaPathFor(id: string): string {
  return path.join(getCacheDir(), `${id}.json`);
}

function binPathFor(id: string): string {
  return path.join(getCacheDir(), `${id}.bin`);
}

export async function getCachedImage(
  url: string,
  headers?: Record<string, string>
): Promise<CachedImage | undefined> {
  const id = cacheId(url, headers);
  try {
    const stat = await fs.stat(binPathFor(id));
    if (Date.now() - stat.mtimeMs > IMAGE_CACHE_TTL_MS) return undefined;
    const [metaRaw, buffer] = await Promise.all([
      fs.readFile(metaPathFor(id), 'utf8'),
      fs.readFile(binPathFor(id)),
    ]);
    if (buffer.length === 0 || buffer.length > MAX_SIZE_BYTES) return undefined;
    const meta = JSON.parse(metaRaw) as { contentType: string };
    return { buffer, contentType: meta.contentType };
  } catch {
    return undefined;
  }
}

export async function setCachedImage(
  url: string,
  headers: Record<string, string> | undefined,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const id = cacheId(url, headers);
  try {
    await fs.mkdir(getCacheDir(), { recursive: true });
    await fs.writeFile(binPathFor(id), buffer);
    await fs.writeFile(metaPathFor(id), JSON.stringify({ contentType }));
    await maybeEvictOldFiles();
  } catch {
    // best effort
  }
}

async function maybeEvictOldFiles(): Promise<void> {
  const now = Date.now();
  if (now - lastEvictionCheck < EVICT_CHECK_MS) return;
  lastEvictionCheck = now;
  try {
    const entries = await fs.readdir(getCacheDir(), { withFileTypes: true });
    const bins = entries.filter((e) => e.isFile() && e.name.endsWith('.bin'));
    if (bins.length <= IMAGE_CACHE_MAX_FILES) return;
    const files = await Promise.all(
      bins.map(async (e) => {
        const full = path.join(getCacheDir(), e.name);
        const stat = await fs.stat(full);
        return { full, mtimeMs: stat.mtimeMs };
      })
    );
    files.sort((a, b) => a.mtimeMs - b.mtimeMs);
    for (const file of files.slice(0, files.length - IMAGE_CACHE_MAX_FILES)) {
      await fs.unlink(file.full).catch(() => {});
      await fs.unlink(`${file.full.replace(/\.bin$/, '.json')}`).catch(() => {});
    }
  } catch {
    // best effort
  }
}