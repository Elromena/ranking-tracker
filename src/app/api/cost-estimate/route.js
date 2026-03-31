import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const COST_PER_CALL = 0.0025; // DataForSEO ~$0.0025 per SERP call

// GET /api/cost-estimate — pre-calculate next cron run cost
export async function GET() {
  const locales = await prisma.trackedUrl.findMany({
    where: { trackingEnabled: true, stage: { not: 'parked' } },
    select: {
      id: true,
      locale: true,
      stage: true,
      articleId: true,
      keywords: {
        where: { tracked: true },
        select: { id: true, targetCountries: true },
      },
    },
  });

  // Batch: get last snapshot date per locale in one query
  const allKeywordIds = locales.flatMap(loc => loc.keywords.map(k => k.id));
  const lastSnapshots = allKeywordIds.length > 0
    ? await prisma.$queryRawUnsafe(`
        SELECT DISTINCT ON (k.url_id) k.url_id as "localeId", s.date
        FROM weekly_snapshots s
        JOIN keywords k ON k.id = s.keyword_id
        WHERE s.keyword_id = ANY($1)
        ORDER BY k.url_id, s.date DESC
      `, allKeywordIds)
    : [];

  const lastDateByLocale = {};
  for (const row of lastSnapshots) {
    lastDateByLocale[row.localeId] = new Date(row.date);
  }

  const breakdown = {};
  let totalCalls = 0;

  for (const loc of locales) {
    if (loc.keywords.length === 0) continue;

    const isDue = isLocaleDue(loc.stage, lastDateByLocale[loc.id]);
    if (!isDue) continue;

    for (const kw of loc.keywords) {
      const countries = (kw.targetCountries || 'us').split(',');
      const calls = countries.length;

      if (!breakdown[loc.locale]) {
        breakdown[loc.locale] = {
          locale: loc.locale,
          articles: new Set(),
          keywords: 0,
          countries: new Set(),
          calls: 0,
          cost: 0,
          byStage: {},
        };
      }

      const b = breakdown[loc.locale];
      b.articles.add(loc.articleId);
      b.keywords++;
      countries.forEach(c => b.countries.add(c));
      b.calls += calls;
      b.cost += calls * COST_PER_CALL;

      if (!b.byStage[loc.stage]) b.byStage[loc.stage] = { calls: 0, keywords: 0 };
      b.byStage[loc.stage].calls += calls;
      b.byStage[loc.stage].keywords++;

      totalCalls += calls;
    }
  }

  const localeBreakdown = Object.values(breakdown).map(b => ({
    locale: b.locale,
    articles: b.articles.size,
    keywords: b.keywords,
    countries: b.countries.size,
    calls: b.calls,
    cost: Math.round(b.cost * 100) / 100,
    byStage: b.byStage,
  }));

  return NextResponse.json({
    totalCalls,
    estimatedCost: Math.round(totalCalls * COST_PER_CALL * 100) / 100,
    costPerCall: COST_PER_CALL,
    breakdown: localeBreakdown,
  });
}

function isLocaleDue(stage, lastDate) {
  if (stage === 'parked') return false;
  if (stage === 'in_progress' || stage === 'in_review') return true;
  if (!lastDate) return true;

  const daysSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
  if (stage === 'monitoring') return daysSince >= 7;
  if (stage === 'backlog') return daysSince >= 30;
  return true;
}
