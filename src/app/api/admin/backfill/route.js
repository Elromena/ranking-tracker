import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { batchSerpPositions, getHistoricalSerpPositions } from "@/lib/dataforseo";

// GSC is optional - only for traffic data
let getSearchAnalytics, formatDate;
try {
  const gsc = await import("@/lib/gsc");
  getSearchAnalytics = gsc.getSearchAnalytics;
  formatDate = gsc.formatDate;
} catch (e) {
  // Fallback formatDate if GSC not available
  formatDate = (date) => date.toISOString().split('T')[0];
  console.log("GSC module not available, using DataForSEO only");
}

/**
 * POST /api/admin/backfill
 * Backfill historical data for the last N weeks
 * 
 * Body: { 
 *   weeksBack: 4, 
 *   urlId: null (optional - for specific URL only),
 *   useHistoricalSerp: true (use DataForSEO historical API - costs more but accurate)
 * }
 */
export async function POST(request) {
  const startTime = Date.now();
  const log = [];

  try {
    const body = await request.json();
    const weeksBack = parseInt(body.weeksBack || "4");
    const urlId = body.urlId || null;
    const useHistoricalSerp = body.useHistoricalSerp !== false; // Default to true

    log.push(`Starting backfill for last ${weeksBack} weeks`);
    log.push(`Using ${useHistoricalSerp ? 'DataForSEO historical SERP' : 'GSC average position'} for past weeks`);

    // 1. Load config
    const configs = await prisma.config.findMany();
    const cfg = {};
    for (const c of configs) cfg[c.key] = c.value;

    const country = cfg.dfsCountry || "us";
    const language = cfg.dfsLanguage || "en";
    const targetDomain = (cfg.gscProperty || process.env.GSC_PROPERTY || "")
      .replace("https://", "")
      .replace("http://", "")
      .replace(/\/$/, "");

    // 2. Get URLs to process
    let urls;
    if (urlId) {
      urls = await prisma.trackedUrl.findMany({
        where: { id: parseInt(urlId) },
        include: {
          keywords: {
            where: { tracked: true },
          },
        },
      });
      log.push(`Processing single URL: ${urls[0]?.title || 'Not found'}`);
    } else {
      urls = await prisma.trackedUrl.findMany({
        include: {
          keywords: {
            where: { tracked: true },
          },
        },
      });
      log.push(`Processing ${urls.length} URLs`);
    }

    // 3. Loop through each week backwards
    let totalSnapshots = 0;
    let skippedSnapshots = 0;

    for (let weekOffset = 0; weekOffset < weeksBack; weekOffset++) {
      const weekStarting = new Date();
      // Get Monday of the week
      weekStarting.setDate(
        weekStarting.getDate() - weekStarting.getDay() + 1 - (weekOffset * 7)
      );
      weekStarting.setHours(0, 0, 0, 0);

      // Calculate date range for GSC (7 days, accounting for 3-day delay)
      const endDate = new Date(weekStarting);
      endDate.setDate(endDate.getDate() + 6 - 3); // End of week minus 3 day delay
      
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 7);

      log.push(
        `\nWeek ${weekOffset + 1}: ${formatDate(weekStarting)} (GSC: ${formatDate(startDate)} to ${formatDate(endDate)})`
      );

      // 4. Process each URL for this week
      for (const url of urls) {
        const kwStrings = url.keywords.map((k) => k.keyword);
        if (kwStrings.length === 0) {
          log.push(`  ${url.title}: No keywords to track`);
          continue;
        }

        // 4a. Pull DataForSEO positions (PRIMARY SOURCE)
        let dfsData = {};
        if (weekOffset === 0 || useHistoricalSerp) {
          try {
            if (weekOffset === 0) {
              // Current week: Use live SERP
              dfsData = await batchSerpPositions({
                keywords: kwStrings,
                targetDomain,
                country,
                language,
              });
              log.push(`  ${url.title}: DFS live returned ${Object.keys(dfsData).length} positions`);
            } else {
              // Historical week: Use historical SERP API
              // Use the middle of the week for the snapshot
              const snapshotDate = new Date(weekStarting);
              snapshotDate.setDate(snapshotDate.getDate() + 3); // Wednesday of that week
              
              dfsData = await getHistoricalSerpPositions({
                keywords: kwStrings,
                targetDomain,
                date: formatDate(snapshotDate),
                country,
                language,
              });
              log.push(`  ${url.title}: DFS historical (${formatDate(snapshotDate)}) returned ${Object.keys(dfsData).length} positions`);
            }
          } catch (e) {
            log.push(`  ${url.title}: DFS error - ${e.message}`);
          }
        } else {
          log.push(`  ${url.title}: Skipping DFS for historical week (using GSC position only)`);
        }

        // 4b. Pull GSC traffic data (OPTIONAL)
        let gscData = {};
        if (getSearchAnalytics) {
          try {
            const gscResults = await getSearchAnalytics({
              url: url.url,
              startDate: formatDate(startDate),
              endDate: formatDate(endDate),
              keywords: kwStrings,
            });
            for (const r of gscResults) {
              gscData[r.keyword.toLowerCase()] = r;
            }
            log.push(`  ${url.title}: GSC traffic data - ${gscResults.length} keywords`);
          } catch (e) {
            log.push(`  ${url.title}: GSC skipped - ${e.message}`);
          }
        }

        // 4c. Get previous week's snapshot for comparison
        const prevWeekStart = new Date(weekStarting);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);

        const prevSnapshots = await prisma.weeklySnapshot.findMany({
          where: {
            weekStarting: prevWeekStart,
            keyword: {
              urlId: url.id,
            },
          },
        });

        const prevSnapshotMap = {};
        for (const s of prevSnapshots) {
          prevSnapshotMap[s.keywordId] = s;
        }

        // 4d. Create or update snapshots
        for (const kw of url.keywords) {
          const dfs = dfsData[kw.keyword] || {};
          const gsc = gscData[kw.keyword.toLowerCase()] || {};
          const prevSnapshot = prevSnapshotMap[kw.id];
          
          // PRIMARY: DataForSEO SERP position
          const prevPos = prevSnapshot?.serpPosition || null;
          const currentPos = dfs.position || null;
          const posChange = prevPos && currentPos ? prevPos - currentPos : 0;

          // Check if snapshot already exists
          const existing = await prisma.weeklySnapshot.findUnique({
            where: {
              keywordId_weekStarting: {
                keywordId: kw.id,
                weekStarting,
              },
            },
          });

          if (existing) {
            skippedSnapshots++;
            continue; // Don't overwrite existing data
          }

          await prisma.weeklySnapshot.create({
            data: {
              keywordId: kw.id,
              weekStarting,
              // PRIMARY: DataForSEO SERP data
              serpPosition: currentPos,
              serpFeatures: dfs.serpFeatures?.join(",") || null,
              prevPosition: prevPos,
              posChange,
              // OPTIONAL: GSC traffic data
              gscPosition: gsc.position || null,
              gscClicks: gsc.clicks || 0,
              gscImpressions: gsc.impressions || 0,
              gscCtr: gsc.ctr || null,
            },
          });

          totalSnapshots++;
        }
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log.push(
      `\nCompleted in ${duration}s - Created ${totalSnapshots} snapshots, skipped ${skippedSnapshots} existing`
    );

    return NextResponse.json({
      ok: true,
      duration: `${duration}s`,
      snapshotsCreated: totalSnapshots,
      snapshotsSkipped: skippedSnapshots,
      weeksProcessed: weeksBack,
      log,
    });
  } catch (error) {
    log.push(`FATAL ERROR: ${error.message}`);
    return NextResponse.json(
      { ok: false, error: error.message, log },
      { status: 500 }
    );
  }
}
