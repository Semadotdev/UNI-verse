import type { PostAuthor } from '@/domain/entities/post';

export interface PageComment {
  id: string;
  body: string;
  author: PostAuthor;
  canDelete: boolean;
  parentId: string | null;
  replies: PageComment[];
  pageIndex: number;
  pageY: number;
  createdAt: string;
}