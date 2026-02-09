import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getSearchAnalytics, getLastWeekRange, getTopQueries } from "@/lib/gsc";
import { batchSerpPositions } from "@/lib/dataforseo";

/**
 * POST /api/admin/trigger-url
 * Trigger data collection for a specific URL
 * 
 * Body: { urlId: 123 }
 */
export async function POST(request) {
  const startTime = Date.now();
  const log = [];
  const newAlerts = { critical: [], warning: [], positive: [] };

  try {
    const body = await request.json();
    const urlId = parseInt(body.urlId);

    if (!urlId) {
      return NextResponse.json(
        { ok: false, error: "urlId is required" },
        { status: 400 }
      );
    }

    // 1. Load config
    const configs = await prisma.config.findMany();
    const cfg = {};
    for (const c of configs) cfg[c.key] = c.value;

    const country = cfg.dfsCountry || "us";
    const language = cfg.dfsLanguage || "en";
    const alertThreshold = parseInt(cfg.alertThreshold || "3");
    const autoAddGsc = cfg.autoAddGsc !== "false";
    const autoAddMinImpr = parseInt(cfg.autoAddMinImpr || "100");
    const maxKwPerUrl = parseInt(cfg.maxKwPerUrl || "10");

    // Extract clean domain for DataForSEO matching
    const rawDomain = cfg.targetDomain || cfg.gscProperty || process.env.GSC_PROPERTY || "";
    const targetDomain = rawDomain
      .replace("sc-domain:", "")
      .replace("https://", "")
      .replace("http://", "")
      .replace("www.", "")
      .replace(/\/$/, "");
    
    log.push(`Target domain: ${targetDomain}`);

    // 2. Get the specific URL with its keywords
    const url = await prisma.trackedUrl.findUnique({
      where: { id: urlId },
      include: {
        keywords: {
          where: { tracked: true },
          include: {
            snapshots: {
              orderBy: { weekStarting: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!url) {
      return NextResponse.json(
        { ok: false, error: `URL with ID ${urlId} not found` },
        { status: 404 }
      );
    }

    log.push(`Processing: ${url.title}`);
    log.push(`Keywords: ${url.keywords.length} active`);

    const weekStarting = new Date();
    weekStarting.setDate(weekStarting.getDate() - weekStarting.getDay() + 1); // Monday
    weekStarting.setHours(0, 0, 0, 0);

    const { startDate, endDate } = getLastWeekRange();
    log.push(`Date range: ${startDate} to ${endDate}`);

    const kwStrings = url.keywords.map((k) => k.keyword);

    // 3a. Pull GSC data
    let gscData = {};
    try {
      const gscResults = await getSearchAnalytics({
        url: url.url,
        startDate,
        endDate,
        keywords: kwStrings,
      });
      for (const r of gscResults) {
        gscData[r.keyword.toLowerCase()] = r;
      }
      log.push(`✓ GSC: ${gscResults.length} keyword results`);
    } catch (e) {
      log.push(`✗ GSC ERROR: ${e.message}`);
    }

    // 3b. Pull DataForSEO positions
    let dfsData = {};
    try {
      dfsData = await batchSerpPositions({
        keywords: kwStrings,
        targetDomain,
        country,
        language,
      });
      log.push(`✓ DFS: ${Object.keys(dfsData).length} keyword results`);
    } catch (e) {
      log.push(`✗ DFS ERROR: ${e.message}`);
    }

    // 3c. Write snapshots and detect alerts
    let snapshotsCreated = 0;
    for (const kw of url.keywords) {
      const gsc = gscData[kw.keyword.toLowerCase()] || {};
      const dfs = dfsData[kw.keyword] || {};
      const prevSnapshot = kw.snapshots?.[0];
      const prevPos = prevSnapshot?.serpPosition || null;
      const currentPos = dfs.position || null;
      const posChange = prevPos && currentPos ? prevPos - currentPos : 0;

      // Write snapshot
      await prisma.weeklySnapshot.upsert({
        where: {
          keywordId_weekStarting: {
            keywordId: kw.id,
            weekStarting,
          },
        },
        create: {
          keywordId: kw.id,
          weekStarting,
          gscPosition: gsc.position || null,
          gscClicks: gsc.clicks || 0,
          gscImpressions: gsc.impressions || 0,
          gscCtr: gsc.ctr || null,
          serpPosition: currentPos,
          serpFeatures: dfs.serpFeatures?.join(",") || null,
          prevPosition: prevPos,
          posChange,
        },
        update: {
          gscPosition: gsc.position || null,
          gscClicks: gsc.clicks || 0,
          gscImpressions: gsc.impressions || 0,
          gscCtr: gsc.ctr || null,
          serpPosition: currentPos,
          serpFeatures: dfs.serpFeatures?.join(",") || null,
          prevPosition: prevPos,
          posChange,
        },
      });

      snapshotsCreated++;

      // 3d. Detect alerts
      if (prevPos && currentPos) {
        const drop = currentPos - prevPos;

        // Left page 1
        if (prevPos <= 10 && currentPos > 10) {
          const alert = {
            keywordId: kw.id,
            type: "left_page1",
            severity: "critical",
            details: `#${prevPos} → #${currentPos}. Lost page 1.`,
            keyword: kw.keyword,
            urlTitle: url.title,
          };
          await prisma.alert.create({
            data: {
              keywordId: alert.keywordId,
              type: alert.type,
              severity: alert.severity,
              details: alert.details,
            },
          });
          newAlerts.critical.push(alert);
        }
        // Big drop
        else if (drop >= alertThreshold) {
          const severity = drop >= alertThreshold * 2 ? "critical" : "warning";
          const alert = {
            keywordId: kw.id,
            type: "position_drop",
            severity,
            details: `#${prevPos} → #${currentPos} (-${drop})`,
            keyword: kw.keyword,
            urlTitle: url.title,
          };
          await prisma.alert.create({
            data: {
              keywordId: alert.keywordId,
              type: alert.type,
              severity: alert.severity,
              details: alert.details,
            },
          });
          newAlerts[severity].push(alert);
        }
        // Big gain
        else if (drop <= -alertThreshold) {
          const alert = {
            keywordId: kw.id,
            type: "recovery",
            severity: "positive",
            details: `#${prevPos} → #${currentPos} (+${Math.abs(drop)})`,
            keyword: kw.keyword,
            urlTitle: url.title,
          };
          await prisma.alert.create({
            data: {
              keywordId: alert.keywordId,
              type: alert.type,
              severity: alert.severity,
              details: alert.details,
            },
          });
          newAlerts.positive.push(alert);
        }
        // Entered top 3
        else if (prevPos > 3 && currentPos <= 3) {
          const alert = {
            keywordId: kw.id,
            type: "new_top3",
            severity: "positive",
            details: `#${prevPos} → #${currentPos}. Entered top 3! 🎉`,
            keyword: kw.keyword,
            urlTitle: url.title,
          };
          await prisma.alert.create({
            data: {
              keywordId: alert.keywordId,
              type: alert.type,
              severity: alert.severity,
              details: alert.details,
            },
          });
          newAlerts.positive.push(alert);
        }
      }
    }

    log.push(`✓ Created ${snapshotsCreated} snapshots`);

    // 3e. Auto-discover new keywords from GSC
    if (autoAddGsc) {
      try {
        const existingKws = new Set(
          url.keywords.map((k) => k.keyword.toLowerCase())
        );
        const topQueries = await getTopQueries({
          url: url.url,
          startDate,
          endDate,
          minImpressions: autoAddMinImpr,
        });

        let added = 0;
        for (const q of topQueries) {
          if (existingKws.has(q.keyword.toLowerCase())) continue;
          if (url.keywords.length + added >= maxKwPerUrl) break;

          await prisma.keyword.create({
            data: {
              urlId: url.id,
              keyword: q.keyword.toLowerCase(),
              source: "gsc",
              intent: "informational",
              tracked: true,
            },
          });
          added++;
        }
        if (added > 0) log.push(`✓ Auto-added ${added} new keywords`);
      } catch (e) {
        log.push(`✗ Auto-discovery error: ${e.message}`);
      }
    }

    // Update URL status based on trends
    if (url.keywords.length > 0) {
      const droppingKws = url.keywords.filter((k) => {
        const prev = k.snapshots?.[0]?.serpPosition;
        const curr = dfsData[k.keyword]?.position;
        return prev && curr && curr - prev >= 3;
      });

      if (droppingKws.length >= url.keywords.length * 0.5) {
        await prisma.trackedUrl.update({
          where: { id: url.id },
          data: { status: "declining" },
        });
        log.push(`⚠ Status updated to "declining"`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const totalAlerts =
      newAlerts.critical.length + newAlerts.warning.length + newAlerts.positive.length;
    
    log.push(`\n✓ Completed in ${duration}s`);
    if (totalAlerts > 0) {
      log.push(
        `Alerts: ${newAlerts.critical.length} critical, ${newAlerts.warning.length} warnings, ${newAlerts.positive.length} positive`
      );
    }

    return NextResponse.json({
      ok: true,
      duration: `${duration}s`,
      url: {
        id: url.id,
        title: url.title,
      },
      stats: {
        snapshotsCreated,
        keywordsProcessed: url.keywords.length,
        gscResults: Object.keys(gscData).length,
        dfsResults: Object.keys(dfsData).length,
      },
      alerts: {
        critical: newAlerts.critical.length,
        warning: newAlerts.warning.length,
        positive: newAlerts.positive.length,
      },
      alertDetails: newAlerts,
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
