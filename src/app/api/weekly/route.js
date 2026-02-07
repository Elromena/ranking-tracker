import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/weekly?weeks=4 — get weekly report aggregated by URL
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const weeksBack = parseInt(searchParams.get('weeks') || '4');

  // Get the last N distinct weeks
  const distinctWeeks = await prisma.weeklySnapshot.findMany({
    select: { weekStarting: true },
    distinct: ['weekStarting'],
    orderBy: { weekStarting: 'desc' },
    take: weeksBack,
  });

  if (distinctWeeks.length === 0) {
    return NextResponse.json({ weeks: [], data: [] });
  }

  const weekDates = distinctWeeks.map(w => w.weekStarting);

  // Get all snapshots for these weeks, with keyword + URL info
  const snapshots = await prisma.weeklySnapshot.findMany({
    where: { weekStarting: { in: weekDates } },
    include: {
      keyword: {
        include: {
          trackedUrl: { select: { id: true, title: true, category: true, status: true } },
        },
      },
    },
    orderBy: { weekStarting: 'desc' },
  });

  // Group by week → URL → keywords
  const weeklyMap = {};
  for (const snap of snapshots) {
    const weekKey = snap.weekStarting.toISOString();
    const urlId = snap.keyword.trackedUrl.id;

    if (!weeklyMap[weekKey]) weeklyMap[weekKey] = {};
    if (!weeklyMap[weekKey][urlId]) {
      weeklyMap[weekKey][urlId] = {
        url: snap.keyword.trackedUrl,
        keywords: [],
        totalClicks: 0,
        totalImpressions: 0,
        sumPosition: 0,
        posCount: 0,
      };
    }

    const entry = weeklyMap[weekKey][urlId];
    entry.keywords.push({
      keyword: snap.keyword.keyword,
      serpPosition: snap.serpPosition,
      gscPosition: snap.gscPosition,
      clicks: snap.gscClicks,
      impressions: snap.gscImpressions,
      ctr: snap.gscCtr,
      posChange: snap.posChange,
      prevPosition: snap.prevPosition,
      serpFeatures: snap.serpFeatures,
    });
    entry.totalClicks += snap.gscClicks || 0;
    entry.totalImpressions += snap.gscImpressions || 0;
    if (snap.serpPosition) {
      entry.sumPosition += snap.serpPosition;
      entry.posCount++;
    }
  }

  // Format response
  const weeks = weekDates.map(d => d.toISOString().split('T')[0]);
  const data = {};

  for (const [weekKey, urlMap] of Object.entries(weeklyMap)) {
    const weekStr = new Date(weekKey).toISOString().split('T')[0];
    data[weekStr] = Object.values(urlMap).map(entry => {
      const avgPos = entry.posCount > 0 ? entry.sumPosition / entry.posCount : null;
      const ctr = entry.totalImpressions > 0 ? entry.totalClicks / entry.totalImpressions : 0;

      // Calculate alert summary
      const dropping = entry.keywords.filter(k => k.posChange < -2);
      const climbing = entry.keywords.filter(k => k.posChange > 2);
      let alertText = '';
      if (dropping.length > 0) alertText = `🔴 ${dropping.length} kw dropping`;
      else if (climbing.length > 0) alertText = `🟢 ${climbing.length} kw climbing`;

      return {
        urlId: entry.url.id,
        title: entry.url.title,
        category: entry.url.category,
        status: entry.url.status,
        avgPosition: avgPos ? avgPos.toFixed(1) : null,
        totalClicks: entry.totalClicks,
        totalImpressions: entry.totalImpressions,
        ctr,
        kwCount: entry.keywords.length,
        alertText,
        keywords: entry.keywords,
      };
    });
  }

  return NextResponse.json({ weeks, data });
}
