// src/app/error.tsx
"use client";

import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <p className="text-zinc-400">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
