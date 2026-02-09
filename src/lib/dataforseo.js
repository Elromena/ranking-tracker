const DFS_BASE = 'https://api.dataforseo.com/v3';

function getAuth() {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) throw new Error('DataForSEO credentials not set');
  return 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64');
}

async function dfsRequest(endpoint, body) {
  const response = await fetch(`${DFS_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': getAuth(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`DataForSEO error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (data.status_code !== 20000) {
    throw new Error(`DataForSEO API error: ${data.status_message}`);
  }

  return data;
}

/**
 * Get SERP position for a keyword
 * Returns position, SERP features, and URL found
 */
export async function getSerpPosition({ keyword, targetDomain, country = 'us', language = 'en' }) {
  // Map country codes to location codes
  const locationMap = { us: 2840, gb: 2826, ng: 2566, de: 2276, ca: 2124, au: 2036 };
  const locationCode = locationMap[country] || 2840;

  try {
    const data = await dfsRequest('/serp/google/organic/live/regular', [{
      keyword,
      location_code: locationCode,
      language_code: language,
      depth: 100,
    }]);

    const task = data.tasks?.[0];
    const result = task?.result?.[0];
    if (!result) return { position: null, serpFeatures: [], foundUrl: null };

    // Find our domain in results
    const items = result.items || [];
    let position = null;
    let foundUrl = null;

    for (const item of items) {
      if (item.type === 'organic' && item.domain && item.domain.includes(targetDomain)) {
        position = item.rank_absolute;
        foundUrl = item.url;
        break;
      }
    }

    // Extract SERP features
    const serpFeatures = [];
    for (const item of items) {
      if (item.type === 'featured_snippet') serpFeatures.push('featured_snippet');
      if (item.type === 'people_also_ask') serpFeatures.push('paa');
      if (item.type === 'local_pack') serpFeatures.push('local_pack');
      if (item.type === 'knowledge_graph') serpFeatures.push('knowledge_graph');
      if (item.type === 'video') serpFeatures.push('video');
    }

    return {
      position,
      serpFeatures: [...new Set(serpFeatures)],
      foundUrl,
    };
  } catch (error) {
    console.error(`DataForSEO error for "${keyword}":`, error.message);
    return { position: null, serpFeatures: [], foundUrl: null };
  }
}

/**
 * Batch check SERP positions for multiple keywords
 * More efficient than individual calls
 */
export async function batchSerpPositions({ keywords, targetDomain, country = 'us', language = 'en' }) {
  const results = {};

  // DataForSEO supports batch — send up to 100 at once
  const batches = [];
  for (let i = 0; i < keywords.length; i += 100) {
    batches.push(keywords.slice(i, i + 100));
  }

  for (const batch of batches) {
    const tasks = batch.map(kw => ({
      keyword: kw,
      location_code: { us: 2840, gb: 2826, ng: 2566, de: 2276, ca: 2124, au: 2036 }[country] || 2840,
      language_code: language,
      depth: 100,
    }));

    try {
      const data = await dfsRequest('/serp/google/organic/live/regular', tasks);

      for (const task of data.tasks || []) {
        const kw = task.data?.keyword;
        const result = task.result?.[0];
        if (!kw || !result) continue;

        const items = result.items || [];
        let position = null;
        let foundUrl = null;

        for (const item of items) {
          if (item.type === 'organic' && item.domain?.includes(targetDomain)) {
            position = item.rank_absolute;
            foundUrl = item.url;
            break;
          }
        }

        const serpFeatures = [];
        for (const item of items) {
          if (['featured_snippet', 'people_also_ask', 'local_pack', 'knowledge_graph', 'video'].includes(item.type)) {
            serpFeatures.push(item.type === 'people_also_ask' ? 'paa' : item.type);
          }
        }

        results[kw] = { position, serpFeatures: [...new Set(serpFeatures)], foundUrl };
      }
    } catch (error) {
      console.error('DataForSEO batch error:', error.message);
    }

    // Rate limiting — pause between batches
    if (batches.length > 1) await new Promise(r => setTimeout(r, 2000));
  }

  return results;
}

/**
 * Get historical SERP positions for keywords on a specific date
 * Uses DataForSEO Labs Historical SERP API
 * Date format: YYYY-MM-DD
 */
export async function getHistoricalSerpPositions({ keywords, targetDomain, date, country = 'us', language = 'en' }) {
  const results = {};

  // Map country codes to location codes
  const locationMap = { us: 2840, gb: 2826, ng: 2566, de: 2276, ca: 2124, au: 2036 };
  const locationCode = locationMap[country] || 2840;

  // Process in batches of 10 (historical API is more expensive)
  const batches = [];
  for (let i = 0; i < keywords.length; i += 10) {
    batches.push(keywords.slice(i, i + 10));
  }

  for (const batch of batches) {
    const tasks = batch.map(kw => ({
      keyword: kw,
      location_code: locationCode,
      language_code: language,
      date_from: date,
      date_to: date, // Same date = specific day snapshot
    }));

    try {
      const data = await dfsRequest('/dataforseo_labs/google/historical_serps/live', tasks);

      for (const task of data.tasks || []) {
        const kw = task.data?.keyword;
        const result = task.result?.[0];
        if (!kw || !result) continue;

        const items = result.items || [];
        let position = null;
        let foundUrl = null;

        for (const item of items) {
          if (item.type === 'organic' && item.domain?.includes(targetDomain)) {
            position = item.rank_absolute;
            foundUrl = item.url;
            break;
          }
        }

        const serpFeatures = [];
        for (const item of items) {
          if (['featured_snippet', 'people_also_ask', 'local_pack', 'knowledge_graph', 'video'].includes(item.type)) {
            serpFeatures.push(item.type === 'people_also_ask' ? 'paa' : item.type);
          }
        }

        results[kw] = { position, serpFeatures: [...new Set(serpFeatures)], foundUrl };
      }
    } catch (error) {
      console.error(`DataForSEO historical error for date ${date}:`, error.message);
      // If historical API fails, return empty results for this batch
      for (const kw of batch) {
        results[kw] = { position: null, serpFeatures: [], foundUrl: null };
      }
    }

    // Rate limiting — pause between batches
    if (batches.length > 1) await new Promise(r => setTimeout(r, 3000));
  }

  return results;
}
