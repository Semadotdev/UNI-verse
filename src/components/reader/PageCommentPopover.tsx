"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Flag, Trash2, X } from "lucide-react";
import { ApiClient } from "@/lib/api-client";
import { useToast } from "@/contexts/ToastContext";
import { timeAgo } from "@/shared/utils/time";
import { ConfirmModal } from "@/components/posts/ConfirmModal";
import { ReportModal } from "@/components/posts/ReportModal";
import type { PageComment } from "@/domain/entities/page-comment";

interface Viewer {
  avatarUrl: string | null;
  username: string | null;
  name: string | null;
}

interface PageCommentPopoverProps {
  comments: PageComment[];
  viewer: Viewer | null;
  providerId: string;
  mangaId: string;
  chapterId: string;
  pageIndex: number;
  pageY: number;
  onClose: () => void;
  onCreated: (comment: PageComment) => void;
  onDeleted: (commentId: string) => void;
}

function CommentAvatar({ username, avatarUrl }: { username: string | null; avatarUrl: string | null }) {
  if (username) {
    return (
      <Link href={`/profile/${encodeURIComponent(username)}`} className="shrink-0" title="View profile">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover bg-bg-overlay hover:opacity-80 transition-opacity" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-primary/30 hover:opacity-80 transition-opacity" />
        )}
      </Link>
    );
  }
  return avatarUrl ? (
    <img src={avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover bg-bg-overlay shrink-0" />
  ) : (
    <div className="w-6 h-6 rounded-full bg-primary/30 shrink-0" />
  );
}

export function PageCommentPopover({
  comments,
  viewer,
  providerId,
  mangaId,
  chapterId,
  pageIndex,
  pageY,
  onClose,
  onCreated,
  onDeleted,
}: PageCommentPopoverProps) {
  const [replyBody, setReplyBody] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [reportTarget, setReportTarget] = useState<PageComment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PageComment | null>(null);
  const [localReported, setLocalReported] = useState<Set<string>>(new Set());
  const { addToast } = useToast();

  const submitReply = async () => {
    const text = replyBody.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const comment = await ApiClient.post<PageComment>(
        `/api/page-comments/${providerId}/${mangaId}/${chapterId}`,
        { body: text, pageIndex, pageY, parentId: replyingTo?.id }
      );
      onCreated(comment);
      setReplyBody("");
      setReplyingTo(null);
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to post reply", "error");
    } finally {
      setSending(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await ApiClient.delete<{ deleted: boolean }>(`/api/page-comments/comment/${id}`);
      addToast("Comment deleted", "success");
      onDeleted(id);
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to delete comment", "error");
    }
  };

  const isReported = (comment: PageComment) => comment.reported || localReported.has(comment.id);

  const renderComment = (comment: PageComment, indented = false) => (
    <div key={comment.id} className="flex gap-2">
      <CommentAvatar username={comment.author.username} avatarUrl={comment.author.avatarUrl} />
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
              {comment.author.name ?? "Unknown"}
            </span>
          )}
          <span className="text-[10px] text-muted shrink-0">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className={`${indented ? "text-[12px]" : "text-[13px]"} text-zinc-300 whitespace-pre-wrap break-words`}>
          {comment.body}
        </p>
        {viewer && (
          <button
            onClick={() =>
              setReplyingTo({ id: comment.id, username: comment.author.username ?? comment.author.name ?? "user" })
            }
            className="text-[10px] text-primary hover:text-primary-light transition-colors mt-0.5"
          >
            Reply
          </button>
        )}
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {viewer && !comment.isOwn && (
          isReported(comment) ? (
            <span className="text-[9px] text-muted uppercase" title="You reported this comment">
              Reported
            </span>
          ) : (
            <button
              onClick={() => setReportTarget(comment)}
              className="text-muted hover:text-amber-400 transition-colors"
              title="Report comment"
            >
              <Flag className="h-3 w-3" />
            </button>
          )
        )}
        {comment.canDelete && (
          <button
            onClick={() => setDeleteTarget(comment)}
            className="text-muted hover:text-red-400 transition-colors"
            title="Delete comment"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="absolute right-10 z-30 w-72 max-h-96 bg-bg-raised border border-border rounded-xl shadow-xl overflow-hidden flex flex-col" style={{ top: `${pageY * 100}%`, transform: "translateY(-50%)" }}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold text-zinc-200">
          {comments.length} comment{comments.length !== 1 ? "s" : ""}
        </span>
        <button onClick={onClose} className="text-muted hover:text-zinc-100 transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="space-y-2">
            {renderComment(comment)}
            {comment.replies.length > 0 && (
              <div className="ml-6 space-y-2 border-l border-border pl-2">
                {comment.replies.map((reply) => renderComment(reply, true))}
              </div>
            )}
          </div>
        ))}
      </div>

      {viewer && (
        <div className="border-t border-border px-3 py-2">
          {replyingTo && (
            <div className="flex items-center justify-between mb-1 text-[10px] text-muted">
              <span>
                Replying to <span className="text-primary-light">@{replyingTo.username}</span>
              </span>
              <button onClick={() => setReplyingTo(null)} className="hover:text-zinc-100">×</button>
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={1}
              placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
              className="flex-1 resize-none rounded-lg border border-border bg-bg-overlay px-2 py-1.5 text-[12px] text-zinc-200 placeholder:text-muted focus:outline-none focus:border-primary/50"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitReply();
                }
              }}
            />
            <button
              onClick={submitReply}
              disabled={sending || !replyBody.trim()}
              className="px-2 py-1 text-[11px] rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50 shrink-0"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {reportTarget &&
        createPortal(
          <ReportModal
            open
            title="Report comment"
            url={`/api/page-comments/comment/${reportTarget.id}/report`}
            onClose={() => setReportTarget(null)}
            onReported={() => {
              setLocalReported((prev) => new Set(prev).add(reportTarget.id));
            }}
          />,
          document.body
        )}

      {deleteTarget &&
        createPortal(
          <ConfirmModal
            open
            title="Delete comment"
            message="This will permanently delete the comment."
            confirmLabel="Delete"
            onClose={() => setDeleteTarget(null)}
            onConfirm={() => remove(deleteTarget.id)}
          />,
          document.body
        )}
    </div>
  );
}