"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiClient } from "@/lib/api-client";
import { useLibrary } from "@/contexts/LibraryContext";
import { PostComposer } from "@/components/posts/PostComposer";
import { PostCard } from "@/components/posts/PostCard";
import { PostSkeleton } from "@/components/posts/PostSkeleton";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { NsfwBadge } from "@/components/ui/NsfwBadge";
import type { Post } from "@/domain/entities/post";
import type { PostFeed } from "@/application/services/post-feed-where";

interface Viewer {
  avatarUrl: string | null;
  username: string | null;
  name: string | null;
  isAdult: boolean;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [feed, setFeed] = useState<PostFeed>("all");
  const { folders, refreshFolders } = useLibrary();

  const feedRef = useRef(feed);

  useEffect(() => {
    feedRef.current = feed;
  }, [feed]);

  const load = useCallback(async (p: number, f: PostFeed) => {
    if (p === 1) setLoading(true);
    try {
      const qs = f === "all" ? "" : `&filter=${f}`;
      const res = await ApiClient.getWithMeta<Post[]>(`/api/posts?page=${p}&limit=10${qs}`);
      if (f !== feedRef.current) return;
      setPosts((prev) => (p === 1 ? res.data : [...prev, ...res.data]));
      setHasMore(Boolean(res.meta?.hasMore));
      setPage(p);
    } finally {
      if (f === feedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFolders().catch(() => {});
    ApiClient.get<Viewer>("/api/me")
      .then((me) => setViewer(me))
      .catch(() => {});
  }, [refreshFolders]);

  useEffect(() => {
    load(1, feed).catch(() => {});
  }, [load, feed]);

  const handleSaved = (post: Post) => {
    setPosts((prev) => {
      const exists = prev.some((p) => p.id === post.id);
      return exists ? prev.map((p) => (p.id === post.id ? post : p)) : [post, ...prev];
    });
    setComposerOpen(false);
    setEditing(null);
  };

  const handleDeleted = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      await load(page + 1, feed);
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  };

  const openComposer = () => {
    setEditing(null);
    setComposerOpen(true);
  };

  const openEditor = (post: Post) => {
    setEditing(post);
    setComposerOpen(true);
  };

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-6 pb-24 md:pb-10">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-zinc-100">Posts</h1>
        <button
          onClick={openComposer}
          className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-light transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create post
        </button>
      </div>

      <SegmentedControl
        className="mb-5"
        value={feed}
        onChange={(v) => setFeed(v as PostFeed)}
        options={[
          { value: "all", label: "All" },
          { value: "friends", label: "Friends" },
          ...(viewer?.isAdult
            ? [{ value: "nsfw", label: <span className="flex items-center gap-1.5">NSFW <NsfwBadge /></span> }]
            : []),
        ]}
      />

      {loading ? (
        <div className="space-y-4">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted text-sm">No posts yet.</p>
          <button onClick={openComposer} className="mt-3 text-sm text-primary hover:text-primary-light transition-colors">
            Create your first post
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              viewer={viewer}
              onEdited={handleSaved}
              onDeleted={handleDeleted}
            />
          ))}
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full py-2.5 text-sm text-primary hover:text-primary-light transition-colors disabled:opacity-50"
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          )}
        </div>
      )}

      <PostComposer
        key={editing?.id ?? "create"}
        open={composerOpen}
        onClose={() => {
          setComposerOpen(false);
          setEditing(null);
        }}
        folders={folders}
        viewer={viewer}
        editing={editing}
        onSaved={handleSaved}
      />
    </div>
  );
}
