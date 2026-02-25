import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

// POST /api/urls/[id]/notes — add a note to a URL's changelog
export async function POST(request, { params }) {
  const urlId = parseInt(params.id);
  const { text, createdAt } = await request.json();

  if (!text) {
    return NextResponse.json({ error: 'text required' }, { status: 400 });
  }

  const data = { urlId, text };
  
  if (createdAt) {
    data.createdAt = new Date(createdAt);
  }

  const note = await prisma.note.create({
    data,
  });

  return NextResponse.json(note, { status: 201 });
}
