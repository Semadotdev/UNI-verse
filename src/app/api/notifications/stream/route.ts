import { NotificationService } from '@/application/services/notification.service';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/domain/types/api';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const notificationService = new NotificationService();

const POLL_INTERVAL_MS = 4000;
const HEARTBEAT_INTERVAL_MS = 15000;

function sseEncode(...lines: string[]): string {
  return `${lines.map((l) => `data: ${l}`).join('\n')}\n\n`;
}

function sseEvent(event: string, id: string, data: unknown): string {
  return `id: ${id}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  let userId: string;
  try {
    userId = await getAuthUserId();
  } catch {
    return new Response(JSON.stringify(errorResponse('UNAUTHORIZED', 'Unauthorized')), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();

  const lastEventId = request.headers.get('last-event-id') || undefined;
  let cursor: { createdAt: Date; id: string } | null = null;
  if (lastEventId) {
    const idx = lastEventId.lastIndexOf(':');
    if (idx !== -1) {
      const createdAt = new Date(lastEventId.slice(0, idx));
      const id = lastEventId.slice(idx + 1);
      if (!Number.isNaN(createdAt.getTime()) && id) {
        cursor = { createdAt, id };
      }
    }
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enqueue = (chunk: string) => {
        if (request.signal.aborted) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // Stream already closed — client disconnected.
        }
      };

      try {
        const unreadCount = await notificationService.unreadCount(userId);
        enqueue(sseEncode(JSON.stringify({ type: 'snapshot', unreadCount })));
      } catch {
        enqueue(sseEncode(JSON.stringify({ type: 'snapshot', unreadCount: 0 })));
      }

      let lastHeartbeat = Date.now();

      while (!request.signal.aborted) {
        try {
          const since = cursor ?? { createdAt: new Date(0), id: '' };
          const notifications = await notificationService.listForUserAfter(userId, since);
          if (notifications.length > 0) {
            const unreadCount = await notificationService.unreadCount(userId);
            const last = notifications[notifications.length - 1];
            cursor = { createdAt: new Date(last.createdAt), id: last.id };
            enqueue(
              sseEvent('notifications', `${cursor.createdAt.toISOString()}:${cursor.id}`, {
                notifications,
                unreadCount,
              })
            );
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to poll notifications';
          enqueue(sseEvent('error', `${Date.now()}`, { message }));
        }

        if (Date.now() - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
          enqueue(`: heartbeat\n\n`);
          lastHeartbeat = Date.now();
        }

        await sleep(POLL_INTERVAL_MS);
      }

      controller.close();
    },
    cancel() {
      // Client disconnected — the loop checks request.signal, so it exits
      // and the controller is closed on the next iteration.
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
