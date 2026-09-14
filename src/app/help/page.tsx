import { readFileSync } from "node:fs";
import { join } from "node:path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center | UNI-verse",
  description: "A complete guide to using UNI-verse — reading manga, page comments, library, community, and rewards.",
};

export const dynamic = "force-static";

const manual = readFileSync(join(process.cwd(), "USER-MANUAL.md"), "utf8");

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <h1 className="text-2xl font-bold mb-2">Help Center</h1>
      <p className="text-sm text-muted mb-8">A complete guide to UNI-verse.</p>

      <article className="prose-dark max-w-3xl">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
          {manual}
        </ReactMarkdown>
      </article>
    </div>
  );
}