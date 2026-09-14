"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { ApiClient } from "@/lib/api-client";
import { useToast } from "@/contexts/ToastContext";
import type { PageComment } from "@/domain/entities/page-comment";

interface PageCommentComposerProps {
  providerId: string;
  mangaId: string;
  chapterId: string;
  pageIndex: number;
  pageY: number;
  viewer: { username: string | null; avatarUrl: string | null } | null;
  onClose: () => void;
  onCreated: (comment: PageComment) => void;
}

export function PageCommentComposer({
  providerId,
  mangaId,
  chapterId,
  pageIndex,
  pageY,
  viewer,
  onClose,
  onCreated,
}: PageCommentComposerProps) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  if (!viewer) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
        <div
          className="bg-bg-raised border border-border rounded-xl p-6 max-w-sm w-full mx-4 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm text-zinc-300 mb-4">Log in to leave a comment</p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  const submit = async () => {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const comment = await ApiClient.post<PageComment>(
        `/api/page-comments/${providerId}/${mangaId}/${chapterId}`,
        { body: text, pageIndex, pageY }
      );
      onCreated(comment);
      onClose();
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to post comment", "error");
    } finally {
      setSending(false);
    }
  };

  const pctY = Math.round(pageY * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-bg-raised border border-border rounded-xl p-5 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-200">
            Comment on page {pageIndex + 1} · {pctY}% down
          </h3>
          <button onClick={onClose} className="text-muted hover:text-zinc-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="What do you think about this part?"
          className="w-full resize-none rounded-lg border border-border bg-bg-overlay px-3 py-2 text-sm text-zinc-200 placeholder:text-muted focus:outline-none focus:border-primary/50"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-muted hover:text-zinc-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={sending || !body.trim()}
            className="px-4 py-1.5 text-sm rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
        <p className="text-[11px] text-muted mt-2">Ctrl+Enter to send</p>
      </div>
    </div>
  );
}
