import type { ReactNode } from "react";
import {
  Bell,
  BookOpen,
  Coins,
  HelpCircle,
  Library,
  Rocket,
  Search,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface ManualStep {
  title: string;
  body?: ReactNode;
  action?: { label: string; href: string };
}

export interface ManualSection {
  id: string;
  title: string;
  icon: LucideIcon;
  blurb: string;
  steps: ManualStep[];
}

export const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Rocket,
    blurb: "Create an account and install UNI-verse for the best experience.",
    steps: [
      {
        title: "Install as an app (PWA)",
        body: "On mobile use \u201cAdd to Home Screen\u201d / \u201cInstall app\u201d. On desktop click the install icon in the address bar. Installed apps launch fullscreen, load faster, and work offline.",
      },
    ],
  },
  {
    id: "finding-and-reading",
    title: "Finding and Reading",
    icon: Search,
    blurb: "Search across all sources and start your next story.",
    steps: [
      {
        title: "Search",
        body: "Use the search bar to find any series. Results update as you type across all connected sources.",
        action: { label: "Open Search", href: "/search" },
      },
      {
        title: "Choose a source",
        body: "UNI-verse pulls manga from MangaDex, Asura Scans, Webtoons, Manhwa18, and more. Use the provider switcher in the navbar to browse a different source.",
      },
      {
        title: "Read a chapter",
        body: "Open a manga's detail page and pick a chapter to start reading.",
        action: { label: "Browse Manga", href: "/" },
      },
    ],
  },
  {
    id: "the-reader",
    title: "The Reader",
    icon: BookOpen,
    blurb: "Built for long-strip (webtoon) reading — with page comments.",
    steps: [
      {
        title: "Navigate chapters and pages",
        body: "Swipe left or right, or use the on-screen arrows. Open the chapter list to jump between chapters.",
      },
      {
        title: "Reader settings",
        body: "Adjust layout and reading options. Changes can be applied to just this manga or all manga.",
      },
      {
        title: "Reading history",
        body: "Your position saves automatically, so you can pick up where you left off on any device.",
        action: { label: "View History", href: "/history" },
      },
      {
        title: "Leave a page comment",
        body: "Long-press any page to pin a comment to that exact spot. Tap a marker to reply inline, and delete or report your own comments.",
      },
      {
        title: "Page load issues",
        body: "Tap Retry to reload a failed page. Persistent issues usually mean the source is temporarily down.",
      },
    ],
  },
  {
    id: "library-and-history",
    title: "Library and History",
    icon: Library,
    blurb: "Save manga, organize folders, and share what you read.",
    steps: [
      {
        title: "Add to Library",
        body: "Save any manga from its detail page to your library.",
        action: { label: "Open Library", href: "/library" },
      },
      {
        title: "Organize into folders",
        body: "Create folders like \u201cReading Now\u201d or \u201cCompleted\u201d to keep your library tidy.",
      },
      {
        title: "Share a folder",
        body: "Create public links for a folder and share them with anyone. Your library stays private by default.",
      },
      {
        title: "Track your history",
        body: "Chapters you open are tracked automatically. Clear items or your whole history anytime.",
        action: { label: "Open History", href: "/history" },
      },
    ],
  },
  {
    id: "community",
    title: "Community",
    icon: Users,
    blurb: "Share posts, react, and keep the feed respectful.",
    steps: [
      {
        title: "Create a post",
        body: "Share your thoughts with an optional image, attach a library folder, and tag adult content NSFW before posting.",
        action: { label: "Open Posts", href: "/posts" },
      },
      {
        title: "React and reply",
        body: "React to posts with an emoji of your choice, or reply directly in the comments.",
      },
      {
        title: "View images fullscreen",
        body: "Tap any image in the feed to open the lightbox.",
      },
      {
        title: "Report violations",
        body: "Use Report on a post or comment. It is anonymous and reviewed by moderators.",
      },
    ],
  },
  {
    id: "friends-and-profiles",
    title: "Friends and Profiles",
    icon: UserPlus,
    blurb: "Connect with readers and make your profile yours.",
    steps: [
      {
        title: "Add friends",
        body: "Add friends by their username and see friend counts on profiles.",
      },
      {
        title: "Customize your profile",
        body: "Set your bio and avatar, and browse your post history.",
        action: { label: "Open Profile", href: "/profile" },
      },
      {
        title: "Show off themes",
        body: "Unlock profile themes in the shop — including premium animated ones you can preview before buying.",
      },
    ],
  },
  {
    id: "rewards",
    title: "Rewards",
    icon: Coins,
    blurb: "Earn coins for reading and show off your collection.",
    steps: [
      {
        title: "Earn coins",
        body: "Complete chapters to earn coins — the more you read, the more you earn.",
      },
      {
        title: "Theme shop",
        body: "Spend coins on profile themes, including premium animated themes you can live-preview before buying.",
      },
      {
        title: "Leaderboard",
        body: "See who posts the most and who reads the most manga.",
        action: { label: "Open Leaderboard", href: "/leaderboard" },
      },
    ],
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: Bell,
    blurb: "Never miss a like, reply, or new feature.",
    steps: [
      {
        title: "Activity",
        body: "See likes, replies, comments, and friend requests as they happen — in real time.",
      },
      {
        title: "What's New",
        body: "Announcements for new features and improvements.",
      },
      {
        title: "Unread badge",
        body: "Your unread count updates automatically, and items you've read stay read.",
      },
    ],
  },
  {
    id: "troubleshooting-and-faq",
    title: "Troubleshooting and FAQ",
    icon: HelpCircle,
    blurb: "Common issues and quick answers.",
    steps: [
      {
        title: "Chapter won't open (404 / not found)",
        body: "The source may have changed its links or be temporarily down. Try a different provider, or try again later.",
      },
      {
        title: "Pages failing to load",
        body: "Tap Retry on the failed page, or refresh the reader. Clearing your browser cache helps after app updates.",
      },
      {
        title: "Missing coins",
        body: "Finish chapters to the last page. Refresh and check your balance, then reach out if it is still wrong.",
      },
      {
        title: "A comment was removed",
        body: "Comments can be removed if they violate our Community standards. Your own comments are always editable or deletable from the thread.",
      },
      {
        title: "Something else broken",
        body: "Check What's New for announcements, and review the Terms of Service and Privacy Policy for platform rules.",
      },
    ],
  },
];
