import { getSupabaseAdminClient } from '@/infrastructure/storage/supabase-admin';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('UploadService');

const POST_IMAGES_BUCKET = 'post-images';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export class UploadService {
  async uploadImage(userId: string, file: File): Promise<{ url: string }> {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Invalid file type');
    }
    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error('File too large');
    }

    const path = `${userId}/${crypto.randomUUID()}${this.extensionFor(file.type)}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await getSupabaseAdminClient()
      .storage.from(POST_IMAGES_BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: '3600',
      });
    if (error) throw new Error(error.message);

    logger.info(`Uploaded post image for user ${userId}`);
    const { data } = getSupabaseAdminClient().storage.from(POST_IMAGES_BUCKET).getPublicUrl(path);
    return { url: data.publicUrl };
  }

  async deleteImages(urls: string[]): Promise<void> {
    const paths = urls
      .map((url) => this.pathFromUrl(url))
      .filter((p): p is string => Boolean(p));
    if (paths.length === 0) return;
    const { error } = await getSupabaseAdminClient().storage.from(POST_IMAGES_BUCKET).remove(paths);
    if (error) logger.error('Failed to delete post images', error);
  }

  private pathFromUrl(url: string): string | null {
    const marker = `/object/public/${POST_IMAGES_BUCKET}/`;
    const index = url.indexOf(marker);
    if (index === -1) return null;
    try {
      return decodeURIComponent(url.slice(index + marker.length));
    } catch {
      return null;
    }
  }

  private extensionFor(mime: string): string {
    switch (mime) {
      case 'image/jpeg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/gif':
        return '.gif';
      case 'image/webp':
        return '.webp';
      default:
        return '.jpg';
    }
  }
}
