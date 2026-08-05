"use client";

import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/api-client";
import { ProfileView } from "@/components/profile/ProfileView";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { PostSkeleton } from "@/components/posts/PostSkeleton";
import type { ProfileData } from "@/components/profile/types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    ApiClient.get<ProfileData>("/api/me")
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSaved = (update: { bio: string | null; avatarUrl: string | null }) => {
    setProfile((p) => (p ? { ...p, ...update } : p));
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto w-full px-4 py-6 pb-24 md:pb-10">
        <PostSkeleton />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-6 pb-24 md:pb-10">
      <ProfileView
        profile={profile}
        viewer={profile}
        isOwn
        onEdit={() => setEditing(true)}
      />
      {editing && (
        <ProfileEditor
          profile={profile}
          onClose={() => setEditing(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
