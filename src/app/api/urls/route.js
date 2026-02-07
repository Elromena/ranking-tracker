import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/urls — list all URLs with keywords, latest stats, and alert counts
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const withStats = searchParams.get('stats') !== 'false';

  const urls = await prisma.trackedUrl.findMany({
    include: {
      keywords: {
        include: withStats ? {
          snapshots: {
            orderBy: { weekStarting: 'desc' },
            take: 2, // current + previous week for change calc
          },
          alerts: {
            where: { status: { not: 'resolved' } },
            orderBy: { alertDate: 'desc' },
            take: 5,
          },
        } : {},
      },
      notes: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Compute aggregates per URL
  const enriched = urls.map(url => {
    const activeKws = url.keywords.filter(k => k.tracked);
    let totalClicks = 0, totalImpr = 0, sumPos = 0, posCount = 0;
    let prevClicks = 0, prevSumPos = 0;
    let alertCount = 0;

    for (const kw of activeKws) {
      const latest = kw.snapshots?.[0];
      const prev = kw.snapshots?.[1];
      if (latest) {
        totalClicks += latest.gscClicks || 0;
        totalImpr += latest.gscImpressions || 0;
        if (latest.serpPosition) { sumPos += latest.serpPosition; posCount++; }
      }
      if (prev) {
        prevClicks += prev.gscClicks || 0;
        if (prev.serpPosition) prevSumPos += prev.serpPosition;
      }
      alertCount += kw.alerts?.length || 0;
    }

    const avgPos = posCount > 0 ? (sumPos / posCount).toFixed(1) : null;
    const clickChange = prevClicks > 0 ? (((totalClicks - prevClicks) / prevClicks) * 100).toFixed(0) : 0;

    return {
      ...url,
      stats: {
        activeKeywords: activeKws.length,
        avgPosition: avgPos,
        totalClicks,
        totalImpressions: totalImpr,
        clickChange: Number(clickChange),
        openAlerts: alertCount,
      },
    };
  });

  return NextResponse.json(enriched);
}

// POST /api/urls — create a new tracked URL with keywords
export async function POST(request) {
  const body = await request.json();
  const { url, title, category, priority, keywords = [] } = body;

  if (!url || !title) {
    return NextResponse.json({ error: 'url and title required' }, { status: 400 });
  }

  const created = await prisma.trackedUrl.create({
    data: {
      url,
      title,
      category: category || 'Advertising',
      priority: priority || 'medium',
      keywords: {
        create: keywords.map(kw => ({
          keyword: kw.keyword.toLowerCase().trim(),
          source: kw.source || 'manual',
          intent: kw.intent || 'commercial',
          tracked: kw.tracked !== false,
        })),
      },
      notes: {
        create: { text: 'Article added to tracker' },
      },
    },
    include: { keywords: true, notes: true },
  });

  return NextResponse.json(created, { status: 201 });
}
