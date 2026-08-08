import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/infrastructure/database/prisma-client", () => ({
  prisma: {
    post: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    like: { findUnique: vi.fn(), findMany: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn(), groupBy: vi.fn() },
    user: { findUnique: vi.fn() },
    folder: { findUnique: vi.fn(), findFirst: vi.fn() },
    friend: { findMany: vi.fn() },
    library: { findMany: vi.fn() },
    notification: { findFirst: vi.fn(), create: vi.fn() },
  },
}));

vi.mock("@/application/services/notification.service", () => ({
  NotificationService: class {
    onPostCommented = vi.fn().mockResolvedValue(undefined);
    onPostReacted = vi.fn().mockResolvedValue(undefined);
    onCommentReplied = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock("@/application/services/upload.service", () => ({
  UploadService: class {
    deleteImages = vi.fn().mockResolvedValue(undefined);
  },
}));

import { prisma } from "@/infrastructure/database/prisma-client";
import { PostService } from "./post.service";

const ADULT = new Date("2000-01-01");
const MINOR = new Date("2010-01-01");

function postRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "p1",
    body: "hello world",
    authorId: "u1",
    folderId: null,
    nsfw: false,
    nsfwExplicit: false,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    author: { username: "alice", name: null, avatarUrl: null },
    images: [],
    folder: null,
    _count: { comments: 0, likes: 0 },
    ...overrides,
  };
}

const folderRow = (id: string, userId = "u1") => ({
  id,
  userId,
  name: "Folder",
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe("PostService.create", () => {
  let svc: PostService;

  beforeEach(() => {
    svc = new PostService();
    vi.mocked(prisma.folder.findFirst).mockResolvedValue(folderRow("f1") as never);
    vi.mocked(prisma.folder.findUnique).mockResolvedValue({ id: "f1", items: [] } as never);
  });

  it("auto-tags nsfw when the attached folder contains nsfw books", async () => {
    vi.mocked(prisma.folder.findUnique).mockResolvedValue({
      id: "f1",
      items: [{ categories: ["Ecchi", "Drama"] }],
    } as never);
    vi.mocked(prisma.post.create).mockResolvedValue(
      postRow({ nsfw: true, nsfwExplicit: false }) as never
    );

    const post = await svc.create("u1", { body: "hello", folderId: "f1" });

    expect(prisma.post.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ nsfw: true, nsfwExplicit: false }),
      })
    );
    expect(post.nsfw).toBe(true);
  });

  it("stores an explicit nsfw tag when the folder is clean", async () => {
    vi.mocked(prisma.folder.findUnique).mockResolvedValue({
      id: "f1",
      items: [{ categories: ["Action"] }],
    } as never);
    vi.mocked(prisma.post.create).mockResolvedValue(
      postRow({ nsfw: true, nsfwExplicit: true }) as never
    );

    const post = await svc.create("u1", { body: "hello", folderId: "f1", nsfw: true });

    expect(prisma.post.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ nsfw: true, nsfwExplicit: true }),
      })
    );
    expect(post.nsfw).toBe(true);
  });

  it("does not tag when folder is clean and nsfw not provided", async () => {
    vi.mocked(prisma.folder.findUnique).mockResolvedValue({
      id: "f1",
      items: [{ categories: ["Action"] }],
    } as never);
    vi.mocked(prisma.post.create).mockResolvedValue(postRow({ nsfw: false, nsfwExplicit: false }) as never);

    const post = await svc.create("u1", { body: "hello", folderId: "f1" });

    expect(prisma.post.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ nsfw: false, nsfwExplicit: false }),
      })
    );
    expect(post.nsfw).toBe(false);
  });
});

describe("PostService.update", () => {
  let svc: PostService;

  beforeEach(() => {
    svc = new PostService();
    vi.mocked(prisma.folder.findFirst).mockResolvedValue(folderRow("f2") as never);
    vi.mocked(prisma.like.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.like.groupBy).mockResolvedValue([] as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", role: "user", birthDate: ADULT } as never);
  });

  it("un-tags when the folder becomes clean and the tag was never explicit", async () => {
    vi.mocked(prisma.post.findUnique)
      .mockResolvedValueOnce(postRow({ id: "p1", folderId: "f1", nsfw: true, nsfwExplicit: false }) as never)
      .mockResolvedValueOnce(postRow({ id: "p1", folderId: "f2", nsfw: false, nsfwExplicit: false }) as never);
    vi.mocked(prisma.folder.findUnique).mockResolvedValue({
      id: "f2",
      items: [{ categories: ["Action"] }],
    } as never);
    vi.mocked(prisma.post.update).mockResolvedValue(
      postRow({ id: "p1", folderId: "f2", nsfw: false, nsfwExplicit: false }) as never
    );

    const post = await svc.update("p1", "u1", { body: "hello", folderId: "f2" });

    expect(prisma.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ nsfw: false, nsfwExplicit: false }),
      })
    );
    expect(post.nsfw).toBe(false);
  });

  it("keeps an explicit tag when the folder becomes clean", async () => {
    vi.mocked(prisma.post.findUnique)
      .mockResolvedValueOnce(postRow({ id: "p1", folderId: "f1", nsfw: true, nsfwExplicit: true }) as never)
      .mockResolvedValueOnce(postRow({ id: "p1", folderId: "f2", nsfw: true, nsfwExplicit: true }) as never);
    vi.mocked(prisma.folder.findUnique).mockResolvedValue({
      id: "f2",
      items: [{ categories: ["Action"] }],
    } as never);
    vi.mocked(prisma.post.update).mockResolvedValue(
      postRow({ id: "p1", folderId: "f2", nsfw: true, nsfwExplicit: true }) as never
    );

    const post = await svc.update("p1", "u1", { body: "hello", folderId: "f2" });

    expect(post.nsfw).toBe(true);
  });

  it("honors an explicit nsfw toggle sent by the client", async () => {
    vi.mocked(prisma.post.findUnique)
      .mockResolvedValueOnce(postRow({ id: "p1", folderId: null, nsfw: false, nsfwExplicit: false }) as never)
      .mockResolvedValueOnce(postRow({ id: "p1", folderId: null, nsfw: true, nsfwExplicit: true }) as never);
    vi.mocked(prisma.post.update).mockResolvedValue(
      postRow({ id: "p1", folderId: null, nsfw: true, nsfwExplicit: true }) as never
    );

    const post = await svc.update("p1", "u1", { body: "hello", nsfw: true });

    expect(prisma.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ nsfw: true, nsfwExplicit: true }),
      })
    );
    expect(post.nsfw).toBe(true);
  });

  it("does not error when the author has a null birthDate and updates an nsfw post", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", role: "user", birthDate: null } as never);
    vi.mocked(prisma.post.findUnique)
      .mockResolvedValueOnce(postRow({ id: "p1", folderId: "f1", nsfw: true, nsfwExplicit: false }) as never)
      .mockResolvedValueOnce(postRow({ id: "p1", folderId: "f1", nsfw: true, nsfwExplicit: false }) as never);
    vi.mocked(prisma.folder.findUnique).mockResolvedValue({
      id: "f1",
      items: [{ categories: ["Ecchi"] }],
    } as never);
    vi.mocked(prisma.post.update).mockResolvedValue(
      postRow({ id: "p1", folderId: "f1", nsfw: true, nsfwExplicit: false }) as never
    );

    const post = await svc.update("p1", "u1", { body: "hello", folderId: "f1" });

    expect(post.nsfw).toBe(true);
  });
});

describe("PostService.get age gate", () => {
  let svc: PostService;

  beforeEach(() => {
    svc = new PostService();
    vi.mocked(prisma.like.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.like.groupBy).mockResolvedValue([] as never);
  });

  it("returns null for a minor viewing an nsfw post", async () => {
    vi.mocked(prisma.post.findUnique).mockResolvedValue(postRow({ nsfw: true }) as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u2", role: "user", birthDate: MINOR } as never);

    const post = await svc.get("p1", "u2");
    expect(post).toBeNull();
  });

  it("returns an nsfw post for an adult viewer", async () => {
    vi.mocked(prisma.post.findUnique).mockResolvedValue(postRow({ nsfw: true }) as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", role: "user", birthDate: ADULT } as never);

    const post = await svc.get("p1", "u1");
    expect(post).not.toBeNull();
    expect(post!.nsfw).toBe(true);
  });

  it("returns a non-nsfw post for a minor", async () => {
    vi.mocked(prisma.post.findUnique).mockResolvedValue(postRow({ nsfw: false }) as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u2", role: "user", birthDate: MINOR } as never);

    const post = await svc.get("p1", "u2");
    expect(post).not.toBeNull();
  });
});

describe("PostService.listFeed", () => {
  let svc: PostService;

  beforeEach(() => {
    svc = new PostService();
    vi.clearAllMocks();
    vi.mocked(prisma.post.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.post.count).mockResolvedValue(0);
    vi.mocked(prisma.like.findMany).mockResolvedValue([] as never);
  });

  it("adds nsfw:false for minors on the default feed", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", role: "user", birthDate: MINOR } as never);

    await svc.listFeed("u1", 1, 10);

    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ nsfw: false }) })
    );
  });

  it("does not add nsfw filtering for adults on the default feed", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", role: "user", birthDate: ADULT } as never);

    await svc.listFeed("u1", 1, 10);

    const call = vi.mocked(prisma.post.findMany).mock.calls[0][0] as { where: Record<string, unknown> };
    expect(call.where).not.toHaveProperty("nsfw");
  });

  it("filters to confirmed friends on the friends feed", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", role: "user", birthDate: ADULT } as never);
    vi.mocked(prisma.friend.findMany).mockResolvedValue([
      { userId: "u1", friendId: "u2" },
      { userId: "u3", friendId: "u1" },
    ] as never);

    await svc.listFeed("u1", 1, 10, { feed: "friends" });

    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ authorId: { in: ["u2", "u3"] } }) })
    );
  });

  it("returns empty for a minor requesting the nsfw feed", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", role: "user", birthDate: MINOR } as never);

    const res = await svc.listFeed("u1", 1, 10, { feed: "nsfw" });

    expect(res.data).toEqual([]);
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: { in: [] } }) })
    );
  });
});

describe("PostService.react", () => {
  let svc: PostService;

  beforeEach(() => {
    svc = new PostService();
    vi.clearAllMocks();
    vi.mocked(prisma.post.findUnique).mockResolvedValue({ id: "p1", authorId: "u2" } as never);
  });

  it("upserts the reaction type and notifies the author", async () => {
    vi.mocked(prisma.like.upsert).mockResolvedValue({} as never);

    await svc.react("p1", "u1", "love");

    expect(prisma.like.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ type: "love" }) })
    );
  });

  it("updates an existing reaction type in place", async () => {
    vi.mocked(prisma.like.upsert).mockResolvedValue({} as never);

    await svc.react("p1", "u1", "like");
    await svc.react("p1", "u1", "angry");

    const last = vi.mocked(prisma.like.upsert).mock.calls.at(-1)![0] as { update: { type: string } };
    expect(last.update.type).toBe("angry");
    expect(prisma.like.deleteMany).not.toHaveBeenCalled();
  });
});

describe("PostService.get reactions", () => {
  let svc: PostService;

  beforeEach(() => {
    svc = new PostService();
    vi.clearAllMocks();
    vi.mocked(prisma.like.findUnique).mockResolvedValue({ type: "love" } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", role: "user", birthDate: ADULT } as never);
  });

  it("maps my reaction and per-type counts into the post", async () => {
    vi.mocked(prisma.post.findUnique).mockResolvedValue(
      postRow({ nsfw: false, _count: { comments: 1, likes: 5 } }) as never
    );
    vi.mocked(prisma.like.groupBy).mockResolvedValue([
      { postId: "p1", type: "love", _count: { _all: 3 } },
      { postId: "p1", type: "like", _count: { _all: 2 } },
    ] as never);

    const post = await svc.get("p1", "u1");

    expect(post!.myReaction).toBe("love");
    expect(post!.reactionCount).toBe(5);
    expect(post!.reactions).toEqual([
      { type: "like", count: 2 },
      { type: "love", count: 3 },
    ]);
  });
});
