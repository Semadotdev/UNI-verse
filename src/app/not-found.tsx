// src/app/not-found.tsx
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-bold">Page not found</h2>
      <p className="text-zinc-400">The page you are looking for does not exist.</p>
      <Link href="/">
        <Button>Go Home</Button>
      </Link>
    </div>
  );
}
