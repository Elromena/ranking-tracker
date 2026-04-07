import { batchSerpPositions, PROVIDERS, normalizeUrl, pathMatchesArticle } from "@/lib/dataforseo";
import { prisma } from "@/lib/db";
import { getPageTraffic, getLastWeekRange } from "@/lib/gsc";
import { NextResponse } from "next/server";

const COST_PER_CALL = 0.0025;

/**
 * POST /api/articles/[id]/check-rankings
 * Manually trigger a ranking check for all locales of a specific article.
 * Bypasses the stage-based frequency filter — always checks immediately.
 */
export async function POST(request, { params }) {
  const articleId = parseInt(params.id);
  if (isNaN(articleId)) {
    return NextResponse.json({ error: "Invalid article ID" }, { status: 400 });
  }

  const startTime = Date.now();
  const log = [];
  let totalApiCalls = 0;
  let totalKeywordsProcessed = 0;
  let totalErrors = 0;

  try {
    const configs = await prisma.config.findMany();
    const cfg = {};
    for (const c of configs) cfg[c.key] = c.value;

    const rawDomain = cfg.targetDomain;
    if (!rawDomain) {
      return NextResponse.json(
        { error: "Target domain not configured. Set it in Settings." },
        { status: 400 }
      );
    }
    const targetDomain = rawDomain
      .replace("sc-domain:", "")
      .replace("https://", "")
      .replace("http://", "")
      .replace("www.", "")
      .replace(/\/$/, "");

    const localeConfigs = await prisma.localeConfig.findMany({ where: { enabled: true } });
    const localeMap = {};
    for (const lc of localeConfigs) localeMap[lc.locale] = lc;

    const locales = await prisma.trackedUrl.findMany({
      where: { articleId, trackingEnabled: true },
      include: {
        keywords: {
          where: { tracked: true },
          include: {
            snapshots: { orderBy: { date: "desc" }, take: 1 },
          },
        },
        article: true,
      },
    });

    if (locales.length === 0) {
      return NextResponse.json(
        { error: "No active locales found for this article" },
        { status: 404 }
      );
    }

    log.push(`Checking ${locales.length} locale(s) for "${locales[0]?.article?.title}"`);

    const batches = {};
    for (const loc of locales) {
      const lc = localeMap[loc.locale] || { languageCode: "en" };
      for (const kw of loc.keywords) {
        const countries = (kw.targetCountries || "us").split(",").map((c) => c.trim());
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

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const weekStarting = new Date(today);
    const day = weekStarting.getUTCDay();
    const diff = day === 0 ? 6 : day - 1;
    weekStarting.setUTCDate(weekStarting.getUTCDate() - diff);

    for (const [batchKey, batch] of Object.entries(batches)) {
      const uniqueKeywords = [...batch.keywords];
      totalApiCalls += uniqueKeywords.length;

      const articleUrlMap = {};
      for (const meta of batch.kwMeta) {
        if (meta.articleUrl && !articleUrlMap[meta.keyword]) {
          articleUrlMap[meta.keyword] = meta.articleUrl;
        }
      }

      let dfsData = {};
      try {
        dfsData = await batchSerpPositions({
          keywords: uniqueKeywords,
          targetDomain,
          country: batch.country,
          language: batch.language,
          articleUrlMap,
          provider: PROVIDERS.DATAFORSEO,
        });
      } catch (e) {
        log.push(`ERROR batch ${batchKey}: ${e.message}`);
        totalErrors++;
        continue;
      }

      for (const meta of batch.kwMeta) {
        const dfs = dfsData[meta.keyword] || {};

        let currentPos = dfs.position ?? null;
        let matchedFoundUrl = dfs.foundUrl || null;
        let metaOtherUrls = dfs.otherDomainUrls || [];

        const metaArticlePath = meta.articleUrl ? normalizeUrl(meta.articleUrl) : null;
        const batchArticlePath = articleUrlMap[meta.keyword] ? normalizeUrl(articleUrlMap[meta.keyword]) : null;

        if (metaArticlePath && batchArticlePath && metaArticlePath !== batchArticlePath) {
          currentPos = null;
          matchedFoundUrl = null;
          metaOtherUrls = [];

          const allMatches = dfs.allDomainUrls || [];
          for (const match of allMatches) {
            const matchPath = normalizeUrl(match.url);
            if (pathMatchesArticle(matchPath, metaArticlePath)) {
              if (currentPos === null) {
                currentPos = match.position;
                matchedFoundUrl = match.url;
              }
            } else {
              metaOtherUrls.push(match);
            }
          }
        }

        const prevPos = meta.prevSnapshot?.serpPosition || null;
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
              foundUrl: matchedFoundUrl,
              otherUrls: metaOtherUrls.length ? JSON.stringify(metaOtherUrls) : null,
            },
            update: {
              serpPosition: currentPos,
              serpFeatures: dfs.serpFeatures?.join(",") || null,
              prevPosition: prevPos,
              posChange,
              foundUrl: matchedFoundUrl,
              otherUrls: metaOtherUrls.length ? JSON.stringify(metaOtherUrls) : null,
            },
          });
          totalKeywordsProcessed++;

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
        } catch (e) {
          log.push(`Snapshot error (kw:${meta.keywordId}): ${e.message}`);
          totalErrors++;
        }
      }
    }

    // GSC page-level traffic
    if (process.env.GSC_CREDENTIALS && process.env.GSC_PROPERTY) {
      try {
        const { startDate: gscStart, endDate: gscEnd } = getLastWeekRange();
        for (const loc of locales) {
          if (!loc.url) continue;
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
          } catch (gscErr) {
            log.push(`GSC skip ${loc.locale}: ${gscErr.message}`);
          }
        }
      } catch (gscErr) {
        log.push(`GSC error: ${gscErr.message}`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const estimatedCost = totalApiCalls * COST_PER_CALL;

    return NextResponse.json({
      ok: true,
      duration: `${duration}s`,
      apiCalls: totalApiCalls,
      keywordsProcessed: totalKeywordsProcessed,
      estimatedCost: `$${estimatedCost.toFixed(4)}`,
      errors: totalErrors,
      log,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message, log },
      { status: 500 }
    );
  }
}
