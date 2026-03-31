import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

const VALID_STAGES = ['backlog', 'in_progress', 'in_review', 'monitoring', 'parked'];

// PUT /api/articles/[id]/locales/[localeId]/stage — change pipeline stage
export async function PUT(request, { params }) {
  const { localeId } = await params;
  const body = await request.json();
  const { stage, reviewDays } = body;

  if (!VALID_STAGES.includes(stage)) {
    return NextResponse.json(
      { error: `Invalid stage. Must be one of: ${VALID_STAGES.join(', ')}` },
      { status: 400 }
    );
  }

  const data = { stage };

  // Set review tracking when entering in_review
  if (stage === 'in_review') {
    data.reviewStartedAt = new Date();
    if (reviewDays) data.reviewDays = reviewDays;
  }

  // Clear review tracking when leaving in_review
  if (stage !== 'in_review') {
    data.reviewStartedAt = null;
  }

  const updated = await prisma.trackedUrl.update({
    where: { id: parseInt(localeId) },
    data,
  });

  return NextResponse.json(updated);
}
