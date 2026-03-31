import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

// POST /api/urls/[id]/notes — add a note to a locale's changelog
// Auto-triggers "in_review" stage when a non-general note is added
export async function POST(request, { params }) {
  const { id } = await params;
  const urlId = parseInt(id);
  const { text, createdAt, type, reviewDays } = await request.json();

  if (!text) {
    return NextResponse.json({ error: 'text required' }, { status: 400 });
  }

  const data = {
    urlId,
    text,
    type: type || 'change',
  };

  if (createdAt) {
    data.createdAt = new Date(createdAt);
  }

  const note = await prisma.note.create({ data });

  // Auto-trigger review stage for non-general notes
  const noteType = type || 'change';
  if (noteType !== 'general') {
    const trackedUrl = await prisma.trackedUrl.findUnique({ where: { id: urlId } });

    if (trackedUrl && trackedUrl.stage !== 'in_progress') {
      // Get default review days from config, or use provided value, or default 21
      let days = reviewDays;
      if (!days) {
        const config = await prisma.config.findUnique({ where: { key: 'defaultReviewDays' } });
        days = config ? parseInt(config.value) : 21;
      }

      await prisma.trackedUrl.update({
        where: { id: urlId },
        data: {
          stage: 'in_review',
          reviewStartedAt: new Date(),
          reviewDays: days,
        },
      });
    }
  }

  return NextResponse.json(note, { status: 201 });
}
