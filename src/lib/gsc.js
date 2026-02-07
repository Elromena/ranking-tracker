import { google } from 'googleapis';

let searchConsole = null;

function getClient() {
  if (searchConsole) return searchConsole;

  const credentials = JSON.parse(process.env.GSC_CREDENTIALS || '{}');
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  searchConsole = google.searchconsole({ version: 'v1', auth });
  return searchConsole;
}

/**
 * Get search analytics for a specific URL and its keywords
 * Returns clicks, impressions, CTR, position for each query
 */
export async function getSearchAnalytics({ url, startDate, endDate, keywords = [] }) {
  const client = getClient();
  const siteUrl = process.env.GSC_PROPERTY;

  if (!siteUrl) throw new Error('GSC_PROPERTY not set');

  try {
    const response = await client.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query', 'page'],
        dimensionFilterGroups: [{
          filters: [{
            dimension: 'page',
            operator: 'equals',
            expression: url,
          }],
        }],
        rowLimit: 500,
      },
    });

    const rows = response.data.rows || [];

    // If specific keywords provided, filter to those
    // Otherwise return all queries for this URL
    if (keywords.length > 0) {
      const kwSet = new Set(keywords.map(k => k.toLowerCase()));
      return rows
        .filter(row => kwSet.has(row.keys[0].toLowerCase()))
        .map(row => ({
          keyword: row.keys[0],
          url: row.keys[1],
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        }));
    }

    return rows.map(row => ({
      keyword: row.keys[0],
      url: row.keys[1],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));
  } catch (error) {
    console.error(`GSC error for ${url}:`, error.message);
    return [];
  }
}

/**
 * Get top queries for a URL — used for auto-discovery
 */
export async function getTopQueries({ url, startDate, endDate, minImpressions = 100 }) {
  const results = await getSearchAnalytics({ url, startDate, endDate });
  return results
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
