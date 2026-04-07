import { prisma } from "@/lib/db";
import { normalizeUrl, pathMatchesArticle } from "@/lib/dataforseo";
import { NextResponse } from "next/server";

/**
 * POST /api/admin/normalize-rankings
 *
 * One-time migration: fixes historical snapshots where the article's URL
 * was misidentified due to strict path matching (e.g. /slug vs /post/slug).
 *
 * For each snapshot with serpPosition=null and non-empty otherUrls,
 * checks if any otherUrl matches the article's tracked URL. If so,
 * promotes it to the primary position and removes it from otherUrls.
 */
export async function POST() {
  const startTime = Date.now();
  const log = [];
  let fixed = 0;
  let scanned = 0;
  let skipped = 0;

  try {
    const trackedUrls = await prisma.trackedUrl.findMany({
      include: {
        keywords: {
          where: { tracked: true },
          select: { id: true, keyword: true },
        },
      },
    });

    log.push(`Loaded ${trackedUrls.length} tracked URLs`);

    for (const tu of trackedUrls) {
      if (!tu.url || tu.keywords.length === 0) continue;

      const articlePath = normalizeUrl(tu.url);
      if (!articlePath || articlePath.length <= 1) continue;

      const keywordIds = tu.keywords.map((k) => k.id);

      const snapshots = await prisma.snapshot.findMany({
        where: {
          keywordId: { in: keywordIds },
          otherUrls: { not: null },
        },
        orderBy: { date: "desc" },
      });

      for (const snap of snapshots) {
        scanned++;

        let others;
        try {
          others = JSON.parse(snap.otherUrls);
          if (!Array.isArray(others) || others.length === 0) continue;
        } catch {
          continue;
        }

        let matchedEntry = null;
        let matchedIndex = -1;

        for (let i = 0; i < others.length; i++) {
          const entry = others[i];
          if (!entry.url) continue;
          const entryPath = normalizeUrl(entry.url);
          if (pathMatchesArticle(entryPath, articlePath)) {
            matchedEntry = entry;
            matchedIndex = i;
            break;
          }
        }

        if (!matchedEntry) {
          skipped++;
          continue;
        }

        const remainingOthers = others.filter((_, i) => i !== matchedIndex);
        const newPosition = matchedEntry.position;
        const prevPos = snap.prevPosition || null;
        const posChange = prevPos && newPosition ? prevPos - newPosition : 0;

        const needsUpdate =
          snap.serpPosition === null ||
          (snap.serpPosition !== null && newPosition < snap.serpPosition);

        if (!needsUpdate) {
          skipped++;
          continue;
        }

        await prisma.snapshot.update({
          where: { id: snap.id },
          data: {
            serpPosition: newPosition,
            foundUrl: matchedEntry.url,
            posChange,
            otherUrls: remainingOthers.length > 0
              ? JSON.stringify(remainingOthers)
              : null,
          },
        });

        fixed++;
      }
    }

    // Second pass: fix posChange / prevPosition chain
    // After updating serpPosition, the posChange values for subsequent
    // snapshots may reference stale prevPosition values.
    let chainFixed = 0;

    for (const tu of trackedUrls) {
      if (!tu.url || tu.keywords.length === 0) continue;
      const keywordIds = tu.keywords.map((k) => k.id);

      for (const kwId of keywordIds) {
        const allSnaps = await prisma.snapshot.findMany({
          where: { keywordId: kwId },
          orderBy: { date: "asc" },
        });

        if (allSnaps.length < 2) continue;

        for (let i = 1; i < allSnaps.length; i++) {
          const prev = allSnaps[i - 1];
          const curr = allSnaps[i];

          const expectedPrev = prev.serpPosition || null;
          const expectedChange =
            expectedPrev && curr.serpPosition
              ? expectedPrev - curr.serpPosition
              : 0;

          if (
            curr.prevPosition !== expectedPrev ||
            curr.posChange !== expectedChange
          ) {
            await prisma.snapshot.update({
              where: { id: curr.id },
              data: {
                prevPosition: expectedPrev,
                posChange: expectedChange,
              },
            });
            chainFixed++;
          }
        }
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log.push(`Scanned ${scanned} snapshots with otherUrls`);
    log.push(`Fixed ${fixed} snapshots (promoted matching URL to primary position)`);
    log.push(`Skipped ${skipped} (no match or already correct)`);
    log.push(`Re-chained ${chainFixed} prevPosition/posChange values`);
    log.push(`Completed in ${duration}s`);

    return NextResponse.json({ ok: true, fixed, chainFixed, scanned, skipped, duration: `${duration}s`, log });
  } catch (error) {
    log.push(`ERROR: ${error.message}`);
    return NextResponse.json({ ok: false, error: error.message, log }, { status: 500 });
  }
}
