export interface PostAuthor {
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
}

export interface PostFolderCover {
  providerId: string;
  mangaId: string;
  coverUrl: string;
}

export interface PostFolder {
  id: string;
  name: string;
  itemCount: number;
  covers: PostFolderCover[];
}

export interface PostFolderItem {
  providerId: string;
  mangaId: string;
  title: string;
  coverUrl: string;
  status: string;
  categories: string[];
}

export interface FolderPreview {
  id: string;
  name: string;
  itemCount: number;
  items: PostFolderItem[];
}

export interface Post {
  id: string;
  body: string;
  createdAt: string;
  images: { url: string }[];
  author: PostAuthor;
  folder: PostFolder | null;
  commentCount: number;
  likeCount: number;
  likedByMe: boolean;
  canDelete: boolean;
  canEdit: boolean;
}

export interface CreatePostInput {
  body: string;
  folderId?: string | null;
  imageUrls?: string[];
}

export interface UpdatePostInput {
  body?: string;
  folderId?: string | null;
}
