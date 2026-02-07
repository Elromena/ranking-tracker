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

const APP_URL = process.env.APP_URL || process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : 'http://localhost:3000';

const CRON_SECRET = process.env.CRON_SECRET || '';

async function run() {
  console.log(`[CRON] Starting weekly ranking collection at ${new Date().toISOString()}`);
  console.log(`[CRON] Calling ${APP_URL}/api/cron`);

  try {
    const response = await fetch(`${APP_URL}/api/cron`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': CRON_SECRET,
      },
    });

    const data = await response.json();

    if (data.ok) {
      console.log(`[CRON] ✅ Completed in ${data.duration}`);
      console.log(`[CRON] Alerts: ${data.alerts.critical} critical, ${data.alerts.warning} warnings, ${data.alerts.positive} positive`);
      if (data.log) {
        console.log('[CRON] Log:');
        data.log.forEach(l => console.log(`  ${l}`));
      }
    } else {
      console.error(`[CRON] ❌ Failed:`, data.error);
      if (data.log) data.log.forEach(l => console.log(`  ${l}`));
      process.exit(1);
    }
  } catch (error) {
    console.error(`[CRON] ❌ Request failed:`, error.message);
    process.exit(1);
  }
}

run();
