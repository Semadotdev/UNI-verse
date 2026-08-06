export interface FeatureNotification {
  id: string;
  title: string;
  description: string;
  date: string;
}

export const FEATURE_NOTIFICATIONS: FeatureNotification[] = [
  {
    id: "theme-switcher",
    title: "Theme switcher",
    description: "Switch between Dark, Light, or System themes right from the navbar.",
    date: "Aug 2026",
  },
  {
    id: "friend-system",
    title: "Friend system",
    description: "Add friends by username and see friend counts on profiles.",
    date: "Aug 2026",
  },
  {
    id: "profile-pages",
    title: "Profile pages",
    description: "Customize your bio and avatar and browse your post history.",
    date: "Aug 2026",
  },
  {
    id: "admin-reports",
    title: "Reports & moderation",
    description: "Report posts or comments and help keep UNIverse safe.",
    date: "Aug 2026",
  },
  {
    id: "image-lightbox",
    title: "Image lightbox & folder preview",
    description: "View post images fullscreen and add manga to your library from folder previews.",
    date: "Aug 2026",
  },
  {
    id: "folder-sharing",
    title: "Folder sharing",
    description: "Organize your library into folders and share public links with anyone.",
    date: "Aug 2026",
  },
  {
    id: "webtoons-source",
    title: "Webtoons source",
    description: "Read webtoons with the new Webtoons provider.",
    date: "Aug 2026",
  },
];

export const NOTIFICATIONS_STORAGE_KEY = "uni-verse-notifications-read";
