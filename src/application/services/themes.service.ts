import { prisma } from '@/infrastructure/database/prisma-client';
import {
  getProfileTheme,
  isDefaultTheme,
  PROFILE_THEMES,
  DEFAULT_THEME_ID,
} from '@/domain/constants/profile-themes';

export class ThemeNotFoundError extends Error {}
export class InsufficientCoinsError extends Error {}
export class ThemeNotOwnedError extends Error {}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export class ThemesService {
  async getState(userId: string) {
    const [user, purchased, settings] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { coins: true } }),
      prisma.purchasedTheme.findMany({ where: { userId }, select: { themeId: true } }),
      prisma.userSettings.findUnique({ where: { userId }, select: { profileThemeId: true } }),
    ]);

    const ownedThemeIds = new Set(purchased.map((p) => p.themeId));
    ownedThemeIds.add(DEFAULT_THEME_ID);

    return {
      themes: PROFILE_THEMES,
      ownedThemeIds: Array.from(ownedThemeIds),
      activeThemeId: settings?.profileThemeId ?? null,
      coins: user?.coins ?? 0,
    };
  }

  async purchase(userId: string, themeId: string) {
    const theme = getProfileTheme(themeId);
    if (!theme) throw new ThemeNotFoundError(`Unknown theme: ${themeId}`);

    if (theme.price === 0) return this.getState(userId);

    const alreadyOwned = await prisma.purchasedTheme.findUnique({
      where: { userId_themeId: { userId, themeId } },
    });
    if (alreadyOwned) return this.getState(userId);

    try {
      await prisma.$transaction(async (tx) => {
        const updated = await tx.user.updateMany({
          where: { id: userId, coins: { gte: theme.price } },
          data: { coins: { decrement: theme.price } },
        });
        if (updated.count === 0) throw new InsufficientCoinsError('Not enough coins');
        await tx.purchasedTheme.create({ data: { userId, themeId } });
      });
    } catch (error) {
      if (isUniqueViolation(error)) return this.getState(userId);
      throw error;
    }

    return this.getState(userId);
  }

  async apply(userId: string, themeId: string) {
    const theme = getProfileTheme(themeId);
    if (!theme) throw new ThemeNotFoundError(`Unknown theme: ${themeId}`);

    if (!(await this.isOwned(userId, themeId))) {
      throw new ThemeNotOwnedError('You do not own this theme');
    }

    await prisma.userSettings.upsert({
      where: { userId },
      create: { userId, profileThemeId: themeId },
      update: { profileThemeId: themeId },
    });

    return this.getState(userId);
  }

  private async isOwned(userId: string, themeId: string): Promise<boolean> {
    if (isDefaultTheme(themeId)) return true;
    const row = await prisma.purchasedTheme.findUnique({
      where: { userId_themeId: { userId, themeId } },
      select: { id: true },
    });
    return Boolean(row);
  }
}
