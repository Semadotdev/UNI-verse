import { NextRequest, NextResponse } from 'next/server';
import { SharedService } from '@/application/services/shared.service';
import { successResponse, errorResponse } from '@/domain/types/api';

const sharedService = new SharedService();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const shared = await sharedService.getSharedFolder(token);
    if (!shared) {
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Shared folder not found'),
        { status: 404 }
      );
    }
    return NextResponse.json(successResponse(shared));
  } catch (error) {
    return NextResponse.json(
      errorResponse('SHARE_ERROR', error instanceof Error ? error.message : 'Failed to get shared folder'),
      { status: 500 }
    );
  }
}
