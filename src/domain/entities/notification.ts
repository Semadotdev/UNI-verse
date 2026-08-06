import type { PostAuthor } from '@/domain/entities/post';

export type NotificationType = 'like' | 'comment' | 'reply' | 'friend';

export interface AppNotification {
  id: string;
  type: NotificationType;
  postId: string | null;
  commentId: string | null;
  read: boolean;
  createdAt: string;
  actor: PostAuthor;
  postSnippet: string | null;
  commentSnippet: string | null;
}
