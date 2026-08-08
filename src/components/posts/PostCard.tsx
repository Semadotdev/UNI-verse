"use client";

import { useState } from "react";
import Link from "next/link";
import { ApiClient } from "@/lib/api-client";
import { useToast } from "@/contexts/ToastContext";
import { timeAgo } from "@/shared/utils/time";
import { cn } from "@/lib/utils";
import { PostMenu } from "@/components/posts/PostMenu";
import { PostImageGrid } from "@/components/posts/PostImageGrid";
import { FolderAttachmentCard } from "@/components/posts/FolderAttachmentCard";
import { FolderPreviewModal } from "@/components/posts/FolderPreviewModal";
import { CommentSection } from "@/components/posts/CommentSection";
import { ReportModal } from "@/components/posts/ReportModal";
import { ConfirmModal } from "@/components/posts/ConfirmModal";
import { NsfwBadge } from "@/components/ui/NsfwBadge";
import type { Post } from "@/domain/entities/post";

interface Viewer {
  avatarUrl: string | null;
  username: string | null;
  name: string | null;
}

interface PostCardProps {
  post: Post;
  viewer: Viewer | null;
  hideAuthor?: boolean;
  onEdit?: (post: Post) => void;
  onEdited: (post: Post) => void;
  onDeleted: (id: string) => void;
}

export function PostCard({ post, viewer, hideAuthor = false, onEdit, onDeleted }: PostCardProps) {
  const { addToast } = useToast();
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [liked, setLiked] = useState(post.likedByMe);
  const [likePending, setLikePending] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [showReport, setShowReport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);

  const menuItems: { label: string; danger?: boolean; onClick: () => void }[] = [];
  if (post.canEdit && onEdit) {
    menuItems.push({ label: "Edit", onClick: () => onEdit(post) });
  }
  if (post.canDelete) {
    menuItems.push({ label: "Delete", danger: true, onClick: () => setShowDelete(true) });
  }
  if (!post.canDelete) {
    menuItems.push({ label: "Report", danger: true, onClick: () => setShowReport(true) });
  }

  const toggleLike = async () => {
    if (likePending) return;
    setLikePending(true);
    try {
      if (liked) {
        await ApiClient.delete<{ liked: boolean }>(`/api/posts/${post.id}/like`);
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      } else {
        await ApiClient.post<{ liked: boolean }>(`/api/posts/${post.id}/like`);
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to update like", "error");
    } finally {
      setLikePending(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await ApiClient.delete<{ deleted: boolean }>(`/api/posts/${post.id}`);
      addToast("Post deleted", "success");
      onDeleted(post.id);
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to delete post", "error");
    }
  };

  return (
    <article className="rounded-2xl border border-border bg-bg-raised p-4">
      <div className="flex items-center gap-2">
        {!hideAuthor && (
          <>
            {post.author.username ? (
              <Link
                href={`/profile/${encodeURIComponent(post.author.username)}`}
                className="shrink-0"
                title="View profile"
              >
                {post.author.avatarUrl ? (
                  <img src={post.author.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover bg-bg-overlay hover:opacity-80 transition-opacity" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary/30 hover:opacity-80 transition-opacity" />
                )}
              </Link>
            ) : post.author.avatarUrl ? (
              <img src={post.author.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover bg-bg-overlay" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/30" />
            )}
            <div className="flex-1 min-w-0">
              {post.author.username ? (
                <Link
                  href={`/profile/${encodeURIComponent(post.author.username)}`}
                  className="block text-sm font-semibold text-zinc-100 truncate hover:text-primary-light transition-colors"
                >
                  {post.author.name ?? post.author.username}
                </Link>
              ) : (
                <p className="text-sm font-semibold text-zinc-100 truncate">
                  {post.author.name ?? post.author.username ?? "Unknown"}
                </p>
              )}
              <p className="text-xs text-muted">{timeAgo(post.createdAt)}</p>
            </div>
          </>
        )}
        {hideAuthor && (
          <p className="flex-1 text-xs text-muted">{timeAgo(post.createdAt)}</p>
        )}
        {post.nsfw && <NsfwBadge className="shrink-0" />}
        {menuItems.length > 0 && <PostMenu items={menuItems} />}
      </div>

      {post.body && (
        <p className="mt-3 text-sm text-zinc-200 whitespace-pre-wrap break-words">{post.body}</p>
      )}

      {post.images.length > 0 && (
        <div className="mt-3">
          <PostImageGrid images={post.images} />
        </div>
      )}

      {post.folder && (
        <div className="mt-3">
          <FolderAttachmentCard folder={post.folder} onClick={() => setFolderOpen(true)} />
        </div>
      )}

      <div className="mt-3 flex items-center gap-1">
        <button
          onClick={toggleLike}
          disabled={likePending}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
            liked ? "text-primary bg-primary/10" : "text-muted hover:text-zinc-200 hover:bg-bg-overlay"
          )}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>

        <button
          onClick={() => setCommentsOpen((o) => !o)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
            commentsOpen ? "text-primary bg-primary/10" : "text-muted hover:text-zinc-200 hover:bg-bg-overlay"
          )}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          {commentCount > 0 && <span>{commentCount}</span>}
        </button>
      </div>

      {commentsOpen && (
        <CommentSection
          postId={post.id}
          viewer={viewer}
          onCountChange={(delta) => setCommentCount((c) => Math.max(0, c + delta))}
        />
      )}

      <ReportModal
        open={showReport}
        title="Report post"
        url={`/api/posts/${post.id}/report`}
        onClose={() => setShowReport(false)}
      />
      <ConfirmModal
        open={showDelete}
        title="Delete post"
        message="This will permanently delete the post and its comments."
        onClose={() => setShowDelete(false)}
        onConfirm={confirmDelete}
      />
      {folderOpen && post.folder && (
        <FolderPreviewModal
          postId={post.id}
          folder={post.folder}
          onClose={() => setFolderOpen(false)}
        />
      )}
    </article>
  );
}
