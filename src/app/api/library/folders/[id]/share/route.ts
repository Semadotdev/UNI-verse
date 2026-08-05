import { NextRequest, NextResponse } from 'next/server';
import { SharedService } from '@/application/services/shared.service';
import { successResponse, errorResponse } from '@/domain/types/api';
import { getAuthUserId } from '@/lib/auth';

const sharedService = new SharedService();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;
    const share = await sharedService.getShare(id, userId);
    return NextResponse.json(successResponse(share));
  } catch (error) {
    return NextResponse.json(
      errorResponse('SHARE_ERROR', error instanceof Error ? error.message : 'Failed to get share'),
      { status: 500 }
    );
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;
    const share = await sharedService.enableShare(id, userId);
    return NextResponse.json(successResponse(share));
  } catch (error) {
    return NextResponse.json(
      errorResponse('SHARE_ERROR', error instanceof Error ? error.message : 'Failed to share folder'),
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id } = await params;
    await sharedService.disableShare(id, userId);
    return NextResponse.json(successResponse({ deleted: true }));
  } catch (error) {
    return NextResponse.json(
      errorResponse('SHARE_ERROR', error instanceof Error ? error.message : 'Failed to stop sharing'),
      { status: 500 }
    );
  }
}
