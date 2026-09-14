import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/infrastructure/database/prisma-client", () => ({
  prisma: {
    pageComment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    pageCommentReport: {
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/application/services/notification.service", () => ({
  NotificationService: class {
    onPageCommentCreated = vi.fn().mockResolvedValue(undefined);
    onPageCommentReplied = vi.fn().mockResolvedValue(undefined);
    onContentRemoved = vi.fn().mockResolvedValue(undefined);
  },
}));

import { prisma } from "@/infrastructure/database/prisma-client";
import { PageCommentService } from "./page-comment.service";

function commentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "c1",
    body: "test comment",
    authorId: "u1",
    parentId: null,
    providerId: "mangadex",
    mangaId: "m1",
    chapterId: "ch1",
    pageIndex: 0,
    pageY: 0.5,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    author: { username: "alice", name: null, avatarUrl: null },
    replies: [],
    ...overrides,
  };
}

describe("PageCommentService.listByChapter", () => {
  let svc: PageCommentService;

  beforeEach(() => {
    vi.mocked(prisma.pageCommentReport.findMany).mockResolvedValue([]);
    svc = new PageCommentService();
  });

  it("returns comments grouped by page with replies nested", async () => {
    const root = commentRow({ id: "r1" });
    const reply = commentRow({ id: "rp1", parentId: "r1" });
    vi.mocked(prisma.pageComment.findMany).mockResolvedValue([
      { ...root, replies: [reply] },
    ] as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "user" } as never);

    const result = await svc.listByChapter("mangadex", "m1", "ch1", "u1");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("r1");
    expect(result[0].replies).toHaveLength(1);
    expect(result[0].replies[0].id).toBe("rp1");
  });

  it("marks canDelete true for the author", async () => {
    vi.mocked(prisma.pageComment.findMany).mockResolvedValue([
      commentRow({ authorId: "u1" }),
    ] as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "user" } as never);

    const result = await svc.listByChapter("mangadex", "m1", "ch1", "u1");
    expect(result[0].canDelete).toBe(true);
    expect(result[0].isOwn).toBe(true);
    expect(result[0].reported).toBe(false);
  });

  it("marks canDelete true for admin even if not author", async () => {
    vi.mocked(prisma.pageComment.findMany).mockResolvedValue([
      commentRow({ authorId: "u-other" }),
    ] as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "admin" } as never);

    const result = await svc.listByChapter("mangadex", "m1", "ch1", "u-admin");
    expect(result[0].canDelete).toBe(true);
  });

  it("marks reported true for comments the viewer reported, on top-level and replies", async () => {
    const root = commentRow({ id: "r1", authorId: "u-other" });
    const reply = commentRow({ id: "rp1", parentId: "r1", authorId: "u-other" });
    vi.mocked(prisma.pageComment.findMany).mockResolvedValue([
      { ...root, replies: [reply] },
    ] as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "user" } as never);
    vi.mocked(prisma.pageCommentReport.findMany).mockResolvedValue([
      { commentId: "rp1" },
    ] as never);

    const result = await svc.listByChapter("mangadex", "m1", "ch1", "u1");

    expect(result[0].reported).toBe(false);
    expect(result[0].replies[0].reported).toBe(true);
  });

  it("keeps reported false when the viewer reported nothing", async () => {
    vi.mocked(prisma.pageComment.findMany).mockResolvedValue([
      commentRow({ authorId: "u-other" }),
    ] as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "user" } as never);
    vi.mocked(prisma.pageCommentReport.findMany).mockResolvedValue([] as never);

    const result = await svc.listByChapter("mangadex", "m1", "ch1", "u1");
    expect(result[0].reported).toBe(false);
    expect(result[0].isOwn).toBe(false);
  });
});

describe("PageCommentService.create", () => {
  let svc: PageCommentService;

  beforeEach(() => {
    vi.clearAllMocks();
    svc = new PageCommentService();
  });

  it("creates a comment and returns it", async () => {
    vi.mocked(prisma.pageComment.create).mockResolvedValue(commentRow() as never);

    const result = await svc.create("mangadex", "m1", "ch1", 0, 0.5, "hello!", "u1");

    const createCall = vi.mocked(prisma.pageComment.create).mock.calls[0][0];
    expect(createCall.data.body).toBe("hello!");
    expect(createCall.data.pageIndex).toBe(0);
    expect(createCall.data.pageY).toBe(0.5);
    expect(createCall.data.providerId).toBe("mangadex");
    expect(createCall.data.mangaId).toBe("m1");
    expect(createCall.data.chapterId).toBe("ch1");
    expect(createCall.data.authorId).toBe("u1");
    expect(result.id).toBe("c1");
    expect(result.canDelete).toBe(true);
    expect(result.isOwn).toBe(true);
    expect(result.reported).toBe(false);
  });

  it("fires page comment notification on create", async () => {
    vi.mocked(prisma.pageComment.create).mockResolvedValue(commentRow() as never);

    await svc.create("mangadex", "m1", "ch1", 0, 0.5, "hello!", "u1");

    expect(vi.mocked(svc["notificationService"].onPageCommentCreated)).toHaveBeenCalledWith(
      "mangadex", "m1", "ch1", "u1", "c1"
    );
  });

  it("throws on empty body", async () => {
    await expect(
      svc.create("mangadex", "m1", "ch1", 0, 0.5, "  ", "u1")
    ).rejects.toThrow("Comment is empty");
  });

  it("throws on body over 1000 chars", async () => {
    await expect(
      svc.create("mangadex", "m1", "ch1", 0, 0.5, "x".repeat(1001), "u1")
    ).rejects.toThrow("Comment too long");
  });

  it("flattens reply depth to max 2 levels", async () => {
    vi.mocked(prisma.pageComment.findUnique).mockResolvedValue(
      commentRow({ id: "root", parentId: null }) as never
    );
    vi.mocked(prisma.pageComment.create).mockResolvedValue(
      commentRow({ id: "new-reply", parentId: "root" }) as never
    );

    await svc.create("mangadex", "m1", "ch1", 0, 0.5, "reply", "u2", "root");

    const createCall = vi.mocked(prisma.pageComment.create).mock.calls[0][0];
    expect(createCall.data.parentId).toBe("root");
  });

  it("normalizes nested reply parentId to top-level root", async () => {
    vi.mocked(prisma.pageComment.findUnique).mockResolvedValue(
      commentRow({ id: "child", parentId: "root" }) as never
    );
    vi.mocked(prisma.pageComment.create).mockResolvedValue(
      commentRow({ id: "new-reply", parentId: "root" }) as never
    );

    await svc.create("mangadex", "m1", "ch1", 0, 0.5, "reply", "u2", "child");

    const createCall = vi.mocked(prisma.pageComment.create).mock.calls[0][0];
    expect(createCall.data.parentId).toBe("root");
  });
});

describe("PageCommentService.delete", () => {
  let svc: PageCommentService;

  beforeEach(() => {
    vi.clearAllMocks();
    svc = new PageCommentService();
  });

  it("allows the author to delete their own comment", async () => {
    vi.mocked(prisma.pageComment.findUnique).mockResolvedValue(
      commentRow({ authorId: "u1" }) as never
    );
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "user" } as never);
    vi.mocked(prisma.pageComment.delete).mockResolvedValue({} as never);

    await svc.delete("c1", "u1");
    expect(prisma.pageComment.delete).toHaveBeenCalledWith({ where: { id: "c1" } });
  });

  it("allows admin to delete any comment", async () => {
    vi.mocked(prisma.pageComment.findUnique).mockResolvedValue(
      commentRow({ authorId: "u-other" }) as never
    );
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "admin" } as never);
    vi.mocked(prisma.pageComment.delete).mockResolvedValue({} as never);

    await svc.delete("c1", "u-admin");
    expect(prisma.pageComment.delete).toHaveBeenCalledOnce();
  });

  it("throws ForbiddenError for non-author non-admin", async () => {
    vi.mocked(prisma.pageComment.findUnique).mockResolvedValue(
      commentRow({ authorId: "u-other" }) as never
    );
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "user" } as never);

    await expect(svc.delete("c1", "u-random")).rejects.toThrow("Forbidden");
  });
});

describe("PageCommentService.report", () => {
  let svc: PageCommentService;

  beforeEach(() => {
    vi.clearAllMocks();
    svc = new PageCommentService();
  });

  it("upserts a report with the given reason", async () => {
    vi.mocked(prisma.pageComment.findUnique).mockResolvedValue(
      commentRow({ authorId: "u-other" }) as never
    );

    await svc.report("c1", "u-reporter", "spam");

    expect(prisma.pageCommentReport.upsert).toHaveBeenCalledWith({
      where: { commentId_reporterId: { commentId: "c1", reporterId: "u-reporter" } },
      create: { commentId: "c1", reporterId: "u-reporter", reason: "spam" },
      update: { reason: "spam" },
    });
  });

  it("throws when the comment does not exist", async () => {
    vi.mocked(prisma.pageComment.findUnique).mockResolvedValue(null as never);

    await expect(svc.report("c1", "u-reporter")).rejects.toThrow("Comment not found");
    expect(prisma.pageCommentReport.upsert).not.toHaveBeenCalled();
  });

  it("throws when reporting your own comment", async () => {
    vi.mocked(prisma.pageComment.findUnique).mockResolvedValue(
      commentRow({ authorId: "u-reporter" }) as never
    );

    await expect(svc.report("c1", "u-reporter")).rejects.toThrow("Cannot report your own comment");
    expect(prisma.pageCommentReport.upsert).not.toHaveBeenCalled();
  });
});
