/**
 * Safe deploy migration — ADDITIVE ONLY, never drops columns or tables.
 *
 * Replaces `prisma db push --accept-data-loss` for production deployments.
 * Old columns (e.g. GSC fields on weekly_snapshots) stay in the database
 * and are simply ignored by the app. No data is ever deleted.
 *
 * IDEMPOTENT — safe to run on every deploy.
 *
 * Usage: node scripts/deploy-migrate.js
 */

const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Connected to database. Running safe additive migrations...\n');

  async function run(label, sql) {
    try {
      await client.query(sql);
      console.log(`  ✓ ${label}`);
    } catch (e) {
      if (
        e.message.includes('already exists') ||
        e.message.includes('duplicate') ||
        e.message.includes('multiple primary')
      ) {
        console.log(`  – ${label} (already done)`);
      } else {
        console.error(`  ✗ ${label}: ${e.message}`);
        throw e;
      }
    }
  }

  // ── 1. Articles table ──
  await run('Create articles table', `
    CREATE TABLE IF NOT EXISTS "articles" (
      "id" SERIAL PRIMARY KEY,
      "slug" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "category" TEXT NOT NULL DEFAULT 'Advertising',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await run('Unique index on articles.slug', `
    CREATE UNIQUE INDEX IF NOT EXISTS "articles_slug_key" ON "articles"("slug")
  `);

  // ── 2. Locale configs table ──
  await run('Create locale_configs table', `
    CREATE TABLE IF NOT EXISTS "locale_configs" (
      "id" SERIAL PRIMARY KEY,
      "locale" TEXT NOT NULL,
      "display_name" TEXT NOT NULL,
      "url_prefix" TEXT NOT NULL DEFAULT '',
      "default_countries" TEXT NOT NULL DEFAULT 'us',
      "language_code" TEXT NOT NULL DEFAULT 'en',
      "enabled" BOOLEAN NOT NULL DEFAULT true,
      "sort_order" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await run('Unique index on locale_configs.locale', `
    CREATE UNIQUE INDEX IF NOT EXISTS "locale_configs_locale_key" ON "locale_configs"("locale")
  `);

  // ── 3. Cron runs table ──
  await run('Create cron_runs table', `
    CREATE TABLE IF NOT EXISTS "cron_runs" (
      "id" SERIAL PRIMARY KEY,
      "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "completed_at" TIMESTAMP(3),
      "api_calls" INTEGER NOT NULL DEFAULT 0,
      "estimated_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "keywords_processed" INTEGER NOT NULL DEFAULT 0,
      "errors" INTEGER NOT NULL DEFAULT 0,
      "status" TEXT NOT NULL DEFAULT 'running',
      "log" TEXT
    )
  `);
  await run('Index on cron_runs.started_at', `
    CREATE INDEX IF NOT EXISTS "cron_runs_started_at_idx" ON "cron_runs"("started_at")
  `);

  // ── 4. Page traffic table (page-level GSC data) ──
  await run('Create page_traffic table', `
    CREATE TABLE IF NOT EXISTS "page_traffic" (
      "id" SERIAL PRIMARY KEY,
      "url_id" INTEGER NOT NULL,
      "date" TIMESTAMP(3) NOT NULL,
      "clicks" INTEGER NOT NULL DEFAULT 0,
      "impressions" INTEGER NOT NULL DEFAULT 0,
      "ctr" DOUBLE PRECISION,
      "position" DOUBLE PRECISION,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "page_traffic_url_id_fkey"
        FOREIGN KEY ("url_id") REFERENCES "tracked_urls"("id") ON DELETE CASCADE
    )
  `);
  await run('Unique index on page_traffic(url_id, date)', `
    CREATE UNIQUE INDEX IF NOT EXISTS "page_traffic_url_id_date_key" ON "page_traffic"("url_id", "date")
  `);
  await run('Index on page_traffic(url_id, date DESC)', `
    CREATE INDEX IF NOT EXISTS "page_traffic_url_id_date_idx" ON "page_traffic"("url_id", "date" DESC)
  `);

  // ── 5. Add columns to tracked_urls (IF NOT EXISTS) ──
  const tuCols = [
    { name: 'locale',            sql: `ALTER TABLE "tracked_urls" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en'` },
    { name: 'tracking_enabled',  sql: `ALTER TABLE "tracked_urls" ADD COLUMN "tracking_enabled" BOOLEAN NOT NULL DEFAULT true` },
    { name: 'stage',             sql: `ALTER TABLE "tracked_urls" ADD COLUMN "stage" TEXT NOT NULL DEFAULT 'monitoring'` },
    { name: 'review_started_at', sql: `ALTER TABLE "tracked_urls" ADD COLUMN "review_started_at" TIMESTAMP(3)` },
    { name: 'review_days',       sql: `ALTER TABLE "tracked_urls" ADD COLUMN "review_days" INTEGER NOT NULL DEFAULT 21` },
    { name: 'article_id',        sql: `ALTER TABLE "tracked_urls" ADD COLUMN "article_id" INTEGER` },
  ];
  for (const col of tuCols) {
    const exists = await client.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'tracked_urls' AND column_name = $1
    `, [col.name]);
    if (exists.rowCount === 0) {
      await run(`Add tracked_urls.${col.name}`, col.sql);
    } else {
      console.log(`  – tracked_urls.${col.name} (already exists)`);
    }
  }

  await run('Index on tracked_urls.locale', `CREATE INDEX IF NOT EXISTS "tracked_urls_locale_idx" ON "tracked_urls"("locale")`);
  await run('Index on tracked_urls.stage', `CREATE INDEX IF NOT EXISTS "tracked_urls_stage_idx" ON "tracked_urls"("stage")`);
  await run('Index on tracked_urls.article_id', `CREATE INDEX IF NOT EXISTS "tracked_urls_article_id_idx" ON "tracked_urls"("article_id")`);
  await run('Index on tracked_urls.tracking_enabled', `CREATE INDEX IF NOT EXISTS "tracked_urls_tracking_enabled_idx" ON "tracked_urls"("tracking_enabled")`);

  // ── 6. Add columns to keywords ──
  const kwTargetExists = await client.query(`
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'keywords' AND column_name = 'target_countries'
  `);
  if (kwTargetExists.rowCount === 0) {
    await run('Add keywords.target_countries', `ALTER TABLE "keywords" ADD COLUMN "target_countries" TEXT NOT NULL DEFAULT 'us'`);
  } else {
    console.log(`  – keywords.target_countries (already exists)`);
  }

  // ── 7. Add columns to weekly_snapshots ──
  const snapDateExists = await client.query(`
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_snapshots' AND column_name = 'date'
  `);
  if (snapDateExists.rowCount === 0) {
    await run('Add weekly_snapshots.date', `ALTER TABLE "weekly_snapshots" ADD COLUMN "date" TIMESTAMP(3)`);
    await run('Backfill date from week_starting', `UPDATE "weekly_snapshots" SET "date" = "week_starting" WHERE "date" IS NULL`);
    await run('Make date NOT NULL', `ALTER TABLE "weekly_snapshots" ALTER COLUMN "date" SET NOT NULL`);
  } else {
    console.log(`  – weekly_snapshots.date (already exists)`);
  }

  const snapCountryExists = await client.query(`
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_snapshots' AND column_name = 'country_code'
  `);
  if (snapCountryExists.rowCount === 0) {
    await run('Add weekly_snapshots.country_code', `ALTER TABLE "weekly_snapshots" ADD COLUMN "country_code" TEXT NOT NULL DEFAULT 'us'`);
  } else {
    console.log(`  – weekly_snapshots.country_code (already exists)`);
  }

  await run('Index on weekly_snapshots.date', `CREATE INDEX IF NOT EXISTS "weekly_snapshots_date_idx" ON "weekly_snapshots"("date")`);
  await run('Index on weekly_snapshots.country_code', `CREATE INDEX IF NOT EXISTS "weekly_snapshots_country_code_idx" ON "weekly_snapshots"("country_code")`);
  await run('Unique index on weekly_snapshots(keyword_id, country_code, date)', `
    CREATE UNIQUE INDEX IF NOT EXISTS "weekly_snapshots_keyword_id_country_code_date_key"
    ON "weekly_snapshots"("keyword_id", "country_code", "date")
  `);

  // Additional snapshot indexes for performance
  await run('Index on weekly_snapshots(keyword_id, date DESC)', `CREATE INDEX IF NOT EXISTS "weekly_snapshots_keyword_id_date_idx" ON "weekly_snapshots"("keyword_id", "date" DESC)`);
  await run('Index on weekly_snapshots(pos_change, date)', `CREATE INDEX IF NOT EXISTS "weekly_snapshots_pos_change_date_idx" ON "weekly_snapshots"("pos_change", "date")`);
  await run('Index on weekly_snapshots(serp_position, date)', `CREATE INDEX IF NOT EXISTS "weekly_snapshots_serp_position_date_idx" ON "weekly_snapshots"("serp_position", "date")`);

  // ── 8. Add type column to notes ──
  const noteTypeExists = await client.query(`
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'type'
  `);
  if (noteTypeExists.rowCount === 0) {
    await run('Add notes.type', `ALTER TABLE "notes" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'change'`);
  } else {
    console.log(`  – notes.type (already exists)`);
  }

  // ── 9. Add keyword index for performance ──
  await run('Index on keywords(url_id, tracked)', `CREATE INDEX IF NOT EXISTS "keywords_url_id_tracked_idx" ON "keywords"("url_id", "tracked")`);

  // ── NOTE: We do NOT drop any columns or tables. ──
  // Old columns like gsc_clicks, gsc_impressions, gsc_ctr, gsc_position
  // on weekly_snapshots stay in the database. They are simply unused by
  // the application and will be ignored by Prisma. No data is lost.

  console.log('\n✓ All additive migrations applied. No data was dropped.\n');
  await client.end();
}

main().catch((e) => {
  console.error('Deploy migration failed:', e);
  process.exit(1);
});
