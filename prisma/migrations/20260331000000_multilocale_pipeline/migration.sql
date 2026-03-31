-- ============================================================
-- Migration: Multi-Locale Pipeline System
-- Non-destructive: adds tables/columns, no data deleted
-- ============================================================

-- 1. Create articles table
CREATE TABLE "articles" (
    "id" SERIAL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Advertising',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- 2. Create locale_configs table
CREATE TABLE "locale_configs" (
    "id" SERIAL PRIMARY KEY,
    "locale" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "url_prefix" TEXT NOT NULL DEFAULT '',
    "default_countries" TEXT NOT NULL DEFAULT 'us',
    "language_code" TEXT NOT NULL DEFAULT 'en',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "locale_configs_locale_key" ON "locale_configs"("locale");

-- 3. Create cron_runs table
CREATE TABLE "cron_runs" (
    "id" SERIAL PRIMARY KEY,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "api_calls" INTEGER NOT NULL DEFAULT 0,
    "estimated_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "keywords_processed" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'running',
    "log" TEXT
);
CREATE INDEX "cron_runs_started_at_idx" ON "cron_runs"("started_at");

-- 4. Add new columns to tracked_urls
ALTER TABLE "tracked_urls" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "tracked_urls" ADD COLUMN "tracking_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "tracked_urls" ADD COLUMN "stage" TEXT NOT NULL DEFAULT 'monitoring';
ALTER TABLE "tracked_urls" ADD COLUMN "review_started_at" TIMESTAMP(3);
ALTER TABLE "tracked_urls" ADD COLUMN "review_days" INTEGER NOT NULL DEFAULT 21;
ALTER TABLE "tracked_urls" ADD COLUMN "article_id" INTEGER;

CREATE INDEX "tracked_urls_locale_idx" ON "tracked_urls"("locale");
CREATE INDEX "tracked_urls_stage_idx" ON "tracked_urls"("stage");

-- 5. Add target_countries to keywords
ALTER TABLE "keywords" ADD COLUMN "target_countries" TEXT NOT NULL DEFAULT 'us';

-- 6. Add new columns to weekly_snapshots (keeping table name)
ALTER TABLE "weekly_snapshots" ADD COLUMN "date" TIMESTAMP(3);
ALTER TABLE "weekly_snapshots" ADD COLUMN "country_code" TEXT NOT NULL DEFAULT 'us';

-- Backfill date from week_starting for existing rows
UPDATE "weekly_snapshots" SET "date" = "week_starting" WHERE "date" IS NULL;

-- Make date non-nullable after backfill
ALTER TABLE "weekly_snapshots" ALTER COLUMN "date" SET NOT NULL;

-- Drop old unique constraint and create new one
ALTER TABLE "weekly_snapshots" DROP CONSTRAINT IF EXISTS "weekly_snapshots_keyword_id_week_starting_key";
CREATE UNIQUE INDEX "weekly_snapshots_keyword_id_country_code_date_key" ON "weekly_snapshots"("keyword_id", "country_code", "date");
CREATE INDEX "weekly_snapshots_date_idx" ON "weekly_snapshots"("date");
CREATE INDEX "weekly_snapshots_country_code_idx" ON "weekly_snapshots"("country_code");

-- 7. Add type to notes
ALTER TABLE "notes" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'change';

-- 8. Drop alerts table (replaced by computed insights)
DROP TABLE IF EXISTS "alerts";

-- ============================================================
-- Data migration happens in scripts/migrate-to-multilocale.js
-- which creates Article records and links TrackedUrls to them.
-- After that script runs, article_id is made non-nullable:
-- ALTER TABLE "tracked_urls" ALTER COLUMN "article_id" SET NOT NULL;
-- ============================================================
