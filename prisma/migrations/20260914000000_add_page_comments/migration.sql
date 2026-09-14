-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "pageCommentId" TEXT;

-- CreateTable
CREATE TABLE "PageComment" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "parentId" TEXT,
    "providerId" TEXT NOT NULL,
    "mangaId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "pageIndex" INTEGER NOT NULL,
    "pageY" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageCommentReport" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageCommentReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageComment_providerId_mangaId_chapterId_pageIndex_idx" ON "PageComment"("providerId", "mangaId", "chapterId", "pageIndex");

-- CreateIndex
CREATE INDEX "PageComment_parentId_idx" ON "PageComment"("parentId");

-- CreateIndex
CREATE INDEX "PageCommentReport_createdAt_idx" ON "PageCommentReport"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PageCommentReport_commentId_reporterId_key" ON "PageCommentReport"("commentId", "reporterId");

-- AddForeignKey
ALTER TABLE "PageComment" ADD CONSTRAINT "PageComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageComment" ADD CONSTRAINT "PageComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PageComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageCommentReport" ADD CONSTRAINT "PageCommentReport_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "PageComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageCommentReport" ADD CONSTRAINT "PageCommentReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_pageCommentId_fkey" FOREIGN KEY ("pageCommentId") REFERENCES "PageComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;