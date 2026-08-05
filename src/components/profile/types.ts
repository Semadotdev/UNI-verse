export interface ProfileData {
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  postCount: number;
}

export interface Viewer {
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
}
