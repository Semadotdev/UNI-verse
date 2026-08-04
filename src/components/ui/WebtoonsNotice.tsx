"use client";

import { useEffect, useState } from "react";
import { useProvider } from "@/contexts/ProviderContext";
import { Modal } from "./Modal";

const SHOWN_KEY = "uni-verse-webtoons-notice-shown";

export function WebtoonsNotice() {
  const { selectedProvider } = useProvider();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (selectedProvider !== "webtoons") {
      setOpen(false);
      return;
    }
    if (sessionStorage.getItem(SHOWN_KEY)) return;
    sessionStorage.setItem(SHOWN_KEY, "1");
    setOpen(true);
  }, [selectedProvider]);

  if (selectedProvider !== "webtoons") return null;

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Notice" size="sm">
      <div className="flex items-start gap-2.5 text-sm text-zinc-300">
        <svg className="h-5 w-5 shrink-0 text-primary-light mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <p>Some series may take longer to load, especially those with a large number of chapters.</p>
      </div>
    </Modal>
  );
}
