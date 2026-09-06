-- CreateTable
CREATE TABLE "provider_cache" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "provider_cache_providerId_cacheKey_key" ON "provider_cache"("providerId", "cacheKey");

-- CreateIndex
CREATE INDEX "provider_cache_expiresAt_idx" ON "provider_cache"("expiresAt");
