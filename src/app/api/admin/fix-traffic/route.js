import { prisma } from "@/lib/db";
import { getDailyPageTraffic, formatDate } from "@/lib/gsc";
import { NextResponse } from "next/server";

/**
 * POST /api/admin/fix-traffic
 *
 * One-time migration: deletes all existing PageTraffic records (which contain
 * inflated 7-day rolling aggregates) and re-fetches actual per-day data from
 * GSC for the full available window (~16 months).
 */
export async function POST() {
  const startTime = Date.now();
  const log = [];

  try {
    if (!process.env.GSC_CREDENTIALS || !process.env.GSC_PROPERTY) {
      return NextResponse.json(
        { ok: false, error: "GSC_CREDENTIALS or GSC_PROPERTY not configured" },
        { status: 400 }
      );
    }

    const deleted = await prisma.pageTraffic.deleteMany({});
    log.push(`Deleted ${deleted.count} old inflated PageTraffic records`);

    const trackedUrls = await prisma.trackedUrl.findMany({
      where: { trackingEnabled: true },
      select: { id: true, url: true, title: true },
    });

    log.push(`Re-fetching daily traffic for ${trackedUrls.length} tracked URLs`);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 3);
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - 16);

    const startStr = formatDate(startDate);
    const endStr = formatDate(endDate);
    log.push(`Date range: ${startStr} to ${endStr}`);

    let totalRows = 0;

    for (const tu of trackedUrls) {
      if (!tu.url) continue;

      try {
        const dailyRows = await getDailyPageTraffic({
          url: tu.url,
          startDate: startStr,
          endDate: endStr,
        });

        if (dailyRows.length === 0) {
          log.push(`  ${tu.title}: no GSC data`);
          continue;
        }

        for (const row of dailyRows) {
          const rowDate = new Date(row.date + "T00:00:00Z");
          await prisma.pageTraffic.upsert({
            where: { urlId_date: { urlId: tu.id, date: rowDate } },
            create: {
              urlId: tu.id,
              date: rowDate,
              clicks: row.clicks || 0,
              impressions: row.impressions || 0,
              ctr: row.ctr || null,
              position: row.position || null,
            },
            update: {
              clicks: row.clicks || 0,
              impressions: row.impressions || 0,
              ctr: row.ctr || null,
              position: row.position || null,
            },
          });
        }

        totalRows += dailyRows.length;
        log.push(`  ${tu.title}: ${dailyRows.length} daily records stored`);
      } catch (err) {
        log.push(`  ${tu.title}: ERROR - ${err.message}`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log.push(`Completed in ${duration}s — ${totalRows} total daily records created`);

    return NextResponse.json({ ok: true, deleted: deleted.count, created: totalRows, duration: `${duration}s`, log });
  } catch (error) {
    log.push(`FATAL: ${error.message}`);
    return NextResponse.json({ ok: false, error: error.message, log }, { status: 500 });
  }
}
