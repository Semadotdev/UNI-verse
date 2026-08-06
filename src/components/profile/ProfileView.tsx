"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ApiClient } from "@/lib/api-client";
import { useToast } from "@/contexts/ToastContext";
import { PostCard } from "@/components/posts/PostCard";
import { PostSkeleton } from "@/components/posts/PostSkeleton";
import { FriendSearch } from "@/components/profile/FriendSearch";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/posts/ConfirmModal";
import type { Post } from "@/domain/entities/post";
import type { FriendSummary } from "@/domain/entities/friend";
import type { ProfileData, Viewer } from "@/components/profile/types";

interface ProfileViewProps {
  profile: ProfileData;
  viewer: Viewer;
  isOwn: boolean;
  onEdit: () => void;
}

export function ProfileView({ profile, viewer, isOwn, onEdit }: ProfileViewProps) {
  const { addToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [postCount, setPostCount] = useState(profile.postCount);
  const [isFriend, setIsFriend] = useState(profile.isFriend ?? false);
  const [friendCount, setFriendCount] = useState(profile.friendCount ?? 0);
  const [friendPending, setFriendPending] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [confirmUnfriend, setConfirmUnfriend] = useState(false);
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsModalOpen, setFriendsModalOpen] = useState(false);

  const username = profile.username ?? "";

  const load = useCallback(async (p: number) => {
    if (!username) {
      setPosts([]);
      setHasMore(false);
      setPage(1);
      return;
    }
    const res = await ApiClient.getWithMeta<Post[]>(
      `/api/posts?username=${encodeURIComponent(username)}&page=${p}&limit=10`
    );
    setPosts((prev) => (p === 1 ? res.data : [...prev, ...res.data]));
    setHasMore(Boolean(res.meta?.hasMore));
    setPage(p);
  }, [username]);

  useEffect(() => {
    load(1).catch(() => {}).finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    setIsFriend(profile.isFriend ?? false);
    setFriendCount(profile.friendCount ?? 0);
    setPostCount(profile.postCount);
  }, [profile]);

  const handleSaved = (post: Post) => {
    setPosts((prev) => {
      const exists = prev.some((p) => p.id === post.id);
      return exists ? prev.map((p) => (p.id === post.id ? post : p)) : [post, ...prev];
    });
  };

  const handleDeleted = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setPostCount((c) => Math.max(0, c - 1));
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      await load(page + 1);
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  };

  const addFriend = async () => {
    if (friendPending || !profile.username) return;
    setFriendPending(true);
    try {
      await ApiClient.post("/api/friends", { username: profile.username });
      setIsFriend(true);
      setFriendCount((c) => c + 1);
      addToast("Friend added", "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to add friend", "error");
    } finally {
      setFriendPending(false);
    }
  };

  const unfriend = async () => {
    if (!profile.username) return;
    try {
      await ApiClient.delete(`/api/friends?username=${encodeURIComponent(profile.username)}`);
      setIsFriend(false);
      setFriendCount((c) => Math.max(0, c - 1));
      addToast("Friend removed", "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to remove friend", "error");
    }
  };

  const openFriends = () => {
    setFriendsModalOpen(true);
    if (!username) return;
    setFriendsLoading(true);
    ApiClient.get<{ friends: FriendSummary[] }>(
      `/api/users/${encodeURIComponent(username)}/friends`
    )
      .then((res) => setFriends(res.friends))
      .catch(() => setFriends([]))
      .finally(() => setFriendsLoading(false));
  };

  const joinedAt = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : "";

  return (
    <div>
      <div className="rounded-2xl border border-border bg-bg-raised p-5">
        <div className="flex items-start gap-4">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt=""
              className="w-24 h-24 rounded-full object-cover border-2 border-border bg-bg-overlay shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary/30 shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-zinc-100 break-words">
              {profile.name ?? profile.username ?? "User"}
            </h1>
            {profile.username && (
              <p className="text-sm text-muted">@{profile.username}</p>
            )}
            {profile.bio && (
              <p className="mt-2 text-sm text-zinc-200 whitespace-pre-wrap break-words">{profile.bio}</p>
            )}
            <div className="mt-3 flex items-center gap-4 text-xs text-muted">
              {joinedAt && <span>Joined {joinedAt}</span>}
              <span>
                {postCount} {postCount === 1 ? "post" : "posts"}
              </span>
              <span>
                {friendCount} {friendCount === 1 ? "friend" : "friends"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
          {isOwn ? (
            <>
              <button
                onClick={() => setSearchOpen(true)}
                className="px-4 py-1.5 text-sm rounded-lg border border-border bg-bg-overlay text-zinc-300 hover:border-primary/50 hover:text-zinc-100 transition-all"
              >
                Search
              </button>
              <button
                onClick={openFriends}
                className="px-4 py-1.5 text-sm rounded-lg border border-border bg-bg-overlay text-zinc-300 hover:border-primary/50 hover:text-zinc-100 transition-all"
              >
                Friends
              </button>
              <button
                onClick={onEdit}
                className="px-4 py-1.5 text-sm rounded-lg border border-border bg-bg-overlay text-zinc-300 hover:border-primary/50 hover:text-zinc-100 transition-all"
              >
                Edit profile
              </button>
            </>
          ) : isFriend ? (
            <button
              onClick={() => setConfirmUnfriend(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg border border-border bg-bg-overlay text-zinc-300 hover:border-primary/50 hover:text-zinc-100 transition-all"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <polyline points="17 11 19 13 23 9" />
              </svg>
              Friends
            </button>
          ) : (
            <button
              onClick={addFriend}
              disabled={friendPending}
              className="px-4 py-1.5 text-sm rounded-lg bg-primary text-white hover:bg-primary-light transition-colors disabled:opacity-50"
            >
              {friendPending ? "Adding..." : "Add Friend"}
            </button>
          )}
        </div>
      </div>

      <h2 className="mt-6 mb-3 text-sm font-semibold text-muted uppercase tracking-wider">Posts</h2>

      {loading ? (
        <div className="space-y-4">
          <PostSkeleton />
          <PostSkeleton />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted text-sm">No posts yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              viewer={viewer}
              hideAuthor
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

      {searchOpen && <FriendSearch onClose={() => setSearchOpen(false)} />}

      {isOwn && (
        <Modal
          open={friendsModalOpen}
          onClose={() => setFriendsModalOpen(false)}
          title="Friends"
          size="sm"
        >
          <div className="max-h-[60vh] overflow-y-auto">
            {friendsLoading ? (
              <p className="py-4 text-center text-sm text-muted">Loading friends…</p>
            ) : friends.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">No friends yet.</p>
            ) : (
              <ul className="space-y-1">
                {friends.map((f) => {
                  const friendUsername = f.username;
                  const friendLabel = f.name ?? friendUsername;
                  return (
                    <li key={friendUsername ?? f.avatarUrl ?? "?"}>
                      <Link
                        href={
                          friendUsername
                            ? `/profile/${encodeURIComponent(friendUsername)}`
                            : "#"
                        }
                        className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-bg-overlay"
                      >
                        {f.avatarUrl ? (
                          <img
                            src={f.avatarUrl}
                            alt=""
                            className="h-9 w-9 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <span className="h-9 w-9 shrink-0 rounded-full bg-primary/20 text-primary-light flex items-center justify-center text-sm font-bold">
                            {(friendLabel ?? "?").slice(0, 1).toUpperCase()}
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-zinc-100 truncate">
                            {friendLabel ?? friendUsername ?? "Friend"}
                          </span>
                          {friendUsername && friendUsername !== friendLabel && (
                            <span className="block text-xs text-muted truncate">
                              @{friendUsername}
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Modal>
      )}

      <ConfirmModal
        open={confirmUnfriend}
        title="Unfriend"
        message={`Remove ${profile.username ? "@" + profile.username : "this user"} from your friends?`}
        confirmLabel="Unfriend"
        onClose={() => setConfirmUnfriend(false)}
        onConfirm={unfriend}
      />
    </div>
  );
}
