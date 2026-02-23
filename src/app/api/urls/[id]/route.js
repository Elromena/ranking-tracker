import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/urls/[id] — get full detail for one URL
// export async function GET(request, { params }) {
//   const id = parseInt(params.id);

//   const url = await prisma.trackedUrl.findUnique({
//     where: { id },
//     include: {
//       keywords: {
//         include: {
//           snapshots: {
//             orderBy: { weekStarting: 'desc' },
//             take: 52, // up to a year of weekly data
//           },
//           alerts: {
//             orderBy: { alertDate: 'desc' },
//           },
//         },
//       },
//       notes: {
//         orderBy: { createdAt: 'desc' },
//       },
//     },
//   });

//   if (!url) {
//     return NextResponse.json({ error: 'Not found' }, { status: 404 });
//   }

//   return NextResponse.json(url);
// }

export async function GET(request, { params }) {
  const id = parseInt(params.id);
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "daily";
  const days = parseInt(searchParams.get("days")) || 7; // Default to 7 days

  console.log(period, "days:", days);

  const now = new Date();
  const startDate = new Date();

  // Reset to midnight UTC
  startDate.setUTCHours(0, 0, 0, 0);

  if (period === "weekly") {
    // Go back ~8 weeks
    startDate.setUTCDate(startDate.getUTCDate() - 56);
  } else {
    // Go back `days` amount
    startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
  }

  const url = await prisma.trackedUrl.findUnique({
    where: { id },
    include: {
      keywords: {
        include: {
          snapshots: {
            where: {
              weekStarting: {
                gte: startDate,
                lte: now,
              },
            },
            orderBy: { weekStarting: "asc" },
          },
          alerts: {
            orderBy: { alertDate: "desc" },
          },
        },
      },
      notes: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!url) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...url,
    meta: {
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
    },
  });
}

// PUT /api/urls/[id] — update URL metadata + keywords
export async function PUT(request, { params }) {
  const id = parseInt(params.id);
  const body = await request.json();
  const { title, category, status, priority, url: newUrl, keywords } = body;

  // Update the URL record
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (category !== undefined) updateData.category = category;
  if (status !== undefined) updateData.status = status;
  if (priority !== undefined) updateData.priority = priority;
  if (newUrl !== undefined) updateData.url = newUrl;

  const updated = await prisma.trackedUrl.update({
    where: { id },
    data: updateData,
  });

  // If keywords provided, sync them
  if (keywords && Array.isArray(keywords)) {
    // Get existing keywords
    const existing = await prisma.keyword.findMany({ where: { urlId: id } });
    const existingMap = new Map(existing.map((k) => [k.keyword, k]));

    for (const kw of keywords) {
      const kwLower = kw.keyword.toLowerCase().trim();
      if (existingMap.has(kwLower)) {
        // Update existing
        await prisma.keyword.update({
          where: { id: existingMap.get(kwLower).id },
          data: {
            source: kw.source || "manual",
            intent: kw.intent || "commercial",
            tracked: kw.tracked !== false,
          },
        });
        existingMap.delete(kwLower);
      } else {
        // Create new
        await prisma.keyword.create({
          data: {
            urlId: id,
            keyword: kwLower,
            source: kw.source || "manual",
            intent: kw.intent || "commercial",
            tracked: kw.tracked !== false,
          },
        });
      }
    }

    // Delete keywords that weren't in the update
    // (only if keywords array was explicitly passed)
    const toDelete = [...existingMap.values()];
    if (toDelete.length > 0) {
      await prisma.keyword.deleteMany({
        where: { id: { in: toDelete.map((k) => k.id) } },
      });
    }
  }

  // Fetch and return updated record
  const result = await prisma.trackedUrl.findUnique({
    where: { id },
    include: { keywords: true, notes: true },
  });

  return NextResponse.json(result);
}

// DELETE /api/urls/[id] — delete URL and all related data (cascade)
export async function DELETE(request, { params }) {
  const id = parseInt(params.id);

  await prisma.trackedUrl.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
