import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

// POST /api/articles/[id]/locales — add locale variant
export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const { url, title, locale, keywords = [], stage = 'monitoring' } = body;

  if (!url || !locale) {
    return NextResponse.json({ error: 'url and locale required' }, { status: 400 });
  }

  // Get default countries from locale config
  const localeConfig = await prisma.localeConfig.findUnique({ where: { locale } });
  const defaultCountries = localeConfig?.defaultCountries || 'us';

  const created = await prisma.trackedUrl.create({
    data: {
      articleId: parseInt(id),
      url,
      title: title || url,
      locale,
      stage,
      keywords: {
        create: keywords.map(kw => ({
          keyword: kw.keyword.toLowerCase().trim(),
          source: kw.source || 'manual',
          intent: kw.intent || 'commercial',
          tracked: kw.tracked !== false,
          targetCountries: kw.targetCountries || defaultCountries,
        })),
      },
      notes: {
        create: { text: `${locale.toUpperCase()} locale added`, type: 'general' },
      },
    },
    include: { keywords: true, notes: true },
  });

  return NextResponse.json(created, { status: 201 });
}
