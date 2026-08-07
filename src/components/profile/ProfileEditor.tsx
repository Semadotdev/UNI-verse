"use client";

import { useState } from "react";
import { ApiClient } from "@/lib/api-client";
import { useToast } from "@/contexts/ToastContext";
import { Modal } from "@/components/ui/Modal";
import type { ProfileData } from "@/components/profile/types";

const MAX_BIO_LENGTH = 200;
const MAX_NAME_LENGTH = 50;
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const AVATAR_TYPES = /^image\/(jpeg|png|gif|webp)$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

export interface ProfileUpdate {
  username: string | null;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

interface ProfileEditorProps {
  profile: ProfileData;
  onClose: () => void;
  onSaved: (update: ProfileUpdate) => void;
}

export function ProfileEditor({ profile, onClose, onSaved }: ProfileEditorProps) {
  const { addToast } = useToast();
  const [name, setName] = useState(profile.name ?? "");
  const [username, setUsername] = useState(profile.username ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pickFile = (file: File | null) => {
    if (!file) return;
    if (!AVATAR_TYPES.test(file.type)) {
      addToast("Invalid image type", "error");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      addToast("Image too large (max 5MB)", "error");
      return;
    }
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const save = async () => {
    if (saving) return;
    const cleanName = name.trim();
    if (cleanName.length > MAX_NAME_LENGTH) {
      addToast(`Name must be ${MAX_NAME_LENGTH} characters or fewer`, "error");
      return;
    }
    const cleanUsername = username.trim();
    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      addToast("Username must be 3-20 characters", "error");
      return;
    }
    if (!USERNAME_PATTERN.test(cleanUsername)) {
      addToast("Username can only contain letters, numbers, and underscores", "error");
      return;
    }
    setSaving(true);
    try {
      let avatarUrl = profile.avatarUrl;
      if (pendingFile) {
        const res = await ApiClient.upload<{ url: string }>("/api/avatar", pendingFile);
        avatarUrl = res.url;
      }
      const updated = await ApiClient.put<ProfileUpdate>("/api/me", {
        name: cleanName || null,
        username: cleanUsername,
        bio,
        avatarUrl,
      });
      addToast("Profile updated", "success");
      onSaved(updated);
      onClose();
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const currentAvatar = previewUrl ?? profile.avatarUrl;

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit profile"
      size="md"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-border bg-bg-raised text-zinc-300 hover:border-primary/50 hover:text-zinc-100 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-light transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </>
      }
    >
      <div className="flex items-center gap-4">
        {currentAvatar ? (
          <img
            src={currentAvatar}
            alt=""
            className="w-20 h-20 rounded-full object-cover border-2 border-border bg-bg-overlay shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-primary/30 shrink-0" />
        )}

        <label className="cursor-pointer px-4 py-2 text-sm rounded-lg border border-border bg-bg-overlay text-zinc-300 hover:border-primary/50 hover:text-zinc-100 transition-all">
          Change photo
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      <div className="mt-4">
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, MAX_NAME_LENGTH))}
          placeholder="Your display name"
          className="w-full rounded-lg border border-border bg-bg-overlay px-3 py-2 text-sm text-zinc-200 placeholder:text-muted focus:outline-none focus:border-primary/50"
        />
        <p className="mt-1 text-right text-xs text-muted">
          {name.length}/{MAX_NAME_LENGTH}
        </p>
      </div>

      <div className="mt-4">
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
          Username
        </label>
        <div className="flex items-center rounded-lg border border-border bg-bg-overlay focus-within:border-primary/50">
          <span className="pl-3 text-sm text-muted">@</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.slice(0, 20))}
            placeholder="username"
            className="w-full bg-transparent px-2 py-2 text-sm text-zinc-200 placeholder:text-muted focus:outline-none"
          />
        </div>
        <p className="mt-1 text-right text-xs text-muted">
          {username.length}/20
        </p>
      </div>

      <div className="mt-4">
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO_LENGTH))}
          rows={3}
          placeholder="Tell people about yourself..."
          className="w-full resize-none rounded-lg border border-border bg-bg-overlay px-3 py-2 text-sm text-zinc-200 placeholder:text-muted focus:outline-none focus:border-primary/50"
        />
        <p className="mt-1 text-right text-xs text-muted">
          {bio.length}/{MAX_BIO_LENGTH}
        </p>
      </div>
    </Modal>
  );
}
