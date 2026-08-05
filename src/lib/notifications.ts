export interface FeatureNotification {
  id: string;
  title: string;
  description: string;
  date: string;
}

export const FEATURE_NOTIFICATIONS: FeatureNotification[] = [
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
  {
    id: "swipe-navigation",
    title: "Swipe navigation",
    description: "Swipe left or right to flip between chapters on mobile.",
    date: "Aug 2026",
  },
  {
    id: "reading-modes",
    title: "Reading modes",
    description: "Choose between long-strip or paged layouts, per manga.",
    date: "Aug 2026",
  },
];

export const NOTIFICATIONS_STORAGE_KEY = "uni-verse-notifications-read";
