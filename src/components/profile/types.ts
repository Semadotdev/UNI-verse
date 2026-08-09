import type { ProfileTheme } from "@/domain/constants/profile-themes";

export interface ProfileData {
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  postCount: number;
  friendCount?: number;
  isFriend?: boolean;
  theme?: ProfileTheme;
}

export interface Viewer {
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
}
