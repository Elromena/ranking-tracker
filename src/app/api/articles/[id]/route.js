import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/articles/[id] — full article detail with all locales
export async function GET(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');
  const country = searchParams.get('country');
  const localeFilter = searchParams.get('locale');

  const since = new Date();
  since.setDate(since.getDate() - days);

  const snapshotWhere = { date: { gte: since } };
  if (country) snapshotWhere.countryCode = country;

  const article = await prisma.article.findUnique({
    where: { id: parseInt(id) },
    include: {
      locales: {
        where: localeFilter ? { locale: localeFilter } : {},
        include: {
          keywords: {
            select: {
              id: true,
              keyword: true,
              source: true,
              intent: true,
              tracked: true,
              targetCountries: true,
              snapshots: {
                where: snapshotWhere,
                orderBy: { date: 'desc' },
                take: days + 10,
                select: {
                  id: true,
                  date: true,
                  countryCode: true,
                  serpPosition: true,
                  prevPosition: true,
                  posChange: true,
                  serpFeatures: true,
                },
              },
            },
          },
          pageTraffic: {
            where: { date: { gte: since } },
            orderBy: { date: 'desc' },
            select: {
              date: true,
              clicks: true,
              impressions: true,
              ctr: true,
              position: true,
            },
          },
          notes: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
        },
      },
    },
  });

  if (!article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  return NextResponse.json(article);
}

// PUT /api/articles/[id] — update article metadata
export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const { title, category, slug } = body;

  const data = {};
  if (title !== undefined) data.title = title;
  if (category !== undefined) data.category = category;
  if (slug !== undefined) data.slug = slug;

  const updated = await prisma.article.update({
    where: { id: parseInt(id) },
    data,
    include: { locales: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/articles/[id] — cascade delete
export async function DELETE(request, { params }) {
  const { id } = await params;

  await prisma.article.delete({
    where: { id: parseInt(id) },
  });

  return NextResponse.json({ ok: true });
}
