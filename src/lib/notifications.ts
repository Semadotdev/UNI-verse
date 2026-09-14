export interface FeatureNotification {
  id: string;
  title: string;
  description: string;
  date: string;
}

export const FEATURE_NOTIFICATIONS: FeatureNotification[] = [
  {
    id: "page-comments",
    title: "Page comments",
    description:
      "Long-press any page while reading to leave a comment at a specific spot, reply inline, and report spam.",
    date: "Sep 2026",
  },
];

export const NOTIFICATIONS_STORAGE_KEY = "uni-verse-notifications-read";
