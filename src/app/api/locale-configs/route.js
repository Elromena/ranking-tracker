import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/locale-configs
export async function GET() {
  const configs = await prisma.localeConfig.findMany({
    orderBy: { sortOrder: 'asc' },
  });
  return NextResponse.json(configs);
}

// POST /api/locale-configs — add or update locale
export async function POST(request) {
  const body = await request.json();
  const { locale, displayName, urlPrefix, defaultCountries, languageCode, enabled, sortOrder } = body;

  if (!locale || !displayName) {
    return NextResponse.json({ error: 'locale and displayName required' }, { status: 400 });
  }

  const config = await prisma.localeConfig.upsert({
    where: { locale },
    create: {
      locale,
      displayName,
      urlPrefix: urlPrefix || '',
      defaultCountries: defaultCountries || 'us',
      languageCode: languageCode || 'en',
      enabled: enabled !== false,
      sortOrder: sortOrder || 0,
    },
    update: {
      displayName,
      urlPrefix,
      defaultCountries,
      languageCode,
      enabled,
      sortOrder,
    },
  });

  return NextResponse.json(config);
}
