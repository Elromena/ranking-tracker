/**
 * Standalone cron script — triggered by Railway's cron scheduler
 *
 * This calls the /api/cron endpoint on the running web app.
 * Railway can schedule this to run every Monday at 6 AM UTC.
 *
 * Usage:
 *   node scripts/cron.js
 *
 * Environment variables needed:
 *   APP_URL — the deployed app URL (e.g., https://your-app.up.railway.app)
 *   CRON_SECRET — shared secret to authenticate the cron request
 */

// Load local .env when running locally (dev dependency)
if (process.env.NODE_ENV !== "production") {
  try {
    require("dotenv").config();
  } catch (e) {
    // dotenv is a dev dependency; ignore if not installed in production
  }
}

const APP_URL =
  process.env.APP_URL ||
  (process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : "http://localhost:3000");

const CRON_SECRET = process.env.CRON_SECRET || "";

if (!APP_URL) {
  console.error(
    "[CRON] ❌ APP_URL is not set. Set APP_URL or RAILWAY_PUBLIC_DOMAIN.",
  );
  process.exit(1);
}

if (!CRON_SECRET) {
  console.error(
    "[CRON] ❌ CRON_SECRET is not set. Set CRON_SECRET in your environment.",
  );
  process.exit(1);
}

// Ensure we have a fetch implementation
let fetchFn = typeof fetch !== "undefined" ? fetch.bind(globalThis) : null;
if (!fetchFn) {
  try {
    // Try commonJS require for node-fetch (if installed)
    // eslint-disable-next-line global-require
    const nf = require("node-fetch");
    fetchFn = nf;
  } catch (e) {
    try {
      // Try dynamic import
      fetchFn = (...args) =>
        import("node-fetch").then((m) => m.default(...args));
    } catch (e2) {
      console.error(
        "[CRON] ❌ No fetch available. Use Node 18+ or install node-fetch.",
      );
      process.exit(1);
    }
  }
}

async function run() {
  console.log(`[CRON] Calling ${APP_URL}/api/cron`, `secret ${CRON_SECRET}`);

  try {
    const response = await fetchFn(`${APP_URL}/api/cron`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cron-secret": CRON_SECRET,
      },
    });

    const data = await response.json();

    if (data.ok) {
      console.log(`[CRON] ✅ Completed in ${data.duration}`);
      console.log(
        `[CRON] Alerts: ${data.alerts.critical} critical, ${data.alerts.warning} warnings, ${data.alerts.positive} positive`,
      );
      if (data.log) {
        console.log("[CRON] Log:");
        data.log.forEach((l) => console.log(`  ${l}`));
      }
    } else {
      console.error("[CRON] ❌ Failed:", data.error);
      if (data.log) data.log.forEach((l) => console.log(`  ${l}`));
      process.exit(1);
    }
  } catch (error) {
    console.error(
      "[CRON] ❌ Request failed:",
      error && error.message ? error.message : error,
    );
    process.exit(1);
  }
}

run();
