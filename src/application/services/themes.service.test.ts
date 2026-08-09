import { beforeEach, describe, expect, it, vi } from "vitest";

const { tx, prisma } = vi.hoisted(() => ({
  tx: {
    user: { updateMany: vi.fn() },
    purchasedTheme: { create: vi.fn() },
  },
  prisma: {
    $transaction: vi.fn(),
    user: { findUnique: vi.fn() },
    purchasedTheme: { findMany: vi.fn(), findUnique: vi.fn() },
    userSettings: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}));

vi.mock("@/infrastructure/database/prisma-client", () => ({ prisma }));

import {
  InsufficientCoinsError,
  ThemeNotFoundError,
  ThemeNotOwnedError,
  ThemesService,
} from "./themes.service";
import { DEFAULT_THEME_ID } from "@/domain/constants/profile-themes";

beforeEach(() => {
  vi.clearAllMocks();
  prisma.$transaction.mockImplementation(async (cb: (t: typeof tx) => unknown) => cb(tx));
});

describe("ThemesService.getState", () => {
  it("always includes the default theme and resolves the active theme id", async () => {
    prisma.user.findUnique.mockResolvedValue({ coins: 10 });
    prisma.purchasedTheme.findMany.mockResolvedValue([{ themeId: "sunset" }]);
    prisma.userSettings.findUnique.mockResolvedValue({ profileThemeId: "sunset" });

    const state = await new ThemesService().getState("u1");

    expect(state.ownedThemeIds).toEqual(expect.arrayContaining([DEFAULT_THEME_ID, "sunset"]));
    expect(state.activeThemeId).toBe("sunset");
    expect(state.coins).toBe(10);
  });

  it("defaults the active theme to null when no settings row exists", async () => {
    prisma.user.findUnique.mockResolvedValue({ coins: 0 });
    prisma.purchasedTheme.findMany.mockResolvedValue([]);
    prisma.userSettings.findUnique.mockResolvedValue(null);

    const state = await new ThemesService().getState("u1");

    expect(state.activeThemeId).toBeNull();
  });
});

describe("ThemesService.purchase", () => {
  it("decrements coins atomically and records ownership", async () => {
    prisma.purchasedTheme.findUnique.mockResolvedValue(null);
    tx.user.updateMany.mockResolvedValue({ count: 1 });
    prisma.user.findUnique.mockResolvedValue({ coins: 5 });
    prisma.purchasedTheme.findMany.mockResolvedValue([{ themeId: "sunset" }]);
    prisma.userSettings.findUnique.mockResolvedValue(null);

    const state = await new ThemesService().purchase("u1", "sunset");

    expect(tx.user.updateMany).toHaveBeenCalledWith({
      where: { id: "u1", coins: { gte: 25 } },
      data: { coins: { decrement: 25 } },
    });
    expect(tx.purchasedTheme.create).toHaveBeenCalledWith({
      data: { userId: "u1", themeId: "sunset" },
    });
    expect(state.coins).toBe(5);
  });

  it("throws when the user cannot afford the theme", async () => {
    prisma.purchasedTheme.findUnique.mockResolvedValue(null);
    tx.user.updateMany.mockResolvedValue({ count: 0 });

    await expect(new ThemesService().purchase("u1", "sunset")).rejects.toBeInstanceOf(
      InsufficientCoinsError
    );
    expect(tx.purchasedTheme.create).not.toHaveBeenCalled();
  });

  it("is idempotent for an already-owned theme", async () => {
    prisma.purchasedTheme.findUnique.mockResolvedValue({ id: "x" });
    prisma.user.findUnique.mockResolvedValue({ coins: 5 });
    prisma.purchasedTheme.findMany.mockResolvedValue([{ themeId: "sunset" }]);
    prisma.userSettings.findUnique.mockResolvedValue(null);

    const state = await new ThemesService().purchase("u1", "sunset");

    expect(tx.user.updateMany).not.toHaveBeenCalled();
    expect(state.coins).toBe(5);
  });

  it("throws for an unknown theme id", async () => {
    await expect(new ThemesService().purchase("u1", "nope")).rejects.toBeInstanceOf(
      ThemeNotFoundError
    );
  });

  it("treats a concurrent duplicate purchase as idempotent instead of crashing", async () => {
    prisma.purchasedTheme.findUnique.mockResolvedValue(null);
    const p2002 = Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
    tx.user.updateMany.mockResolvedValue({ count: 1 });
    tx.purchasedTheme.create.mockRejectedValue(p2002);
    prisma.user.findUnique.mockResolvedValue({ coins: 5 });
    prisma.purchasedTheme.findMany.mockResolvedValue([{ themeId: "sunset" }]);
    prisma.userSettings.findUnique.mockResolvedValue(null);

    const state = await new ThemesService().purchase("u1", "sunset");

    expect(tx.purchasedTheme.create).toHaveBeenCalled();
    expect(state.coins).toBe(5);
  });
});

describe("ThemesService.apply", () => {
  it("throws when the user does not own the theme", async () => {
    prisma.purchasedTheme.findUnique.mockResolvedValue(null);

    await expect(new ThemesService().apply("u1", "sunset")).rejects.toBeInstanceOf(
      ThemeNotOwnedError
    );
  });

  it("sets the active theme when owned", async () => {
    prisma.purchasedTheme.findUnique.mockResolvedValue({ id: "x" });
    prisma.user.findUnique.mockResolvedValue({ coins: 5 });
    prisma.purchasedTheme.findMany.mockResolvedValue([{ themeId: "sunset" }]);
    prisma.userSettings.findUnique.mockResolvedValue({ profileThemeId: "sunset" });

    await new ThemesService().apply("u1", "sunset");

    expect(prisma.userSettings.upsert).toHaveBeenCalledWith({
      where: { userId: "u1" },
      create: { userId: "u1", profileThemeId: "sunset" },
      update: { profileThemeId: "sunset" },
    });
  });

  it("allows applying the default theme without a purchase", async () => {
    prisma.user.findUnique.mockResolvedValue({ coins: 0 });
    prisma.purchasedTheme.findMany.mockResolvedValue([]);
    prisma.userSettings.findUnique.mockResolvedValue({ profileThemeId: DEFAULT_THEME_ID });

    await new ThemesService().apply("u1", DEFAULT_THEME_ID);

    expect(prisma.userSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { profileThemeId: DEFAULT_THEME_ID } })
    );
  });
});
