import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getSearchAnalytics, getLastWeekRange, getTopQueries } from "@/lib/gsc";
import { batchSerpPositions } from "@/lib/dataforseo";
import { sendMessage, formatWeeklyReport } from "@/lib/telegram";

// POST /api/cron — run the weekly data collection
// Protected by CRON_SECRET header
export async function POST(request) {
  // Simple auth check
  const secret = request.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const log = [];
  const newAlerts = { critical: [], warning: [], positive: [] };

  try {
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

    const targetDomain = (cfg.gscProperty || process.env.GSC_PROPERTY || "")
      .replace("https://", "")
      .replace("http://", "")
      .replace(/\/$/, "");

    // 2. Get all tracked URLs with their keywords
    const urls = await prisma.trackedUrl.findMany({
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

    log.push(
      `Found ${urls.length} URLs with ${urls.reduce((s, u) => s + u.keywords.length, 0)} active keywords`,
    );

    const weekStarting = new Date();
    weekStarting.setDate(weekStarting.getDate() - weekStarting.getDay() + 1); // Monday
    weekStarting.setHours(0, 0, 0, 0);

    const { startDate, endDate } = getLastWeekRange();

    // 3. Process each URL
    for (const url of urls) {
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
        log.push(`GSC: ${url.title} — ${gscResults.length} keyword results`);
      } catch (e) {
        log.push(`GSC ERROR: ${url.title} — ${e.message}`);
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
        log.push(
          `DFS: ${url.title} — ${Object.keys(dfsData).length} keyword results`,
        );
      } catch (e) {
        log.push(`DFS ERROR: ${url.title} — ${e.message}`);
      }

      // 3c. Write snapshots and detect alerts
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
            const severity =
              drop >= alertThreshold * 2 ? "critical" : "warning";
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

      // 3e. Auto-discover new keywords from GSC
      if (autoAddGsc) {
        try {
          const existingKws = new Set(
            url.keywords.map((k) => k.keyword.toLowerCase()),
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
          if (added > 0)
            log.push(`Auto-added ${added} keywords for ${url.title}`);
        } catch (e) {
          log.push(`Auto-discovery error for ${url.title}: ${e.message}`);
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
        }
      }
    }

    // 4. Send Telegram notification
    const totalAlerts =
      newAlerts.critical.length +
      newAlerts.warning.length +
      newAlerts.positive.length;
    if (totalAlerts > 0) {
      const dashboardUrl = process.env.DASHBOARD_URL || "";
      const message = formatWeeklyReport({
        weekDate: weekStarting.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        critical: newAlerts.critical,
        warnings: newAlerts.warning,
        positive: newAlerts.positive,
        stats: {
          urlCount: urls.length,
          kwCount: urls.reduce((s, u) => s + u.keywords.length, 0),
        },
        dashboardUrl,
      });
      await sendMessage(message);
      log.push(`Telegram: sent report with ${totalAlerts} alerts`);
    } else {
      log.push("No new alerts — skipping Telegram notification");
    }

    // 5. Archive old weekly data (keep last N weeks detailed)
    const archiveWeeks = parseInt(cfg.archiveWeeks || "13");
    const archiveCutoff = new Date();
    archiveCutoff.setDate(archiveCutoff.getDate() - archiveWeeks * 7);

    const deleted = await prisma.weeklySnapshot.deleteMany({
      where: { weekStarting: { lt: archiveCutoff } },
    });
    if (deleted.count > 0) {
      log.push(`Archived: deleted ${deleted.count} old snapshots`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log.push(`Done in ${duration}s`);

    return NextResponse.json({
      ok: true,
      duration: `${duration}s`,
      alerts: {
        critical: newAlerts.critical.length,
        warning: newAlerts.warning.length,
        positive: newAlerts.positive.length,
      },
      log,
    });
  } catch (error) {
    log.push(`FATAL ERROR: ${error.message}`);
    return NextResponse.json(
      { ok: false, error: error.message, log },
      { status: 500 },
    );
  }
}
