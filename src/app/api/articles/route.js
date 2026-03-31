import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/articles — list all articles with locale summaries
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const locale = searchParams.get('locale');
  const stage = searchParams.get('stage');
  const search = searchParams.get('search');

  const where = {};
  if (category) where.category = category;

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      { locales: { some: { title: { contains: search, mode: 'insensitive' } } } },
    ];
  }

  const localeWhere = {
    ...(locale ? { locale } : {}),
    ...(stage ? { stage } : {}),
  };

  const articles = await prisma.article.findMany({
    where,
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      createdAt: true,
      locales: {
        where: localeWhere,
        select: {
          id: true,
          locale: true,
          title: true,
          url: true,
          stage: true,
          trackingEnabled: true,
          reviewStartedAt: true,
          reviewDays: true,
          keywords: {
            where: { tracked: true },
            select: {
              id: true,
              snapshots: {
                orderBy: { date: 'desc' },
                take: 1,
                select: {
                  serpPosition: true,
                  posChange: true,
                },
              },
            },
          },
          notes: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, text: true, type: true, createdAt: true },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const enriched = articles.map(article => {
    const localeSummaries = article.locales.map(loc => {
      let sumPos = 0, posCount = 0, totalChange = 0;

      for (const kw of loc.keywords) {
        const latest = kw.snapshots?.[0];
        if (latest?.serpPosition) {
          sumPos += latest.serpPosition;
          posCount++;
          totalChange += latest.posChange || 0;
        }
      }

      const avgPos = posCount > 0 ? Math.round((sumPos / posCount) * 10) / 10 : null;
      const netChange = posCount > 0 ? Math.round((totalChange / posCount) * 10) / 10 : 0;

      return {
        id: loc.id,
        locale: loc.locale,
        title: loc.title,
        url: loc.url,
        stage: loc.stage,
        trackingEnabled: loc.trackingEnabled,
        reviewStartedAt: loc.reviewStartedAt,
        reviewDays: loc.reviewDays,
        keywordCount: loc.keywords.length,
        avgPosition: avgPos,
        netChange,
        lastNote: loc.notes[0] || null,
      };
    });

    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      category: article.category,
      createdAt: article.createdAt,
      locales: localeSummaries,
      localeCount: localeSummaries.length,
    };
  });

  return NextResponse.json(enriched);
}

// POST /api/articles — create article with locale variants
export async function POST(request) {
  const body = await request.json();
  const { slug, title, category, locales = [] } = body;

  if (!title || locales.length === 0) {
    return NextResponse.json(
      { error: 'title and at least one locale required' },
      { status: 400 }
    );
  }

  // Auto-generate slug from title if not provided
  const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const created = await prisma.article.create({
    data: {
      slug: finalSlug,
      title,
      category: category || 'Advertising',
      locales: {
        create: locales.map(loc => ({
          url: loc.url,
          title: loc.title || title,
          locale: loc.locale || 'en',
          stage: loc.stage || 'monitoring',
          keywords: {
            create: (loc.keywords || []).map(kw => ({
              keyword: kw.keyword.toLowerCase().trim(),
              source: kw.source || 'manual',
              intent: kw.intent || 'commercial',
              tracked: kw.tracked !== false,
              targetCountries: kw.targetCountries || loc.defaultCountries || 'us',
            })),
          },
          notes: {
            create: { text: 'Article added to tracker', type: 'general' },
          },
        })),
      },
    },
    include: {
      locales: {
        include: { keywords: true, notes: true },
      },
    },
  });

  return NextResponse.json(created, { status: 201 });
}
