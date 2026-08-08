import { NextRequest, NextResponse } from 'next/server';
import { UploadService } from '@/application/services/upload.service';
import { getAuthUserId } from '@/lib/auth';
import { prisma } from '@/infrastructure/database/prisma-client';
import { successResponse, errorResponse } from '@/domain/types/api';
import { enforceRateLimit } from '@/shared/utils/rate-limit';

const uploadService = new UploadService();

const VALIDATION_ERRORS = new Set(['Invalid file type', 'File too large']);

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const rateLimit = await enforceRateLimit(request, 'upload:avatar', 60 * 1000, 5, 'user', userId);
    if (rateLimit.response) return rateLimit.response;

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(errorResponse('MISSING_FILE', 'No file provided'), { status: 400 });
    }

    const { url } = await uploadService.uploadAvatar(userId, file);

    const current = await prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } });
    await prisma.user.update({ where: { id: userId }, data: { avatarUrl: url } });
    if (current?.avatarUrl) {
      await uploadService.deleteAvatar(current.avatarUrl);
    }

    return NextResponse.json(successResponse({ url }));
  } catch (error) {
    if (error instanceof Error && VALIDATION_ERRORS.has(error.message)) {
      return NextResponse.json(errorResponse('UPLOAD_ERROR', error.message), { status: 400 });
    }
    return NextResponse.json(
      errorResponse('UPLOAD_ERROR', error instanceof Error ? error.message : 'Upload failed'),
      { status: 500 }
    );
  }
}
