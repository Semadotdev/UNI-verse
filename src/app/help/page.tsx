import type { Metadata } from "next";
import { HelpGuide } from "@/components/help/HelpGuide";

export const metadata: Metadata = {
  title: "Help Center | UNI-verse",
  description: "A complete guide to using UNI-verse — reading manga, page comments, library, community, and rewards.",
};

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <h1 className="text-2xl font-bold mb-2">Help Center</h1>
      <p className="text-sm text-muted mb-8">
        Everything you need to get the most out of UNI-verse. Tap a topic to explore it.
      </p>

      <div className="max-w-3xl">
        <HelpGuide />
      </div>
    </div>
  );
}