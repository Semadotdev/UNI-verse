import { NextResponse } from 'next/server';
import { NotificationService } from '@/application/services/notification.service';
import { getAuthUserId } from '@/lib/auth';
import { successResponse, errorResponse } from '@/domain/types/api';

const notificationService = new NotificationService();

export async function POST() {
  try {
    const userId = await getAuthUserId();
    await notificationService.markAllRead(userId);
    return NextResponse.json(successResponse({ read: true }));
  } catch (error) {
    return NextResponse.json(
      errorResponse('NOTIFICATIONS_ERROR', error instanceof Error ? error.message : 'Failed to mark notifications as read'),
      { status: 401 }
    );
  }
}
