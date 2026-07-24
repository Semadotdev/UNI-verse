export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  readerMode: 'paged' | 'webtoon';
  readingDirection: 'ltr' | 'rtl';
  backgroundColor: string;
  brightness: number;
  padding: number;
  language: string;
}
