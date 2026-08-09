-- AlterTable
ALTER TABLE "ReadChapter" ADD COLUMN     "rewardedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "coins" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "profileThemeId" TEXT;

-- CreateTable
CREATE TABLE "PurchasedTheme" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchasedTheme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PurchasedTheme_userId_idx" ON "PurchasedTheme"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchasedTheme_userId_themeId_key" ON "PurchasedTheme"("userId", "themeId");

-- AddForeignKey
ALTER TABLE "PurchasedTheme" ADD CONSTRAINT "PurchasedTheme_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

