export interface FeatureNotification {
  id: string;
  title: string;
  description: string;
  date: string;
}

export const FEATURE_NOTIFICATIONS: FeatureNotification[] = [
  {
    id: "animated-profile-themes",
    title: "Animated profile themes",
    description: "Six premium animated themes — Aurora, Stardust, Embers, Ocean Waves, Neon Pulse, and Digital Rain — animate your profile and live-preview in the shop.",
    date: "Aug 2026",
  },
  {
    id: "profile-themes-shop",
    title: "Profile themes shop",
    description: "Earn coins for completing chapters and spend them on profile themes in the new Themes shop.",
    date: "Aug 2026",
  },
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
