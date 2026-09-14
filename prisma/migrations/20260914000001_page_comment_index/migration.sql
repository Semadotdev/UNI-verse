-- DropIndex
DROP INDEX "PageComment_providerId_mangaId_chapterId_pageIndex_idx";

-- CreateIndex
CREATE INDEX "PageComment_providerId_mangaId_chapterId_pageIndex_createdA_idx" ON "PageComment"("providerId", "mangaId", "chapterId", "pageIndex", "createdAt");
