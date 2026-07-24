-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Library" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mangaId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "cover" TEXT,
    "status" TEXT,
    "categories" TEXT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Library_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReadingHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mangaId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "chapterNum" REAL,
    "readAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" REAL,
    CONSTRAINT "ReadingHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mangaId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "number" REAL,
    "title" TEXT,
    "pages" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "readerMode" TEXT NOT NULL DEFAULT 'page',
    "readingDir" TEXT NOT NULL DEFAULT 'rtl',
    "bgColor" TEXT NOT NULL DEFAULT '#ffffff',
    "brightness" REAL NOT NULL DEFAULT 1.0,
    "enabledSources" TEXT NOT NULL,
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Library_userId_mangaId_sourceId_key" ON "Library"("userId", "mangaId", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingHistory_userId_mangaId_chapterId_key" ON "ReadingHistory"("userId", "mangaId", "chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_mangaId_sourceId_chapterId_key" ON "Chapter"("mangaId", "sourceId", "chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");
