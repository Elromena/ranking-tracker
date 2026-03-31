import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'status';
  const days = parseInt(searchParams.get('days') || '14');

  const since = new Date();
  since.setDate(since.getDate() - days);

  try {
    switch (type) {
      case 'status':
        return NextResponse.json(await getStatus());
      case 'movements':
        return NextResponse.json(await getMovements(days));
      case 'trends':
        return NextResponse.json(await getTrends());
      case 'overview':
        return NextResponse.json(await getOverview(since));
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (err) {
    console.error(`[insights/${type}]`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function getOverview(since) {
  const [totalArticles, totalKeywords, recentDrops, recentGains, avgPosition] = await Promise.all([
    prisma.article.count(),
    prisma.keyword.count({ where: { tracked: true } }),
    prisma.snapshot.count({
      where: { posChange: { lte: -3 }, serpPosition: { not: null }, date: { gte: since } },
    }),
    prisma.snapshot.count({
      where: { posChange: { gte: 3 }, serpPosition: { not: null }, date: { gte: since } },
    }),
    prisma.snapshot.aggregate({
      where: { serpPosition: { not: null }, date: { gte: since } },
      _avg: { serpPosition: true },
    }),
  ]);

  const gscAgg = await prisma.pageTraffic.aggregate({
    where: { date: { gte: since } },
    _sum: { clicks: true, impressions: true },
  });

  return {
    totalArticles,
    totalKeywords,
    recentDrops,
    recentGains,
    avgPosition: avgPosition._avg.serpPosition
      ? Math.round(avgPosition._avg.serpPosition * 10) / 10
      : null,
    totalClicks: gscAgg._sum.clicks || 0,
    totalImpressions: gscAgg._sum.impressions || 0,
  };
}

/**
 * Status: current state of every tracked keyword.
 * Groups: On Target (1-3), Close (4-10), Off Target (11+), Not Ranking.
 */
async function getStatus() {
  const keywords = await prisma.keyword.findMany({
    where: { tracked: true },
    select: {
      id: true,
      keyword: true,
      intent: true,
      trackedUrl: {
        select: {
          id: true,
          locale: true,
          stage: true,
          article: { select: { id: true, title: true, slug: true, category: true } },
        },
      },
      snapshots: {
        orderBy: { date: 'desc' },
        take: 1,
        select: {
          serpPosition: true,
          prevPosition: true,
          posChange: true,
          date: true,
          countryCode: true,
        },
      },
    },
  });

  const items = keywords.map((kw) => {
    const snap = kw.snapshots[0];
    const pos = snap?.serpPosition ?? null;
    let bucket;
    if (pos === null) bucket = 'not_ranking';
    else if (pos <= 3) bucket = 'on_target';
    else if (pos <= 10) bucket = 'close';
    else bucket = 'off_target';

    return {
      keywordId: kw.id,
      keyword: kw.keyword,
      intent: kw.intent,
      position: pos,
      prevPosition: snap?.prevPosition ?? null,
      posChange: snap?.posChange ?? 0,
      date: snap?.date ?? null,
      countryCode: snap?.countryCode ?? null,
      bucket,
      locale: kw.trackedUrl.locale,
      localeId: kw.trackedUrl.id,
      stage: kw.trackedUrl.stage,
      articleId: kw.trackedUrl.article?.id,
      articleTitle: kw.trackedUrl.article?.title,
      articleSlug: kw.trackedUrl.article?.slug,
      category: kw.trackedUrl.article?.category,
    };
  });

  const counts = { on_target: 0, close: 0, off_target: 0, not_ranking: 0 };
  items.forEach((i) => counts[i.bucket]++);

  return { items, counts, total: items.length };
}

/**
 * Movements: net change per keyword over the requested period.
 * Compares oldest snapshot in window to latest — one entry per keyword, no duplicates.
 */
async function getMovements(days) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const keywords = await prisma.keyword.findMany({
    where: { tracked: true },
    select: {
      id: true,
      keyword: true,
      intent: true,
      trackedUrl: {
        select: {
          id: true,
          locale: true,
          stage: true,
          article: { select: { id: true, title: true, slug: true, category: true } },
        },
      },
      snapshots: {
        where: { date: { gte: since }, serpPosition: { not: null } },
        orderBy: { date: 'asc' },
        select: {
          serpPosition: true,
          date: true,
          countryCode: true,
        },
      },
    },
  });

  const movements = [];

  for (const kw of keywords) {
    if (kw.snapshots.length < 2) continue;

    const oldest = kw.snapshots[0];
    const latest = kw.snapshots[kw.snapshots.length - 1];
    const netChange = oldest.serpPosition - latest.serpPosition; // positive = improved

    if (Math.abs(netChange) < 3) continue;

    movements.push({
      keywordId: kw.id,
      keyword: kw.keyword,
      intent: kw.intent,
      oldPosition: oldest.serpPosition,
      newPosition: latest.serpPosition,
      netChange,
      oldDate: oldest.date,
      newDate: latest.date,
      countryCode: latest.countryCode,
      locale: kw.trackedUrl.locale,
      localeId: kw.trackedUrl.id,
      stage: kw.trackedUrl.stage,
      articleId: kw.trackedUrl.article?.id,
      articleTitle: kw.trackedUrl.article?.title,
      articleSlug: kw.trackedUrl.article?.slug,
      category: kw.trackedUrl.article?.category,
      direction: netChange > 0 ? 'improved' : 'declined',
    });
  }

  movements.sort((a, b) => {
    // Drops first (most negative netChange), then gains
    if (a.netChange < 0 && b.netChange >= 0) return -1;
    if (a.netChange >= 0 && b.netChange < 0) return 1;
    if (a.netChange < 0 && b.netChange < 0) return a.netChange - b.netChange;
    return b.netChange - a.netChange;
  });

  const dropCount = movements.filter((m) => m.netChange < 0).length;
  const gainCount = movements.filter((m) => m.netChange > 0).length;

  return { items: movements, dropCount, gainCount, total: movements.length };
}

/**
 * Trends: detects gradual position declines over 30 days.
 * Computes weekly averages and flags consistent downward slopes.
 */
async function getTrends() {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const keywords = await prisma.keyword.findMany({
    where: { tracked: true },
    select: {
      id: true,
      keyword: true,
      intent: true,
      trackedUrl: {
        select: {
          id: true,
          locale: true,
          stage: true,
          article: { select: { id: true, title: true, slug: true, category: true } },
        },
      },
      snapshots: {
        where: { date: { gte: since }, serpPosition: { not: null } },
        orderBy: { date: 'asc' },
        select: {
          serpPosition: true,
          date: true,
          countryCode: true,
        },
      },
    },
  });

  const trends = [];

  for (const kw of keywords) {
    if (kw.snapshots.length < 4) continue;

    // Group into weekly buckets
    const weeks = {};
    for (const snap of kw.snapshots) {
      const weekNum = Math.floor((new Date(snap.date) - since) / (7 * 86400000));
      if (!weeks[weekNum]) weeks[weekNum] = [];
      weeks[weekNum].push(snap.serpPosition);
    }

    const weekKeys = Object.keys(weeks).map(Number).sort((a, b) => a - b);
    if (weekKeys.length < 2) continue;

    const weeklyAvgs = weekKeys.map((w) => {
      const positions = weeks[w];
      return positions.reduce((a, b) => a + b, 0) / positions.length;
    });

    // Compute slope via linear regression
    const n = weeklyAvgs.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += weeklyAvgs[i];
      sumXY += i * weeklyAvgs[i];
      sumX2 += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // Positive slope = positions getting worse (higher number = worse rank)
    const declining = slope > 0.5;

    // Check for lost-top-3: was in top 3 at start, not in top 3 now
    const firstAvg = weeklyAvgs[0];
    const lastAvg = weeklyAvgs[weeklyAvgs.length - 1];
    const lostTop3 = firstAvg <= 3 && lastAvg > 3;

    // Check consecutive decline: each week worse than previous
    let consecutiveDeclines = 0;
    for (let i = 1; i < weeklyAvgs.length; i++) {
      if (weeklyAvgs[i] > weeklyAvgs[i - 1]) consecutiveDeclines++;
      else break;
    }
    const consistentDecline = consecutiveDeclines >= 2;

    if (!declining && !lostTop3 && !consistentDecline) continue;

    const flags = [];
    if (declining) flags.push('declining');
    if (lostTop3) flags.push('lost_top3');
    if (consistentDecline) flags.push('consistent_decline');

    trends.push({
      keywordId: kw.id,
      keyword: kw.keyword,
      intent: kw.intent,
      weeklyAvgs: weeklyAvgs.map((a) => Math.round(a * 10) / 10),
      slope: Math.round(slope * 100) / 100,
      currentPosition: Math.round(lastAvg * 10) / 10,
      startPosition: Math.round(firstAvg * 10) / 10,
      flags,
      lostTop3,
      consistentDecline,
      locale: kw.trackedUrl.locale,
      localeId: kw.trackedUrl.id,
      stage: kw.trackedUrl.stage,
      articleId: kw.trackedUrl.article?.id,
      articleTitle: kw.trackedUrl.article?.title,
      articleSlug: kw.trackedUrl.article?.slug,
      category: kw.trackedUrl.article?.category,
    });
  }

  // Sort: lost_top3 first, then by slope descending (worst declines first)
  trends.sort((a, b) => {
    if (a.lostTop3 && !b.lostTop3) return -1;
    if (!a.lostTop3 && b.lostTop3) return 1;
    return b.slope - a.slope;
  });

  return {
    items: trends,
    decliningCount: trends.filter((t) => t.flags.includes('declining')).length,
    lostTop3Count: trends.filter((t) => t.lostTop3).length,
    total: trends.length,
  };
}
