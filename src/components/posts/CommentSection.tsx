"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiClient } from "@/lib/api-client";
import { useToast } from "@/contexts/ToastContext";
import { timeAgo } from "@/shared/utils/time";
import { PostMenu } from "@/components/posts/PostMenu";
import type { Comment } from "@/domain/entities/comment";

interface Viewer {
  avatarUrl: string | null;
  username: string | null;
  name: string | null;
}

interface CommentSectionProps {
  postId: string;
  viewer: Viewer | null;
  onCountChange: (delta: number) => void;
}

export function CommentSection({ postId, viewer, onCountChange }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const { addToast } = useToast();

  const load = async (p: number, append = false) => {
    const res = await ApiClient.getWithMeta<Comment[]>(`/api/posts/${postId}/comments?page=${p}&limit=20`);
    setComments((prev) => (append ? [...prev, ...res.data] : res.data));
    setHasMore(Boolean(res.meta?.hasMore));
    setPage(p);
  };

  useEffect(() => {
    load(1).catch(() => {}).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const submit = async () => {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const created = await ApiClient.post<Comment>(`/api/posts/${postId}/comments`, { body: text });
      setComments((prev) => [...prev, created]);
      setBody("");
      onCountChange(1);
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to post comment", "error");
    } finally {
      setSending(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await ApiClient.delete<{ deleted: boolean }>(`/api/comments/${id}`);
      setComments((prev) => prev.filter((c) => c.id !== id));
      onCountChange(-1);
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to delete comment", "error");
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-3">
      {loading && <p className="text-xs text-muted">Loading comments...</p>}
      {!loading && comments.length === 0 && (
        <p className="text-xs text-muted">No comments yet.</p>
      )}

      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-2">
          {comment.author.username ? (
            <Link
              href={`/profile/${encodeURIComponent(comment.author.username)}`}
              className="shrink-0"
              title="View profile"
            >
              {comment.author.avatarUrl ? (
                <img src={comment.author.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover bg-bg-overlay hover:opacity-80 transition-opacity" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-primary/30 hover:opacity-80 transition-opacity" />
              )}
            </Link>
          ) : comment.author.avatarUrl ? (
            <img src={comment.author.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover bg-bg-overlay shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-primary/30 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {comment.author.username ? (
                <Link
                  href={`/profile/${encodeURIComponent(comment.author.username)}`}
                  className="text-xs font-semibold text-zinc-200 truncate hover:text-primary-light transition-colors"
                >
                  {comment.author.username}
                </Link>
              ) : (
                <span className="text-xs font-semibold text-zinc-200 truncate">
                  {comment.author.username ?? comment.author.name ?? "Unknown"}
                </span>
              )}
              <span className="text-[11px] text-muted shrink-0">{timeAgo(comment.createdAt)}</span>
            </div>
            <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words">{comment.body}</p>
          </div>
          {comment.canDelete && (
            <PostMenu
              items={[{ label: "Delete", danger: true, onClick: () => remove(comment.id) }]}
            />
          )}
        </div>
      ))}

      {hasMore && (
        <button
          onClick={() => load(page + 1, true)}
          className="text-xs text-primary hover:text-primary-light transition-colors"
        >
          Load older comments
        </button>
      )}

      <div className="flex gap-2">
        {viewer?.avatarUrl ? (
          <img src={viewer.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover bg-bg-overlay shrink-0" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-primary/30 shrink-0" />
        )}
        <div className="flex-1 flex items-center gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={1}
            placeholder="Add a comment..."
            className="flex-1 resize-none rounded-lg border border-border bg-bg-overlay px-3 py-2 text-sm text-zinc-200 placeholder:text-muted focus:outline-none focus:border-primary/50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <button
            onClick={submit}
            disabled={sending || !body.trim()}
            className="px-3 py-2 text-sm rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50 shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
