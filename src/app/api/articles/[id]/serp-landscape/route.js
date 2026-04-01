import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * GET /api/articles/[id]/serp-landscape?keywordId=X&dateA=YYYY-MM-DD&dateB=YYYY-MM-DD
 *
 * Returns the top-20 SERP results for a keyword on two selected dates,
 * plus the target domain for highlighting.
 */
export async function GET(request, { params }) {
  const articleId = parseInt(params.id);
  if (isNaN(articleId)) {
    return NextResponse.json({ error: "Invalid article ID" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const keywordId = parseInt(searchParams.get("keywordId"));
  const dateA = searchParams.get("dateA");
  const dateB = searchParams.get("dateB");

  if (!keywordId || !dateA || !dateB) {
    return NextResponse.json(
      { error: "keywordId, dateA, and dateB are required" },
      { status: 400 }
    );
  }

  try {
    // Verify keyword belongs to this article
    const keyword = await prisma.keyword.findFirst({
      where: {
        id: keywordId,
        trackedUrl: { articleId },
      },
      select: { id: true, keyword: true },
    });

    if (!keyword) {
      return NextResponse.json({ error: "Keyword not found for this article" }, { status: 404 });
    }

    // Get target domain from config
    const domainConfig = await prisma.config.findUnique({ where: { key: "targetDomain" } });
    const ourDomain = domainConfig?.value
      ?.replace("sc-domain:", "")
      .replace("https://", "")
      .replace("http://", "")
      .replace("www.", "")
      .replace(/\/$/, "") || "";

    // Find snapshots closest to the requested dates
    const dateAStart = new Date(dateA);
    dateAStart.setUTCHours(0, 0, 0, 0);
    const dateAEnd = new Date(dateA);
    dateAEnd.setUTCHours(23, 59, 59, 999);

    const dateBStart = new Date(dateB);
    dateBStart.setUTCHours(0, 0, 0, 0);
    const dateBEnd = new Date(dateB);
    dateBEnd.setUTCHours(23, 59, 59, 999);

    const [snapshotA, snapshotB] = await Promise.all([
      prisma.snapshot.findFirst({
        where: {
          keywordId,
          date: { gte: dateAStart, lte: dateAEnd },
        },
        include: {
          serpResults: { orderBy: { rank: "asc" } },
        },
        orderBy: { date: "desc" },
      }),
      prisma.snapshot.findFirst({
        where: {
          keywordId,
          date: { gte: dateBStart, lte: dateBEnd },
        },
        include: {
          serpResults: { orderBy: { rank: "asc" } },
        },
        orderBy: { date: "desc" },
      }),
    ]);

    // If exact dates don't have data, find the nearest snapshots with SERP results
    const [resolvedA, resolvedB] = await Promise.all([
      snapshotA?.serpResults?.length
        ? snapshotA
        : prisma.snapshot.findFirst({
            where: {
              keywordId,
              date: { lte: dateAEnd },
              serpResults: { some: {} },
            },
            include: { serpResults: { orderBy: { rank: "asc" } } },
            orderBy: { date: "desc" },
          }),
      snapshotB?.serpResults?.length
        ? snapshotB
        : prisma.snapshot.findFirst({
            where: {
              keywordId,
              date: { lte: dateBEnd },
              serpResults: { some: {} },
            },
            include: { serpResults: { orderBy: { rank: "asc" } } },
            orderBy: { date: "desc" },
          }),
    ]);

    // Get all available dates for this keyword (that have SERP results)
    const availableDates = await prisma.snapshot.findMany({
      where: {
        keywordId,
        serpResults: { some: {} },
      },
      select: { date: true },
      orderBy: { date: "desc" },
      take: 90,
    });

    return NextResponse.json({
      keyword: keyword.keyword,
      ourDomain,
      dateA: resolvedA
        ? {
            date: resolvedA.date.toISOString().split("T")[0],
            serpPosition: resolvedA.serpPosition,
            foundUrl: resolvedA.foundUrl,
            results: resolvedA.serpResults.map((r) => ({
              rank: r.rank,
              type: r.type,
              url: r.url,
              domain: r.domain,
              title: r.title,
            })),
          }
        : null,
      dateB: resolvedB
        ? {
            date: resolvedB.date.toISOString().split("T")[0],
            serpPosition: resolvedB.serpPosition,
            foundUrl: resolvedB.foundUrl,
            results: resolvedB.serpResults.map((r) => ({
              rank: r.rank,
              type: r.type,
              url: r.url,
              domain: r.domain,
              title: r.title,
            })),
          }
        : null,
      availableDates: availableDates.map((d) => d.date.toISOString().split("T")[0]),
    });
  } catch (error) {
    console.error("SERP landscape error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
