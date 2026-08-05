import { getSupabaseAdminClient } from '@/infrastructure/storage/supabase-admin';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('UploadService');

const POST_IMAGES_BUCKET = 'post-images';
const AVATARS_BUCKET = 'avatars';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export class UploadService {
  async uploadImage(userId: string, file: File): Promise<{ url: string }> {
    this.assertValidImage(file);
    const path = `${userId}/${crypto.randomUUID()}${this.extensionFor(file.type)}`;
    await this.uploadObject(POST_IMAGES_BUCKET, path, file, `post image for user ${userId}`);
    return { url: this.publicUrl(POST_IMAGES_BUCKET, path) };
  }

  async uploadAvatar(userId: string, file: File): Promise<{ url: string }> {
    this.assertValidImage(file);
    const path = `${userId}/${crypto.randomUUID()}${this.extensionFor(file.type)}`;
    await this.uploadObject(AVATARS_BUCKET, path, file, `avatar for user ${userId}`);
    return { url: this.publicUrl(AVATARS_BUCKET, path) };
  }

  async deleteImages(urls: string[]): Promise<void> {
    const paths = urls
      .map((url) => this.pathFromUrl(url, POST_IMAGES_BUCKET))
      .filter((p): p is string => Boolean(p));
    if (paths.length === 0) return;
    const { error } = await getSupabaseAdminClient().storage.from(POST_IMAGES_BUCKET).remove(paths);
    if (error) logger.error('Failed to delete post images', error);
  }

  async deleteAvatar(url: string | null): Promise<void> {
    if (!url) return;
    const path = this.pathFromUrl(url, AVATARS_BUCKET);
    if (!path) return;
    const { error } = await getSupabaseAdminClient().storage.from(AVATARS_BUCKET).remove([path]);
    if (error) logger.error('Failed to delete avatar', error);
  }

  private assertValidImage(file: File): void {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Invalid file type');
    }
    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error('File too large');
    }
  }

  private async uploadObject(bucket: string, path: string, file: File, label: string): Promise<void> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await getSupabaseAdminClient()
      .storage.from(bucket)
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: '3600',
      });
    if (error) throw new Error(error.message);
    logger.info(`Uploaded ${label}`);
  }

  private publicUrl(bucket: string, path: string): string {
    const { data } = getSupabaseAdminClient().storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  private pathFromUrl(url: string, bucket: string): string | null {
    const marker = `/object/public/${bucket}/`;
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
