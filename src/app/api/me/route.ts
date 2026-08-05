import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { prisma } from '@/infrastructure/database/prisma-client';
import { successResponse, errorResponse } from '@/domain/types/api';

export async function GET() {
  try {
    const userId = await getAuthUserId();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, name: true, avatarUrl: true, role: true },
    });
    if (!user) {
      return NextResponse.json(errorResponse('NOT_FOUND', 'User not found'), { status: 404 });
    }
    return NextResponse.json(successResponse(user));
  } catch (error) {
    return NextResponse.json(
      errorResponse('AUTH_ERROR', error instanceof Error ? error.message : 'Failed to get user'),
      { status: 401 }
    );
  }
}
