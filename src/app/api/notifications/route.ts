import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/application/services/notification.service';
import { getAuthUserId } from '@/lib/auth';
import { successResponse, errorResponse } from '@/domain/types/api';

const notificationService = new NotificationService();

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    const [notifications, unreadCount] = await Promise.all([
      notificationService.listForUser(userId, limit),
      notificationService.unreadCount(userId),
    ]);

    return NextResponse.json(successResponse({ notifications, unreadCount }));
  } catch (error) {
    return NextResponse.json(
      errorResponse('NOTIFICATIONS_ERROR', error instanceof Error ? error.message : 'Failed to load notifications'),
      { status: 401 }
    );
  }
}
