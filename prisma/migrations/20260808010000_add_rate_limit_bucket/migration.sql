-- CreateTable
CREATE TABLE "rate_limit_bucket" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "reset_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_bucket_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "rate_limit_bucket_reset_at_idx" ON "rate_limit_bucket"("reset_at");
