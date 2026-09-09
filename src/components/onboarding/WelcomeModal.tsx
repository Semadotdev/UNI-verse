"use client";

import { Modal } from "@/components/ui/Modal";
import { useTour } from "./TourContext";

const features = [
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    title: "Search & Discover",
    description: "Find manga from multiple sources with powerful filters.",
  },
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      </svg>
    ),
    title: "Personal Library",
    description: "Save favorites and organize them into folders.",
  },
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
    title: "Community",
    description: "Create posts, share recommendations, and connect with readers.",
  },
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    title: "Customizable Reader",
    description: "Multiple reading modes, themes, and settings to fit your style.",
  },
];

export function WelcomeModal() {
  const { showWelcome, dismissWelcome, startTour } = useTour();

  return (
    <Modal open={showWelcome} onClose={dismissWelcome} size="md">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center">
            <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-bold text-zinc-100 mb-2">Welcome to UNI-verse!</h2>
        <p className="text-sm text-zinc-400 mb-6">
          Your gateway to reading manga from multiple sources. Here&apos;s what you can do:
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50"
            >
              <div className="text-primary">{f.icon}</div>
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-200">{f.title}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{f.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={startTour}
            className="w-full px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-glow hover:shadow-glow-lg"
          >
            Take a Quick Tour
          </button>
          <button
            type="button"
            onClick={dismissWelcome}
            className="w-full px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-sm font-semibold transition-all duration-200"
          >
            Skip for Now
          </button>
        </div>
      </div>
    </Modal>
  );
}
