"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ApiClient } from "@/lib/api-client";
import { ProfileView } from "@/components/profile/ProfileView";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { PostSkeleton } from "@/components/posts/PostSkeleton";
import type { ProfileData, Viewer } from "@/components/profile/types";
import type { ProfileUpdate } from "@/components/profile/ProfileEditor";

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [me, setMe] = useState<Viewer | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    ApiClient.get<ProfileData>(`/api/users/${encodeURIComponent(username)}`)
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    ApiClient.get<Viewer>("/api/me")
      .then((m) => {
        if (!cancelled) setMe(m);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto w-full px-4 py-6 pb-24 md:pb-10">
        <PostSkeleton />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="max-w-2xl mx-auto w-full px-4 py-6 pb-24 md:pb-10 text-center py-16">
        <p className="text-muted text-sm">User not found.</p>
      </div>
    );
  }

  const isOwn = me?.username != null && me.username === profile.username;
  const viewer: Viewer = me ?? { username: null, name: null, avatarUrl: null };

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-6 pb-24 md:pb-10">
      <ProfileView
        profile={profile}
        viewer={viewer}
        isOwn={isOwn}
        onEdit={() => setEditing(true)}
      />
      {isOwn && editing && (
        <ProfileEditor
          profile={profile}
          onClose={() => setEditing(false)}
          onSaved={(update) => {
            setProfile((p) => (p ? { ...p, ...update } : p));
            if (update.username && update.username !== username) {
              router.replace(`/profile/${encodeURIComponent(update.username)}`);
            }
          }}
        />
      )}
    </div>
  );
}
