import { batchSerpPositions, PROVIDERS } from "@/lib/dataforseo";
import { prisma } from "@/lib/db";
import { sendMessage } from "@/lib/telegram";
import { getPageTraffic, getLastWeekRange } from "@/lib/gsc";
import { NextResponse } from "next/server";

const COST_PER_CALL = 0.0025;

// POST /api/cron — multi-locale, tier-based data collection
export async function POST(request) {
  const secret = request.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const log = [];
  let totalApiCalls = 0;
  let totalKeywordsProcessed = 0;
  let totalErrors = 0;

  // Create CronRun record
  const cronRun = await prisma.cronRun.create({
    data: { status: "running" },
  });

  try {
    // 1. Load config
    const configs = await prisma.config.findMany();
    const cfg = {};
    for (const c of configs) cfg[c.key] = c.value;

    const alertThreshold = parseInt(cfg.alertThreshold || "3");
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

    // 2. Load locale configs for language mapping
    const localeConfigs = await prisma.localeConfig.findMany({
      where: { enabled: true },
    });
    const localeMap = {};
    for (const lc of localeConfigs) {
      localeMap[lc.locale] = lc;
    }
    log.push(`Active locales: ${localeConfigs.map(l => l.locale).join(", ")}`);

    // 3. Auto-review expiry: move expired in_review locales to monitoring
    const expiredReviews = await prisma.$queryRaw`
      UPDATE tracked_urls
      SET stage = 'monitoring', review_started_at = NULL
      WHERE stage = 'in_review'
        AND review_started_at IS NOT NULL
        AND review_started_at + (review_days || ' days')::interval < NOW()
      RETURNING id, locale
    `;
    if (expiredReviews.length > 0) {
      log.push(`Auto-expired ${expiredReviews.length} review periods to monitoring`);
    }

    // 4. Load all locale variants with keywords, grouped by stage
    const locales = await prisma.trackedUrl.findMany({
      where: { trackingEnabled: true },
      include: {
        keywords: {
          where: { tracked: true },
          include: {
            snapshots: {
              orderBy: { date: "desc" },
              take: 1,
            },
          },
        },
        article: true,
      },
    });

    // 5. Filter by frequency tier
    const toProcess = [];
    const now = Date.now();

    for (const loc of locales) {
      if (loc.stage === "parked") continue;
      if (loc.keywords.length === 0) continue;

      // Daily: in_progress + in_review
      if (loc.stage === "in_progress" || loc.stage === "in_review") {
        toProcess.push(loc);
        continue;
      }

      // Check last snapshot age
      const lastSnapshot = loc.keywords[0]?.snapshots?.[0];
      const daysSince = lastSnapshot
        ? (now - lastSnapshot.date.getTime()) / (1000 * 60 * 60 * 24)
        : Infinity;

      // Monitoring: weekly
      if (loc.stage === "monitoring" && daysSince >= 7) {
        toProcess.push(loc);
        continue;
      }

      // Backlog: monthly
      if (loc.stage === "backlog" && daysSince >= 30) {
        toProcess.push(loc);
        continue;
      }
    }

    log.push(
      `Processing ${toProcess.length}/${locales.length} locale variants ` +
      `(${toProcess.filter(l => l.stage === "in_progress" || l.stage === "in_review").length} daily, ` +
      `${toProcess.filter(l => l.stage === "monitoring").length} weekly, ` +
      `${toProcess.filter(l => l.stage === "backlog").length} backlog)`
    );

    // 6. Group by (languageCode, countryCode) for efficient batching
    const batches = {};

    for (const loc of toProcess) {
      const lc = localeMap[loc.locale] || { languageCode: "en" };

      for (const kw of loc.keywords) {
        const countries = (kw.targetCountries || "us").split(",").map(c => c.trim());

        for (const country of countries) {
          const batchKey = `${lc.languageCode}:${country}`;

          if (!batches[batchKey]) {
            batches[batchKey] = {
              language: lc.languageCode,
              country,
              keywords: new Set(),
              kwMeta: [],
            };
          }

          batches[batchKey].keywords.add(kw.keyword);
          batches[batchKey].kwMeta.push({
            keyword: kw.keyword,
            keywordId: kw.id,
            localeId: loc.id,
            articleUrl: loc.url,
            prevSnapshot: kw.snapshots?.[0] || null,
          });
        }
      }
    }

    log.push(`Grouped into ${Object.keys(batches).length} language/country batches`);

    // 7. Process each batch
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const weekStarting = new Date(today);
    // Set to Monday of this week
    const day = weekStarting.getUTCDay();
    const diff = day === 0 ? 6 : day - 1;
    weekStarting.setUTCDate(weekStarting.getUTCDate() - diff);

    const movements = { drops: [], gains: [], top3: [] };

    for (const [batchKey, batch] of Object.entries(batches)) {
      const uniqueKeywords = [...batch.keywords];
      const apiCalls = uniqueKeywords.length;
      totalApiCalls += apiCalls;

      log.push(`Batch ${batchKey}: ${uniqueKeywords.length} unique keywords (${batch.kwMeta.length} total assignments)`);

      // Use the first locale's URL as articleUrl for the batch
      const firstArticleUrl = batch.kwMeta[0]?.articleUrl || null;

      let dfsData = {};
      try {
        dfsData = await batchSerpPositions({
          keywords: uniqueKeywords,
          targetDomain,
          country: batch.country,
          language: batch.language,
          articleUrl: firstArticleUrl,
          provider: PROVIDERS.DATAFORSEO,
        });
      } catch (e) {
        log.push(`ERROR batch ${batchKey}: ${e.message}`);
        totalErrors++;
        continue;
      }

      // 8. Write snapshots + SERP landscape data for each keyword assignment
      for (const meta of batch.kwMeta) {
        const dfs = dfsData[meta.keyword] || {};
        const prevPos = meta.prevSnapshot?.serpPosition || null;
        const currentPos = dfs.position || null;
        const posChange = prevPos && currentPos ? prevPos - currentPos : 0;

        try {
          const snapshot = await prisma.snapshot.upsert({
            where: {
              keywordId_countryCode_date: {
                keywordId: meta.keywordId,
                countryCode: batch.country,
                date: today,
              },
            },
            create: {
              keywordId: meta.keywordId,
              date: today,
              weekStarting,
              countryCode: batch.country,
              serpPosition: currentPos,
              serpFeatures: dfs.serpFeatures?.join(",") || null,
              prevPosition: prevPos,
              posChange,
              foundUrl: dfs.foundUrl || null,
              otherUrls: dfs.otherDomainUrls?.length ? JSON.stringify(dfs.otherDomainUrls) : null,
            },
            update: {
              serpPosition: currentPos,
              serpFeatures: dfs.serpFeatures?.join(",") || null,
              prevPosition: prevPos,
              posChange,
              foundUrl: dfs.foundUrl || null,
              otherUrls: dfs.otherDomainUrls?.length ? JSON.stringify(dfs.otherDomainUrls) : null,
            },
          });
          totalKeywordsProcessed++;

          // Save top-20 SERP results for landscape comparison
          if (dfs.top20?.length > 0) {
            await prisma.serpResult.deleteMany({ where: { snapshotId: snapshot.id } });
            await prisma.serpResult.createMany({
              data: dfs.top20.map((item) => ({
                snapshotId: snapshot.id,
                rank: item.rank,
                type: item.type,
                url: item.url,
                domain: item.domain,
                title: item.title,
              })),
            });
          }

          // Track notable movements for Telegram
          if (prevPos && currentPos) {
            if (posChange <= -alertThreshold) {
              movements.drops.push({ keyword: meta.keyword, country: batch.country, from: prevPos, to: currentPos });
            } else if (posChange >= alertThreshold) {
              movements.gains.push({ keyword: meta.keyword, country: batch.country, from: prevPos, to: currentPos });
            }
            if (prevPos > 3 && currentPos <= 3) {
              movements.top3.push({ keyword: meta.keyword, country: batch.country, from: prevPos, to: currentPos });
            }
          }
        } catch (e) {
          log.push(`Snapshot error (kw:${meta.keywordId}): ${e.message}`);
          totalErrors++;
        }
      }
    }

    // 9. GSC page-level traffic (free, stored per URL not per keyword)
    if (!process.env.GSC_CREDENTIALS || !process.env.GSC_PROPERTY) {
      log.push("GSC: SKIPPED — GSC_CREDENTIALS or GSC_PROPERTY not set");
    } else {
      try {
        const { startDate: gscStart, endDate: gscEnd } = getLastWeekRange();
        const processedUrls = new Set();
        let gscCount = 0;

        for (const loc of toProcess) {
          if (!loc.url || processedUrls.has(loc.id)) continue;
          processedUrls.add(loc.id);

          try {
            const traffic = await getPageTraffic({
              url: loc.url,
              startDate: gscStart,
              endDate: gscEnd,
            });

            if (!traffic) continue;

            await prisma.pageTraffic.upsert({
              where: { urlId_date: { urlId: loc.id, date: today } },
              create: {
                urlId: loc.id,
                date: today,
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
            gscCount++;
          } catch (gscErr) {
            log.push(`GSC skip ${loc.locale}: ${gscErr.message}`);
          }
        }

        if (gscCount > 0) log.push(`GSC: stored page traffic for ${gscCount} URLs`);
      } catch (gscGlobalErr) {
        log.push(`GSC global error: ${gscGlobalErr.message}`);
      }
    }

    // 10. Update CronRun
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const estimatedCost = totalApiCalls * COST_PER_CALL;

    await prisma.cronRun.update({
      where: { id: cronRun.id },
      data: {
        completedAt: new Date(),
        apiCalls: totalApiCalls,
        estimatedCost,
        keywordsProcessed: totalKeywordsProcessed,
        errors: totalErrors,
        status: "completed",
        log: JSON.stringify(log),
      },
    });

    // 11. Send Telegram summary
    const totalMovements = movements.drops.length + movements.gains.length + movements.top3.length;
    if (totalMovements > 0) {
      const lines = [
        `<b>Ranking Update</b>`,
        `${toProcess.length} locales | ${totalApiCalls} API calls | $${estimatedCost.toFixed(2)}`,
        "",
      ];

      if (movements.drops.length > 0) {
        lines.push(`<b>Drops (${movements.drops.length}):</b>`);
        for (const m of movements.drops.slice(0, 10)) {
          lines.push(`  ${m.keyword} [${m.country.toUpperCase()}]: #${m.from} → #${m.to}`);
        }
      }

      if (movements.gains.length > 0) {
        lines.push(`<b>Gains (${movements.gains.length}):</b>`);
        for (const m of movements.gains.slice(0, 10)) {
          lines.push(`  ${m.keyword} [${m.country.toUpperCase()}]: #${m.from} → #${m.to}`);
        }
      }

      if (movements.top3.length > 0) {
        lines.push(`<b>New Top 3:</b>`);
        for (const m of movements.top3) {
          lines.push(`  ${m.keyword} [${m.country.toUpperCase()}]: #${m.from} → #${m.to}`);
        }
      }

      lines.push("", `Done in ${duration}s`);

      try {
        await sendMessage(lines.join("\n"));
      } catch (e) {
        log.push(`Telegram error: ${e.message}`);
      }
    }

    log.push(`Done in ${duration}s | ${totalApiCalls} calls | $${estimatedCost.toFixed(2)}`);

    return NextResponse.json({
      ok: true,
      duration: `${duration}s`,
      apiCalls: totalApiCalls,
      estimatedCost,
      keywordsProcessed: totalKeywordsProcessed,
      errors: totalErrors,
      movements: {
        drops: movements.drops.length,
        gains: movements.gains.length,
        top3: movements.top3.length,
      },
      log,
    });
  } catch (error) {
    log.push(`FATAL ERROR: ${error.message}`);

    await prisma.cronRun.update({
      where: { id: cronRun.id },
      data: {
        completedAt: new Date(),
        status: "failed",
        errors: totalErrors + 1,
        log: JSON.stringify(log),
      },
    });

    return NextResponse.json(
      { ok: false, error: error.message, log },
      { status: 500 }
    );
  }
}
