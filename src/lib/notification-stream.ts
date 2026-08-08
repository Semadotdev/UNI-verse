"use client";

import type { AppNotification } from "@/domain/entities/notification";

export interface NotificationStreamState {
  notifications: AppNotification[];
  unreadCount: number;
  connected: boolean;
}

export interface NotificationStreamMessage {
  type: "snapshot" | "notifications";
  notifications?: AppNotification[];
  unreadCount: number;
}

const listeners = new Set<() => void>();

let state: NotificationStreamState = {
  notifications: [],
  unreadCount: 0,
  connected: false,
};

let eventSource: EventSource | null = null;
let ownedByUserId: string | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

function snapshot(): NotificationStreamState {
  return state;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function teardown() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  ownedByUserId = null;
  state = {
    notifications: [],
    unreadCount: 0,
    connected: false,
  };
  emit();
}

function handleMessage(raw: string) {
  try {
    const parsed: NotificationStreamMessage = JSON.parse(raw);
    if (parsed.type === "snapshot") {
      state = { ...state, unreadCount: parsed.unreadCount };
    } else if (parsed.type === "notifications") {
      const incoming = parsed.notifications ?? [];
      const seen = new Set(state.notifications.map((n) => n.id));
      const fresh = incoming.filter((n) => !seen.has(n.id));
      state = {
        ...state,
        notifications: [...fresh.reverse(), ...state.notifications],
        unreadCount: parsed.unreadCount,
      };
    }
    emit();
  } catch {
    // Ignore malformed payloads
  }
}

function openStream() {
  if (eventSource) return;

  eventSource = new EventSource("/api/notifications/stream");
  state = { ...state, connected: true };
  emit();

  eventSource.onmessage = (event) => handleMessage(event.data);

  eventSource.onerror = () => {
    // The browser auto-reconnects; we just mirror the connection state and
    // fall back to a manual retry in case the stream is closed server-side.
    state = { ...state, connected: false };
    emit();
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    if (!reconnectTimer && ownedByUserId) {
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        openStream();
      }, 3000);
    }
  };
}

export function ensureNotificationStream(userId: string) {
  if (ownedByUserId === userId) {
    if (!eventSource) openStream();
    return;
  }

  teardown();
  ownedByUserId = userId;
  openStream();
}

export function closeNotificationStream() {
  teardown();
}

export function markAllNotificationsRead() {
  state = {
    ...state,
    notifications: state.notifications.map((n) => ({ ...n, read: true })),
    unreadCount: 0,
  };
  emit();
}

const SERVER_SNAPSHOT: NotificationStreamState = {
  notifications: [],
  unreadCount: 0,
  connected: false,
};

export const notificationStreamStore = {
  subscribe,
  getSnapshot: snapshot,
  getServerSnapshot: () => SERVER_SNAPSHOT,
};
