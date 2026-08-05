"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";

interface FriendSearchProps {
  onClose: () => void;
}

export function FriendSearch({ onClose }: FriendSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const search = () => {
    const username = query.trim().replace(/^@/, "");
    if (!username) return;
    router.push(`/profile/${encodeURIComponent(username)}`);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Find friends"
      size="sm"
      footer={
        <button
          onClick={search}
          disabled={!query.trim()}
          className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-light transition-colors disabled:opacity-50"
        >
          Search
        </button>
      }
    >
      <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
        Username
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            search();
          }
        }}
        placeholder="@username"
        autoFocus
        className="w-full rounded-lg border border-border bg-bg-overlay px-3 py-2 text-sm text-zinc-200 placeholder:text-muted focus:outline-none focus:border-primary/50"
      />
      <p className="mt-2 text-xs text-muted">Search for a user by their @username to view their profile.</p>
    </Modal>
  );
}
