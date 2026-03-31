import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { batchSerpPositions, getHistoricalSerpPositions } from "@/lib/dataforseo";

let getPageTraffic, formatDate;
try {
  const gsc = await import("@/lib/gsc");
  getPageTraffic = gsc.getPageTraffic;
  formatDate = gsc.formatDate;
} catch (e) {
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

    const rawDomain = cfg.targetDomain;
    if (!rawDomain) {
      throw new Error("Target domain is not configured. Set it in Settings → API Credentials → Target Domain.");
    }
    const targetDomain = rawDomain
      .replace("sc-domain:", "")
      .replace("https://", "")
      .replace("http://", "")
      .replace("www.", "")
      .replace(/\/$/, "");

    log.push(`Target domain: ${targetDomain}`);

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

      // The actual date for the snapshot (Wednesday of that week)
      const snapshotDate = new Date(weekStarting);
      snapshotDate.setDate(snapshotDate.getDate() + 3);
      snapshotDate.setUTCHours(0, 0, 0, 0);

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

        // 4b. Pull page-level GSC traffic (OPTIONAL)
        if (getPageTraffic) {
          try {
            const traffic = await getPageTraffic({
              url: url.url,
              startDate: formatDate(startDate),
              endDate: formatDate(endDate),
            });
            if (traffic) {
              await prisma.pageTraffic.upsert({
                where: { urlId_date: { urlId: url.id, date: snapshotDate } },
                create: {
                  urlId: url.id,
                  date: snapshotDate,
                  clicks: traffic.clicks || 0,
                  impressions: traffic.impressions || 0,
                  ctr: traffic.ctr || null,
                  position: traffic.position || null,
                },
                update: {
                  clicks: traffic.clicks || 0,
                  impressions: traffic.impressions || 0,
                  ctr: traffic.ctr || null,
                  position: traffic.position || null,
                },
              });
              log.push(`  ${url.title}: GSC page traffic stored`);
            }
          } catch (e) {
            log.push(`  ${url.title}: GSC skipped - ${e.message}`);
          }
        }

        // 4c. Get previous week's snapshot for comparison
        const prevWeekStart = new Date(weekStarting);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);

        const prevSnapshots = await prisma.snapshot.findMany({
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
          const prevSnapshot = prevSnapshotMap[kw.id];

          // PRIMARY: DataForSEO SERP position
          const prevPos = prevSnapshot?.serpPosition || null;
          const currentPos = dfs.position || null;
          const posChange = prevPos && currentPos ? prevPos - currentPos : 0;

          // Check if snapshot already exists (using new unique constraint)
          const existing = await prisma.snapshot.findUnique({
            where: {
              keywordId_countryCode_date: {
                keywordId: kw.id,
                countryCode: country,
                date: snapshotDate,
              },
            },
          });

          if (existing) {
            skippedSnapshots++;
            continue; // Don't overwrite existing data
          }

          await prisma.snapshot.create({
            data: {
              keywordId: kw.id,
              date: snapshotDate,
              weekStarting,
              countryCode: country,
              // PRIMARY: DataForSEO SERP data
              serpPosition: currentPos,
              serpFeatures: dfs.serpFeatures?.join(",") || null,
              prevPosition: prevPos,
              posChange,
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
