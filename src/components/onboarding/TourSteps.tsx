export interface TourHighlight {
  id: string;
  title: string;
  content: string;
  selector: string;
  placement?: "top" | "bottom" | "left" | "right";
  page: string;
  phase: "interactive" | "tooltip";
  advanceOn?: "click" | "disappear";
  userNavigates?: boolean;
  allowSelectors?: string[];
}

export const INTERACTIVE_STEPS: TourHighlight[] = [
  {
    id: "lib-new-folder",
    title: "Create a Folder",
    content: "Tap here to create your first folder for organizing manga.",
    selector: '[data-tour="new-folder"]',
    placement: "bottom",
    page: "/library",
    phase: "interactive",
  },
  {
    id: "lib-folder-create",
    title: "Name Your Folder",
    content: "Type a name and tap Create to make your folder.",
    selector: '[data-tour="folder-create"]',
    placement: "bottom",
    page: "/library",
    phase: "interactive",
    advanceOn: "disappear",
  },
  {
    id: "search-results",
    title: "Find Manga",
    content: "Search for any manga and tap on one to view it.",
    selector: '[data-tour="manga-results"]',
    placement: "top",
    page: "/search",
    phase: "interactive",
    allowSelectors: ['[data-tour="search-input"]'],
  },
  {
    id: "manga-add-library",
    title: "Add to Library",
    content: "Add this manga to the folder you just created.",
    selector: '[data-tour="add-to-library"]',
    placement: "bottom",
    page: "/manga",
    phase: "interactive",
    userNavigates: true,
  },
  {
    id: "manga-folder-pick",
    title: "Pick a Folder",
    content: "Tap the folder you created to add this manga to it.",
    selector: '[data-tour="folder-pick"]',
    placement: "right",
    page: "/manga",
    phase: "interactive",
    advanceOn: "disappear",
  },
  {
    id: "posts-create",
    title: "Share a Post",
    content: "Create a post to share your thoughts with the community.",
    selector: '[data-tour="create-post"]',
    placement: "bottom",
    page: "/posts",
    phase: "interactive",
  },
  {
    id: "posts-composer",
    title: "Write Your Post",
    content: "Write your post here. You can attach a folder or skip for now.",
    selector: '[data-tour="post-composer"]',
    placement: "top",
    page: "/posts",
    phase: "interactive",
    advanceOn: "disappear",
  },
];

export const TOOLTIP_STEPS: TourHighlight[] = [
  {
    id: "provider",
    title: "Switch Sources",
    content: "Switch between different manga sources. Each has its own library.",
    selector: "[data-tour='provider']",
    placement: "bottom",
    page: "*",
    phase: "tooltip",
  },
  {
    id: "theme",
    title: "Theme Settings",
    content: "Switch between dark, light, and system theme.",
    selector: "[data-tour='theme']",
    placement: "bottom",
    page: "*",
    phase: "tooltip",
  },
  {
    id: "notifications",
    title: "Notifications",
    content: "Stay updated with likes, comments, and activity.",
    selector: "[data-tour='notifications']",
    placement: "bottom",
    page: "*",
    phase: "tooltip",
  },
  {
    id: "leaderboard",
    title: "Leaderboard",
    content: "See the top posters and readers. Earn coins by reading and posting!",
    selector: '[data-tour="leaderboard"]',
    placement: "bottom",
    page: "*",
    phase: "tooltip",
  },
];

export const ALL_STEPS: TourHighlight[] = [...INTERACTIVE_STEPS, ...TOOLTIP_STEPS];