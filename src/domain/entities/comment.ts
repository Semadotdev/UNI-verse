import type { PostAuthor } from '@/domain/entities/post';

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: PostAuthor;
  canDelete: boolean;
  parentId: string | null;
  replies: Comment[];
}
