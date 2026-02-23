const DFS_BASE = "https://api.dataforseo.com/v3";

// Configuration for different providers
const PROVIDERS = {
  DATAFORSEO: "dataforseo",
  SERPAPI: "serpapi",
};

// Location code mappings (keep existing DataForSEO codes)
const LOCATION_CODES = {
  us: 2840,
  gb: 2826,
  ng: 2566,
  de: 2276,
  ca: 2124,
  au: 2036,
};

// SerpAPI gl parameter (country codes)
const COUNTRY_CODES = {
  us: "us",
  gb: "uk",
  ng: "ng",
  de: "de",
  ca: "ca",
  au: "au",
};

// Language codes for SerpAPI
const LANGUAGE_CODES = {
  en: "en",
  es: "es",
  fr: "fr",
  de: "de",
};

function getAuth() {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) throw new Error("DataForSEO credentials not set");
  return "Basic " + Buffer.from(`${login}:${password}`).toString("base64");
}

async function dfsRequest(endpoint, body) {
  const response = await fetch(`${DFS_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: getAuth(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      `DataForSEO error: ${response.status} ${response.statusText}`,
    );
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
export async function getSerpPosition({
  keyword,
  targetDomain,
  country = "us",
  language = "en",
}) {
  // Map country codes to location codes
  const locationMap = {
    us: 2840,
    gb: 2826,
    ng: 2566,
    de: 2276,
    ca: 2124,
    au: 2036,
  };
  const locationCode = locationMap[country] || 2840;

  try {
    const data = await dfsRequest("/serp/google/organic/live/regular", [
      {
        keyword,
        location_code: locationCode,
        language_code: language,
        depth: 100,
      },
    ]);

    const task = data.tasks?.[0];
    const result = task?.result?.[0];
    if (!result) return { position: null, serpFeatures: [], foundUrl: null };

    // Find our domain in results
    const items = result.items || [];
    let position = null;
    let foundUrl = null;

    for (const item of items) {
      if (
        item.type === "organic" &&
        item.domain &&
        item.domain.includes(targetDomain)
      ) {
        position = item.rank_absolute;
        foundUrl = item.url;
        break;
      }
    }

    // Extract SERP features
    const serpFeatures = [];
    for (const item of items) {
      if (item.type === "featured_snippet")
        serpFeatures.push("featured_snippet");
      if (item.type === "people_also_ask") serpFeatures.push("paa");
      if (item.type === "local_pack") serpFeatures.push("local_pack");
      if (item.type === "knowledge_graph") serpFeatures.push("knowledge_graph");
      if (item.type === "video") serpFeatures.push("video");
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

// export async function batchSerpPositions({
//   keywords,
//   targetDomain,
//   country = "us",
//   language = "en",
// }) {
//   const results = {};

//   // Create individual tasks (each will be sent separately)
//   const tasks = keywords.map((kw) => ({
//     keyword: kw,
//     location_code:
//       { us: 2840, gb: 2826, ng: 2566, de: 2276, ca: 2124, au: 2036 }[country] ||
//       2840,
//     language_code: language,
//     depth: 100,
//   }));

//   console.log(`Processing ${tasks.length} keywords individually`);

//   // Process tasks in batches with concurrency control
//   const concurrencyLimit = 5; // Adjust based on your rate limits
//   const successfulResults = [];

//   for (let i = 0; i < tasks.length; i += concurrencyLimit) {
//     const batch = tasks.slice(i, i + concurrencyLimit);
//     console.log(
//       `Processing batch ${Math.floor(i / concurrencyLimit) + 1}: ${batch.length} keywords`,
//     );

//     // Process this batch concurrently
//     const batchPromises = batch.map(async (task) => {
//       try {
//         // Send single task in array format
//         const response = await dfsRequest("/serp/google/organic/live/regular", [
//           task,
//         ]);

//         // Handle the response format you shared
//         if (response && response.tasks && response.tasks.length > 0) {
//           // Find the successful task (status_code: 20000)
//           const successfulTask = response.tasks.find(
//             (t) => t.status_code === 20000,
//           );
//           const failedTask = response.tasks.find(
//             (t) => t.status_code !== 20000,
//           );

//           if (successfulTask) {
//             return {
//               keyword: task.keyword,
//               success: true,
//               data: successfulTask,
//               error: null,
//             };
//           } else if (failedTask) {
//             return {
//               keyword: task.keyword,
//               success: false,
//               data: null,
//               error: failedTask.status_message,
//             };
//           }
//         }

//         return {
//           keyword: task.keyword,
//           success: false,
//           data: null,
//           error: "No valid task in response",
//         };
//       } catch (error) {
//         console.error(
//           `Error processing keyword "${task.keyword}":`,
//           error.message,
//         );
//         return {
//           keyword: task.keyword,
//           success: false,
//           data: null,
//           error: error.message,
//         };
//       }
//     });

//     // Wait for all promises in this batch to complete
//     const batchResults = await Promise.all(batchPromises);
//     successfulResults.push(...batchResults);

//     // Rate limiting - pause between batches
//     if (i + concurrencyLimit < tasks.length) {
//       console.log(`Waiting 1 second before next batch...`);
//       await new Promise((r) => setTimeout(r, 1000));
//     }
//   }

//   // Process all successful results
//   for (const { keyword, success, data, error } of successfulResults) {
//     if (!success || !data) {
//       results[keyword] = {
//         position: null,
//         serpFeatures: [],
//         foundUrl: null,
//         error: error || "Failed to fetch data",
//       };
//       continue;
//     }

//     const result = data.result?.[0];

//     if (!result) {
//       results[keyword] = {
//         position: null,
//         serpFeatures: [],
//         foundUrl: null,
//       };
//       continue;
//     }

//     const items = result.items || [];
//     let position = null;
//     let foundUrl = null;

//     for (const item of items) {
//       if (item.type === "organic" && item.domain?.includes(targetDomain)) {
//         position = item.rank_absolute;
//         foundUrl = item.url;
//         break;
//       }
//     }

//     const serpFeatures = [];
//     for (const item of items) {
//       if (
//         [
//           "featured_snippet",
//           "people_also_ask",
//           "local_pack",
//           "knowledge_graph",
//           "video",
//         ].includes(item.type)
//       ) {
//         serpFeatures.push(item.type === "people_also_ask" ? "paa" : item.type);
//       }
//     }

//     results[keyword] = {
//       position,
//       serpFeatures: [...new Set(serpFeatures)],
//       foundUrl,
//     };
//   }

//   // Log summary
//   const successful = Object.values(results).filter(
//     (r) => r.position !== null,
//   ).length;
//   const failed = Object.values(results).filter(
//     (r) => r.position === null,
//   ).length;
//   console.log(`Complete: ${successful} successful, ${failed} failed`);

//   return results;
// }

export async function batchSerpPositions({
  keywords,
  targetDomain,
  country = "us",
  language = "en",
  provider = PROVIDERS.DATAFORSEO, // Default to DataForSEO
  serpApiKey = process.env.SERPAPI_KEY, // Optional, falls back to env
}) {
  const results = {};

  console.log(`Processing ${keywords.length} keywords using ${provider}`);

  if (provider === PROVIDERS.DATAFORSEO) {
    return await processWithDataForSEO({
      keywords,
      targetDomain,
      country,
      language,
    });
  } else if (provider === PROVIDERS.SERPAPI) {
    return await processWithSerpAPI({
      keywords,
      targetDomain,
      country,
      language,
      serpApiKey,
    });
  } else {
    throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Get historical SERP positions for keywords on a specific date
 * Uses DataForSEO Labs Historical SERP API
 * Date format: YYYY-MM-DD
 */
export async function getHistoricalSerpPositions({
  keywords,
  targetDomain,
  date,
  country = "us",
  language = "en",
}) {
  const results = {};

  // Map country codes to location codes
  const locationMap = {
    us: 2840,
    gb: 2826,
    ng: 2566,
    de: 2276,
    ca: 2124,
    au: 2036,
  };
  const locationCode = locationMap[country] || 2840;

  // Process in batches of 10 (historical API is more expensive)
  const batches = [];
  for (let i = 0; i < keywords.length; i += 10) {
    batches.push(keywords.slice(i, i + 10));
  }

  for (const batch of batches) {
    const tasks = batch.map((kw) => ({
      keyword: kw,
      location_code: locationCode,
      language_code: language,
      date_from: date,
      date_to: date, // Same date = specific day snapshot
    }));

    try {
      const data = await dfsRequest(
        "/dataforseo_labs/google/historical_serps/live",
        tasks,
      );

      for (const task of data.tasks || []) {
        const kw = task.data?.keyword;
        const result = task.result?.[0];
        if (!kw || !result) continue;

        const items = result.items || [];
        let position = null;
        let foundUrl = null;

        for (const item of items) {
          if (item.type === "organic" && item.domain?.includes(targetDomain)) {
            position = item.rank_absolute;
            foundUrl = item.url;
            break;
          }
        }

        const serpFeatures = [];
        for (const item of items) {
          if (
            [
              "featured_snippet",
              "people_also_ask",
              "local_pack",
              "knowledge_graph",
              "video",
            ].includes(item.type)
          ) {
            serpFeatures.push(
              item.type === "people_also_ask" ? "paa" : item.type,
            );
          }
        }

        results[kw] = {
          position,
          serpFeatures: [...new Set(serpFeatures)],
          foundUrl,
        };
      }
    } catch (error) {
      console.error(
        `DataForSEO historical error for date ${date}:`,
        error.message,
      );
      // If historical API fails, return empty results for this batch
      for (const kw of batch) {
        results[kw] = { position: null, serpFeatures: [], foundUrl: null };
      }
    }

    // Rate limiting — pause between batches
    if (batches.length > 1) await new Promise((r) => setTimeout(r, 3000));
  }

  return results;
}

async function processWithDataForSEO({
  keywords,
  targetDomain,
  country,
  language,
}) {
  const results = {};

  // Create individual tasks
  const tasks = keywords.map((kw) => ({
    keyword: kw,
    location_code: LOCATION_CODES[country] || 2840,
    language_code: language,
    depth: 100,
  }));

  // Process tasks in batches with concurrency control
  const concurrencyLimit = 5;
  const successfulResults = [];

  for (let i = 0; i < tasks.length; i += concurrencyLimit) {
    const batch = tasks.slice(i, i + concurrencyLimit);
    console.log(
      `Processing DataForSEO batch ${Math.floor(i / concurrencyLimit) + 1}: ${batch.length} keywords`,
    );

    const batchPromises = batch.map(async (task) => {
      try {
        const response = await dfsRequest("/serp/google/organic/live/regular", [
          task,
        ]);

        if (response && response.tasks && response.tasks.length > 0) {
          const successfulTask = response.tasks.find(
            (t) => t.status_code === 20000,
          );
          const failedTask = response.tasks.find(
            (t) => t.status_code !== 20000,
          );

          if (successfulTask) {
            return {
              keyword: task.keyword,
              success: true,
              data: successfulTask,
              error: null,
            };
          } else if (failedTask) {
            return {
              keyword: task.keyword,
              success: false,
              data: null,
              error: failedTask.status_message,
            };
          }
        }

        return {
          keyword: task.keyword,
          success: false,
          data: null,
          error: "No valid task in response",
        };
      } catch (error) {
        console.error(
          `Error processing keyword "${task.keyword}":`,
          error.message,
        );
        return {
          keyword: task.keyword,
          success: false,
          data: null,
          error: error.message,
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    successfulResults.push(...batchResults);

    if (i + concurrencyLimit < tasks.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Process DataForSEO results into consistent format
  for (const { keyword, success, data, error } of successfulResults) {
    if (!success || !data) {
      results[keyword] = {
        position: null,
        serpFeatures: [],
        foundUrl: null,
        error: error || "Failed to fetch data",
      };
      continue;
    }

    const result = data.result?.[0];

    if (!result) {
      results[keyword] = {
        position: null,
        serpFeatures: [],
        foundUrl: null,
      };
      continue;
    }

    const items = result.items || [];
    let position = null;
    let foundUrl = null;

    for (const item of items) {
      if (item.type === "organic" && item.domain?.includes(targetDomain)) {
        position = item.rank_absolute;
        foundUrl = item.url;
        break;
      }
    }

    const serpFeatures = [];
    for (const item of items) {
      if (
        [
          "featured_snippet",
          "people_also_ask",
          "local_pack",
          "knowledge_graph",
          "video",
        ].includes(item.type)
      ) {
        serpFeatures.push(item.type === "people_also_ask" ? "paa" : item.type);
      }
    }

    results[keyword] = {
      position,
      serpFeatures: [...new Set(serpFeatures)],
      foundUrl,
    };
  }

  const successful = Object.values(results).filter(
    (r) => r.position !== null,
  ).length;
  const failed = Object.values(results).filter(
    (r) => r.position === null,
  ).length;
  console.log(
    `DataForSEO Complete: ${successful} successful, ${failed} failed`,
  );

  return results;
}

/**
 * Process keywords using SerpAPI
 */
async function processWithSerpAPI({
  keywords,
  targetDomain,
  country,
  language,
  serpApiKey,
}) {
  const results = {};
  const apiKey = serpApiKey || process.env.SERP_API_KEY;

  if (!apiKey) {
    throw new Error(
      "SerpAPI key is required. Set SERPAPI_KEY environment variable or pass serpApiKey parameter.",
    );
  }

  // Process tasks in batches with concurrency control
  const concurrencyLimit = 5; // SerpAPI rate limits
  const successfulResults = [];

  for (let i = 0; i < keywords.length; i += concurrencyLimit) {
    const batch = keywords.slice(i, i + concurrencyLimit);
    console.log(
      `Processing SerpAPI batch ${Math.floor(i / concurrencyLimit) + 1}: ${batch.length} keywords`,
    );

    const batchPromises = batch.map(async (keyword) => {
      try {
        // Use Promise-based approach instead of callback
        const response = await serpApiSearch({
          api_key: apiKey,
          q: keyword,
          hl: language,
          gl: COUNTRY_CODES[country] || "us",
        });

        console.log(keyword, response, "response obj");

        return {
          keyword,
          success: true,
          data: response,
          error: null,
        };
      } catch (error) {
        console.error(`Error processing keyword "${keyword}":`, error.message);
        return {
          keyword,
          success: false,
          data: null,
          error: error.message,
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    successfulResults.push(...batchResults);

    // Rate limiting - pause between batches
    if (i + concurrencyLimit < keywords.length) {
      console.log(`Waiting 1 second before next SerpAPI batch...`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Process SerpAPI results into consistent format
  for (const { keyword, success, data, error } of successfulResults) {
    if (!success || !data) {
      results[keyword] = {
        position: null,
        serpFeatures: [],
        foundUrl: null,
        error: error || "Failed to fetch data",
      };
      continue;
    }

    const organicResults = data?.organic_results || [];
    let position = null;
    let foundUrl = null;

    console.log("organic result", organicResults?.length);

    // Find target domain in organic results
    for (const item of organicResults) {
      if (
        item.link?.includes(targetDomain) ||
        item.displayed_link?.includes(targetDomain)
      ) {
        position = item.position;
        foundUrl = item.link;
        break;
      }
    }

    // Detect SERP features from response
    const serpFeatures = [];

    // Check for various SERP features in SerpAPI response
    if (data.answer_box) serpFeatures.push("featured_snippet");
    if (data.related_questions) serpFeatures.push("paa"); // people also ask
    if (data.local_results) serpFeatures.push("local_pack");
    if (data.knowledge_graph) serpFeatures.push("knowledge_graph");
    if (data.inline_videos) serpFeatures.push("video");
    if (data.top_stories) serpFeatures.push("top_stories");
    if (data.shopping_results) serpFeatures.push("shopping");
    if (data.related_searches) serpFeatures.push("related_searches");
    if (data.paid_ad_results?.length > 0) serpFeatures.push("ads");

    results[keyword] = {
      position,
      serpFeatures: [...new Set(serpFeatures)],
      foundUrl,
    };
  }

  const successful = Object.values(results).filter(
    (r) => r.position !== null,
  ).length;
  const failed = Object.values(results).filter(
    (r) => r.position === null,
  ).length;
  console.log(`SerpAPI Complete: ${successful} successful, ${failed} failed`);

  return results;
}

/**
 * Wrapper for SerpAPI getJson to return a Promise
 */
function serpApiSearch(params) {
  return new Promise((resolve, reject) => {
    const { getJson } = require("serpapi");

    getJson(params, (json) => {
      // Check for errors in response
      if (json.error) {
        reject(new Error(json.error));
      } else {
        resolve(json);
      }
    });
  });
}

// Export provider constants for external use
export { PROVIDERS };
