import { google } from 'googleapis';

let searchConsole = null;

function getClient() {
  if (searchConsole) return searchConsole;

  if (!process.env.GSC_CREDENTIALS) {
    throw new Error('GSC_CREDENTIALS environment variable is not set');
  }

  const credentials = JSON.parse(process.env.GSC_CREDENTIALS);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  searchConsole = google.searchconsole({ version: 'v1', auth });
  return searchConsole;
}

/**
 * Get page-level traffic for a URL (total clicks, impressions, CTR, position).
 * Uses 'page' dimension with no query breakdown — this is the correct way to
 * measure a page's overall traffic since it includes ALL queries, not just tracked ones.
 *
 * Uses 'contains' with the URL path to handle www/non-www and protocol variants.
 * If multiple rows match, sums clicks/impressions and averages position/CTR.
 */
export async function getPageTraffic({ url, startDate, endDate }) {
  const client = getClient();
  const siteUrl = process.env.GSC_PROPERTY;

  if (!siteUrl) throw new Error('GSC_PROPERTY not set');

  // Extract the path from the URL to avoid www/non-www mismatch
  let urlPath;
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    urlPath = parsed.pathname;
  } catch {
    urlPath = url;
  }

  try {
    const response = await client.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        dimensionFilterGroups: [{
          filters: [{
            dimension: 'page',
            operator: 'contains',
            expression: urlPath,
          }],
        }],
        rowLimit: 10,
      },
    });

    const rows = response.data.rows || [];
    if (rows.length === 0) return null;

    // Sum across all matching URL variants (www, non-www, trailing slash, etc.)
    let totalClicks = 0;
    let totalImpressions = 0;
    let weightedPosition = 0;

    for (const row of rows) {
      totalClicks += row.clicks;
      totalImpressions += row.impressions;
      weightedPosition += row.position * row.impressions;
    }

    return {
      url: rows[0].keys[0],
      clicks: totalClicks,
      impressions: totalImpressions,
      ctr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
      position: totalImpressions > 0 ? weightedPosition / totalImpressions : null,
    };
  } catch (error) {
    throw new Error(`GSC API error for ${url}: ${error.message}`);
  }
}

/**
 * Get top queries for a URL — used for keyword discovery.
 * Returns per-query breakdown (different from getPageTraffic which is page-level totals).
 */
export async function getTopQueries({ url, startDate, endDate, minImpressions = 100 }) {
  const client = getClient();
  const siteUrl = process.env.GSC_PROPERTY;

  if (!siteUrl) throw new Error('GSC_PROPERTY not set');

  let urlPath;
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    urlPath = parsed.pathname;
  } catch {
    urlPath = url;
  }

  const response = await client.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query'],
      dimensionFilterGroups: [{
        filters: [{
          dimension: 'page',
          operator: 'contains',
          expression: urlPath,
        }],
      }],
      rowLimit: 500,
    },
  });

  const rows = response.data.rows || [];
  return rows
    .map(row => ({
      keyword: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }))
    .filter(r => r.impressions >= minImpressions)
    .sort((a, b) => b.impressions - a.impressions);
}

/**
 * Format date for GSC API (YYYY-MM-DD)
 */
export function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Get date range for last 7 days (accounting for GSC 3-day delay)
 */
export function getLastWeekRange() {
  const end = new Date();
  end.setDate(end.getDate() - 3); // GSC has ~3 day delay
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
}
