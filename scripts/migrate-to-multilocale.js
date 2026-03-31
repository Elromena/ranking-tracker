/**
 * Data migration: Multi-Locale Pipeline System
 *
 * IDEMPOTENT — safe to run multiple times on redeploys.
 *
 * Run AFTER the Prisma SQL migration has been applied.
 * This script:
 * 1. Creates Article records by grouping TrackedUrls by slug (skips if already done)
 * 2. Sets locale + articleId on each TrackedUrl (skips if already set)
 * 3. Sets targetCountries on keywords from global config
 * 4. Seeds LocaleConfig for en, ru, ko
 * 5. Makes article_id non-nullable (safe if already non-nullable)
 *
 * Usage: node scripts/migrate-to-multilocale.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Known locale prefixes (subdirectory pattern)
const LOCALE_PREFIXES = ['ru', 'ko', 'ja', 'de', 'fr', 'es', 'zh', 'pt', 'ar', 'tr', 'vi', 'id'];

function parseUrlForLocale(url) {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);

    // Check if first path segment is a known locale prefix
    if (pathParts.length > 0 && LOCALE_PREFIXES.includes(pathParts[0])) {
      const locale = pathParts[0];
      const slugParts = pathParts.slice(1); // everything after locale prefix
      const slug = slugParts.join('/') || 'homepage';
      return { locale, slug };
    }

    // No locale prefix = English
    const slug = pathParts[pathParts.length - 1] || pathParts.join('/') || 'homepage';
    return { locale: 'en', slug };
  } catch (e) {
    // Fallback: treat the whole URL as the slug
    return { locale: 'en', slug: url.replace(/[^a-z0-9-/]/gi, '-') };
  }
}

async function main() {
  console.log('Starting multi-locale data migration (idempotent)...\n');

  // Check if migration is needed: look for TrackedUrls with no article_id
  // We use raw query because Prisma schema says articleId is required,
  // but the column may still be nullable in the DB during migration.
  let unmigrated;
  try {
    unmigrated = await prisma.$queryRaw`
      SELECT t.id, t.url, t.title, t.locale, t.article_id
      FROM tracked_urls t
      WHERE t.article_id IS NULL
    `;
  } catch (e) {
    // If article_id column doesn't exist yet, the SQL migration hasn't run
    if (e.message.includes('article_id')) {
      console.log('article_id column does not exist yet — SQL migration not applied. Skipping data migration.');
      return;
    }
    throw e;
  }

  console.log(`Found ${unmigrated.length} unmigrated tracked URLs`);

  if (unmigrated.length === 0) {
    console.log('All URLs already migrated. Seeding locale configs and ensuring constraints...');
    await seedLocaleConfigs();
    await safelyMakeArticleIdNonNullable();
    await safelyAddArticleLocaleConstraint();
    console.log('\nMigration complete!');
    return;
  }

  // 1. Get current global config for country
  const countryConfig = await prisma.config.findUnique({ where: { key: 'dfsCountry' } });
  const defaultCountry = countryConfig?.value || 'us';
  console.log(`Default country from config: ${defaultCountry}`);

  // 2. Load keywords for unmigrated URLs
  const urlIds = unmigrated.map(u => u.id);
  const allKeywords = await prisma.keyword.findMany({
    where: { urlId: { in: urlIds } }
  });
  const keywordsByUrl = {};
  for (const kw of allKeywords) {
    if (!keywordsByUrl[kw.urlId]) keywordsByUrl[kw.urlId] = [];
    keywordsByUrl[kw.urlId].push(kw);
  }

  // 3. Group URLs by slug to create Articles
  const articleGroups = new Map(); // slug -> { title, category, urls: [] }

  for (const url of unmigrated) {
    const { locale, slug } = parseUrlForLocale(url.url);

    if (!articleGroups.has(slug)) {
      articleGroups.set(slug, {
        title: url.title,
        category: 'Advertising',
        urls: []
      });
    }

    articleGroups.get(slug).urls.push({ ...url, detectedLocale: locale });
  }

  console.log(`Grouped into ${articleGroups.size} articles\n`);

  // 4. Create Article records and link TrackedUrls
  let articlesCreated = 0;
  let articlesReused = 0;
  let urlsUpdated = 0;
  let keywordsUpdated = 0;

  for (const [slug, group] of articleGroups) {
    // Upsert the Article (may already exist from a partial previous run)
    let article = await prisma.article.findUnique({ where: { slug } });
    if (!article) {
      article = await prisma.article.create({
        data: {
          slug,
          title: group.title,
          category: group.category,
        }
      });
      articlesCreated++;
    } else {
      articlesReused++;
    }

    // Update each TrackedUrl in this group using raw SQL
    // (Prisma model expects articleId non-null, but column is still nullable)
    for (const url of group.urls) {
      await prisma.$executeRaw`
        UPDATE tracked_urls
        SET article_id = ${article.id},
            locale = ${url.detectedLocale},
            stage = 'monitoring'
        WHERE id = ${url.id} AND article_id IS NULL
      `;
      urlsUpdated++;

      // Update keywords with default target countries
      const kws = keywordsByUrl[url.id] || [];
      for (const kw of kws) {
        await prisma.$executeRaw`
          UPDATE keywords
          SET target_countries = ${defaultCountry}
          WHERE id = ${kw.id}
        `;
        keywordsUpdated++;
      }
    }

    // Log progress every 20 articles
    if ((articlesCreated + articlesReused) % 20 === 0) {
      console.log(`  ...processed ${articlesCreated + articlesReused}/${articleGroups.size} articles`);
    }
  }

  console.log(`\nCreated ${articlesCreated} articles (reused ${articlesReused} existing)`);
  console.log(`Updated ${urlsUpdated} tracked URLs (locale + articleId)`);
  console.log(`Updated ${keywordsUpdated} keywords (targetCountries)`);

  // 5. Seed LocaleConfig
  await seedLocaleConfigs();

  // 6. Make article_id non-nullable
  await safelyMakeArticleIdNonNullable();

  // 7. Add unique constraint on (articleId, locale)
  await safelyAddArticleLocaleConstraint();

  console.log('\nMigration complete!');
}

async function seedLocaleConfigs() {
  console.log('\nSeeding locale configs...');

  const locales = [
    { locale: 'en', displayName: 'English', urlPrefix: '', defaultCountries: 'us', languageCode: 'en', sortOrder: 0 },
    { locale: 'ru', displayName: 'Russian', urlPrefix: 'ru', defaultCountries: 'ru', languageCode: 'ru', sortOrder: 1 },
    { locale: 'ko', displayName: 'Korean', urlPrefix: 'ko', defaultCountries: 'kr', languageCode: 'ko', sortOrder: 2 },
  ];

  for (const lc of locales) {
    await prisma.localeConfig.upsert({
      where: { locale: lc.locale },
      create: lc,
      update: lc,
    });
    console.log(`  Seeded locale: ${lc.displayName} (${lc.locale})`);
  }
}

async function safelyMakeArticleIdNonNullable() {
  console.log('\nEnsuring article_id is non-nullable...');

  // Check for any orphaned URLs without an article
  const orphaned = await prisma.$queryRaw`
    SELECT id, url, title FROM tracked_urls WHERE article_id IS NULL
  `;

  if (orphaned.length > 0) {
    console.warn(`WARNING: ${orphaned.length} URLs still have no article_id. Creating fallback articles...`);
    for (const url of orphaned) {
      const { locale, slug } = parseUrlForLocale(url.url);
      let article = await prisma.article.findUnique({ where: { slug } });
      if (!article) {
        article = await prisma.article.create({
          data: { slug, title: url.title, category: 'Uncategorized' }
        });
      }
      await prisma.$executeRaw`
        UPDATE tracked_urls SET article_id = ${article.id}, locale = ${locale}
        WHERE id = ${url.id}
      `;
    }
  }

  // Safely set NOT NULL (catches error if already non-nullable)
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "tracked_urls" ALTER COLUMN "article_id" SET NOT NULL`
    );
    console.log('  article_id is now NOT NULL');
  } catch (e) {
    if (e.message.includes('already') || e.message.includes('NOT NULL')) {
      console.log('  article_id was already NOT NULL');
    } else {
      throw e;
    }
  }
}

async function safelyAddArticleLocaleConstraint() {
  console.log('\nEnsuring unique constraint (article_id, locale)...');
  try {
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "tracked_urls_article_id_locale_key" ON "tracked_urls"("article_id", "locale")`
    );
    await prisma.$executeRawUnsafe(
      `DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'tracked_urls_article_id_fkey'
        ) THEN
          ALTER TABLE "tracked_urls" ADD CONSTRAINT "tracked_urls_article_id_fkey"
          FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE;
        END IF;
      END $$`
    );
    console.log('  Constraints ensured');
  } catch (e) {
    console.log('  Constraint may already exist:', e.message);
  }
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
