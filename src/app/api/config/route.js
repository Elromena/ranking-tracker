import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/config — get all config
export async function GET() {
  const configs = await prisma.config.findMany();
  const result = {};
  for (const c of configs) {
    result[c.key] = c.value;
  }
  return NextResponse.json(result);
}

// PUT /api/config — save config (bulk upsert)
export async function PUT(request) {
  try {
    const body = await request.json();

    // Validate that body is an object
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { ok: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Upsert each key-value pair
    const operations = Object.entries(body).map(([key, value]) =>
      prisma.config.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) },
      })
    );

    await prisma.$transaction(operations);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Config save error:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error.message || 'Failed to save configuration',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
