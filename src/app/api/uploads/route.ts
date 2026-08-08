import { NextRequest, NextResponse } from 'next/server';
import { UploadService } from '@/application/services/upload.service';
import { getAuthUserId } from '@/lib/auth';
import { successResponse, errorResponse } from '@/domain/types/api';
import { enforceRateLimit } from '@/shared/utils/rate-limit';

const uploadService = new UploadService();

const VALIDATION_ERRORS = new Set(['Invalid file type', 'File too large']);

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const rateLimit = await enforceRateLimit(request, 'upload:image', 5 * 60 * 1000, 5, 'user', userId);
    if (rateLimit.response) return rateLimit.response;

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(errorResponse('MISSING_FILE', 'No file provided'), { status: 400 });
    }

    const result = await uploadService.uploadImage(userId, file);
    return NextResponse.json(successResponse(result));
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
