import { beforeEach, describe, expect, it, vi } from "vitest";

const { tx, prisma } = vi.hoisted(() => ({
  tx: {
    readChapter: { updateMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    user: { update: vi.fn() },
  },
  prisma: {
    $transaction: vi.fn(),
  },
}));

vi.mock("@/infrastructure/database/prisma-client", () => ({ prisma }));

import { RewardService } from "./reward.service";

beforeEach(() => {
  vi.clearAllMocks();
  prisma.$transaction.mockImplementation(async (cb: (t: typeof tx) => unknown) => cb(tx));
});

const row = (rewardedAt: Date | null) => ({ rewardedAt });

describe("RewardService.awardChapterCompletion", () => {
  it("creates the read row and awards a coin when the row is missing (race case)", async () => {
    tx.readChapter.updateMany.mockResolvedValue({ count: 0 });
    tx.readChapter.findUnique.mockResolvedValue(null);
    tx.readChapter.create.mockResolvedValue({});
    tx.user.update.mockResolvedValue({ coins: 5 });

    const res = await new RewardService().awardChapterCompletion("u1", "p1", "m1", "c1");

    expect(tx.readChapter.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "u1", providerId: "p1", mangaId: "m1", chapterId: "c1", rewardedAt: expect.any(Date) }),
      })
    );
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { coins: { increment: 1 } },
      select: { coins: true },
    });
    expect(res).toEqual({ rewarded: true, balance: 5 });
  });

  it("awards a coin when the chapter has not been rewarded yet", async () => {
    tx.readChapter.updateMany.mockResolvedValue({ count: 1 });
    tx.user.update.mockResolvedValue({ coins: 5 });

    const res = await new RewardService().awardChapterCompletion("u1", "p1", "m1", "c1");

    expect(tx.readChapter.updateMany).toHaveBeenCalledWith({
      where: { userId: "u1", providerId: "p1", mangaId: "m1", chapterId: "c1", rewardedAt: null },
      data: { rewardedAt: expect.any(Date) },
    });
    expect(tx.user.update).not.toHaveBeenCalledTimes(2);
    expect(res).toEqual({ rewarded: true, balance: 5 });
  });

  it("reports alreadyRewarded when the row exists with a reward timestamp", async () => {
    tx.readChapter.updateMany.mockResolvedValue({ count: 0 });
    tx.readChapter.findUnique.mockResolvedValue(row(new Date("2026-09-01")));

    const res = await new RewardService().awardChapterCompletion("u1", "p1", "m1", "c1");

    expect(tx.readChapter.create).not.toHaveBeenCalled();
    expect(tx.user.update).not.toHaveBeenCalled();
    expect(res).toEqual({ rewarded: false, alreadyRewarded: true });
  });

  it("does not double-reward a second call for the same chapter", async () => {
    tx.readChapter.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    tx.readChapter.findUnique.mockResolvedValue(row(new Date("2026-09-01")));
    tx.user.update.mockResolvedValue({ coins: 1 });

    const first = await new RewardService().awardChapterCompletion("u1", "p1", "m1", "c1");
    const second = await new RewardService().awardChapterCompletion("u1", "p1", "m1", "c1");

    expect(first).toEqual({ rewarded: true, balance: 1 });
    expect(second).toEqual({ rewarded: false, alreadyRewarded: true });
    expect(tx.user.update).toHaveBeenCalledTimes(1);
  });

  it("rewards different users independently", async () => {
    tx.readChapter.updateMany.mockResolvedValue({ count: 1 });
    tx.user.update.mockResolvedValueOnce({ coins: 1 }).mockResolvedValueOnce({ coins: 3 });

    const alice = await new RewardService().awardChapterCompletion("u1", "p1", "m1", "c1");
    const bob = await new RewardService().awardChapterCompletion("u2", "p1", "m1", "c1");

    expect(alice).toEqual({ rewarded: true, balance: 1 });
    expect(bob).toEqual({ rewarded: true, balance: 3 });
    expect(tx.user.update).toHaveBeenNthCalledWith(1, expect.objectContaining({ where: { id: "u1" } }));
    expect(tx.user.update).toHaveBeenNthCalledWith(2, expect.objectContaining({ where: { id: "u2" } }));
  });

  it("rewards different chapters independently", async () => {
    tx.readChapter.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 });
    tx.user.update.mockResolvedValueOnce({ coins: 1 }).mockResolvedValueOnce({ coins: 2 });

    const first = await new RewardService().awardChapterCompletion("u1", "p1", "m1", "c1");
    const second = await new RewardService().awardChapterCompletion("u1", "p1", "m1", "c2");

    expect(first).toEqual({ rewarded: true, balance: 1 });
    expect(second).toEqual({ rewarded: true, balance: 2 });
    expect(tx.readChapter.updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { userId: "u1", providerId: "p1", mangaId: "m1", chapterId: "c2", rewardedAt: null },
      })
    );
  });
});