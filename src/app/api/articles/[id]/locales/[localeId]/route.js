import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

// PUT /api/articles/[id]/locales/[localeId] — update locale variant
export async function PUT(request, { params }) {
  const { localeId } = await params;
  const body = await request.json();
  const { url, title, trackingEnabled, keywords } = body;

  const data = {};
  if (url !== undefined) data.url = url;
  if (title !== undefined) data.title = title;
  if (trackingEnabled !== undefined) data.trackingEnabled = trackingEnabled;

  const updated = await prisma.trackedUrl.update({
    where: { id: parseInt(localeId) },
    data,
    include: { keywords: true },
  });

  // Handle keyword updates if provided
  if (keywords) {
    for (const kw of keywords) {
      if (kw.id) {
        // Update existing
        await prisma.keyword.update({
          where: { id: kw.id },
          data: {
            keyword: kw.keyword?.toLowerCase().trim(),
            intent: kw.intent,
            tracked: kw.tracked,
            targetCountries: kw.targetCountries,
          },
        });
      } else if (kw.keyword) {
        // Create new
        await prisma.keyword.create({
          data: {
            urlId: parseInt(localeId),
            keyword: kw.keyword.toLowerCase().trim(),
            source: kw.source || 'manual',
            intent: kw.intent || 'commercial',
            tracked: kw.tracked !== false,
            targetCountries: kw.targetCountries || 'us',
          },
        });
      }
    }

    // Remove keywords marked for deletion
    const toDelete = keywords.filter(kw => kw._delete && kw.id);
    if (toDelete.length > 0) {
      await prisma.keyword.deleteMany({
        where: { id: { in: toDelete.map(kw => kw.id) } },
      });
    }
  }

  // Refetch with updated keywords
  const result = await prisma.trackedUrl.findUnique({
    where: { id: parseInt(localeId) },
    include: { keywords: true, notes: true },
  });

  return NextResponse.json(result);
}

// DELETE /api/articles/[id]/locales/[localeId] — remove locale variant
export async function DELETE(request, { params }) {
  const { localeId } = await params;

  await prisma.trackedUrl.delete({
    where: { id: parseInt(localeId) },
  });

  return NextResponse.json({ ok: true });
}
