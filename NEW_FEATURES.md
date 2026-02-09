# New Features: Historical Data & Individual Article Triggers
**Date:** February 9, 2026

---

## 🎯 WHAT'S NEW

### 1. **Backfill Historical Data (4 Weeks)**
Pull historical GSC data for the last 4 weeks to see ranking trends over time.

### 2. **Refresh Rankings for Individual Articles**
Trigger data collection for a single article without running the full cron job.

---

## 📊 FEATURE 1: BACKFILL HISTORICAL DATA

### What It Does
- Pulls GSC data for the last 4 weeks (configurable)
- Creates weekly snapshots for all tracked articles and keywords
- Skips existing data (won't duplicate)
- Only pulls SERP positions from DataForSEO for current week (historical weeks use GSC data only)

### How to Use

**From Settings Page:**
1. Go to Settings → Manual Actions section
2. Click "⏮ Backfill Historical Data"
3. Wait for completion (may take 2-5 minutes depending on number of articles)
4. View results showing:
   - Snapshots created
   - Snapshots skipped (already existed)
   - Weeks processed
   - Detailed log

**What It Shows:**
```
✅ Backfill completed in 125.3s
Created 84 snapshots, skipped 12 existing
Processed 4 weeks
```

### Important Notes
- **GSC Data Only for Historical Weeks:** Past weeks use only Google Search Console data (position, clicks, impressions, CTR)
- **Live SERP for Current Week:** Only the current week includes live SERP positions from DataForSEO
- **No Duplicate Data:** If snapshots already exist for a week, they're skipped
- **GSC 3-Day Delay:** Accounts for Google's typical 3-day data processing delay

### Why This Matters
- **See Trends:** With 4 weeks of data, you can see if ranking changes are trends or fluctuations
- **Context for Decisions:** Know if a drop is recent or part of a longer pattern
- **Validate SEO Work:** See if changes you made 2-3 weeks ago are having an impact

---

## 🔄 FEATURE 2: INDIVIDUAL ARTICLE TRIGGER

### What It Does
- Runs data collection for ONE specific article
- Pulls current GSC data (last 7 days)
- Gets live SERP positions from DataForSEO
- Detects and creates alerts
- Auto-discovers new keywords (if enabled)
- Updates immediately - no need to wait for weekly cron

### How to Use

**From Article Detail Page:**
1. Click on any article to open detail view
2. Click "🔄 Refresh Rankings" button (top right)
3. Wait 10-30 seconds
4. See results:
   - Keywords processed
   - GSC and DataForSEO results
   - New alerts
   - Rankings automatically refresh

**What It Shows:**
```
✅ Rankings updated in 15.2s
Processed 4 keywords • GSC: 4 • DFS: 4
Alerts: 0 critical, 1 warnings, 2 positive
```

### Use Cases

**New Article:**
- Just published a new blog post
- Add it to tracker
- Click "Refresh Rankings" to get immediate data
- No need to wait until next Monday

**Testing Changes:**
- Updated meta title/description
- Want to see if rankings changed
- Refresh individual article
- Compare before/after data

**Quick Check:**
- Competitor published something similar
- Want to see current positions
- Refresh to get latest SERP data

**Troubleshooting:**
- Article shows no data or errors
- Refresh to re-pull GSC data
- Check for API errors in log

### Important Notes
- **Real API Calls:** Uses actual GSC and DataForSEO credits
- **Rate Limiting:** DataForSEO has rate limits (100 keywords per minute)
- **Cost:** Each refresh costs DataForSEO credits (~$0.01-0.05 per keyword)
- **Data Freshness:** GSC data is ~3 days old, SERP data is real-time

---

## 🔧 TECHNICAL DETAILS

### API Endpoints Created

**1. `/api/admin/backfill`**
```json
POST /api/admin/backfill
Body: {
  "weeksBack": 4,        // How many weeks to backfill
  "urlId": null          // Optional: specific URL only
}

Response: {
  "ok": true,
  "duration": "125.3s",
  "snapshotsCreated": 84,
  "snapshotsSkipped": 12,
  "weeksProcessed": 4,
  "log": [...]
}
```

**2. `/api/admin/trigger-url`**
```json
POST /api/admin/trigger-url
Body: {
  "urlId": 7            // Required: which article to refresh
}

Response: {
  "ok": true,
  "duration": "15.2s",
  "url": { "id": 7, "title": "Crypto Ad Networks" },
  "stats": {
    "snapshotsCreated": 4,
    "keywordsProcessed": 4,
    "gscResults": 4,
    "dfsResults": 4
  },
  "alerts": {
    "critical": 0,
    "warning": 1,
    "positive": 2
  },
  "alertDetails": [...],
  "log": [...]
}
```

### Database Impact

**Backfill:**
- Creates `weekly_snapshots` records for historical weeks
- Does NOT create duplicate snapshots
- Uses `keywordId_weekStarting` unique constraint to prevent duplicates

**Individual Trigger:**
- Creates/updates current week's `weekly_snapshots`
- Creates new `alert` records if conditions met
- May create new `keyword` records if auto-discovery enabled
- May update `tracked_urls.status` based on trends

### Data Flow

**Backfill Process:**
```
1. Get config (country, language, thresholds)
2. Get all tracked URLs + keywords
3. For each week (0-3 weeks back):
   - Calculate week start (Monday)
   - Calculate GSC date range (7 days, -3 day delay)
   - For each URL:
     - Pull GSC data for that week
     - Pull DFS data (current week only)
     - Get previous week's snapshot (for comparison)
     - Create/skip snapshot
4. Return summary
```

**Individual Trigger Process:**
```
1. Get config
2. Get specific URL + keywords + latest snapshots
3. Pull GSC data (last 7 days)
4. Pull DFS data (live SERP positions)
5. For each keyword:
   - Compare to previous week
   - Create/update snapshot
   - Detect position drops/gains
   - Create alerts
6. Auto-discover new keywords (if enabled)
7. Update URL status
8. Return results
```

---

## 💰 COST CONSIDERATIONS

### DataForSEO Credits

**Backfill:**
- Only queries current week live SERP data
- Historical weeks = free (GSC data only)
- Example: 6 keywords × 1 week = 6 DFS credits

**Individual Trigger:**
- Queries all keywords for that article
- Example: 4 keywords = 4 DFS credits
- Cost: ~$0.01-0.05 per keyword (depending on plan)

**Recommendation:**
- Use backfill once to get historical context
- Use individual trigger for new articles or after changes
- Use weekly cron for routine monitoring (automated)

---

## 📈 BENEFITS

### Before These Features
- Only had 1-2 weeks of data
- No historical context
- Hard to see trends
- Had to wait for Monday cron to see new article data
- Couldn't test changes immediately

### After These Features
- ✅ 4 weeks of historical data for trends
- ✅ Immediate feedback for new articles
- ✅ Test SEO changes same day
- ✅ Troubleshoot individual articles
- ✅ Don't waste DataForSEO credits on full runs

---

## 🚀 USAGE RECOMMENDATIONS

### First-Time Setup
1. **Add all articles** to tracker
2. **Run backfill** to get 4 weeks of historical data
3. **Wait 24 hours** for GSC data to settle
4. **Review trends** in Weekly Report view

### Ongoing Usage
- **Weekly Cron:** Let it run automatically every Monday (all articles)
- **New Articles:** Use individual trigger right after publishing
- **After Changes:** Use individual trigger to see immediate impact
- **Monthly Review:** Run backfill again to extend historical data

### Best Practices
- Don't refresh the same article multiple times per day (waste of credits)
- Wait 3-4 days after publishing before expecting GSC data
- Use individual trigger for articles with issues
- Use backfill sparingly (once per month max)

---

## 📊 EXPECTED RESULTS

### Backfill Example
```
Starting backfill for last 4 weeks
Processing 2 URLs

Week 1: 2026-02-09 (GSC: 2026-01-30 to 2026-02-06)
  Crypto Affiliate Programs: GSC returned 4 keywords
  Crypto Affiliate Programs: DFS returned 4 positions
  Crypto Ad Networks: GSC returned 2 keywords
  Crypto Ad Networks: DFS returned 2 positions

Week 2: 2026-02-02 (GSC: 2026-01-23 to 2026-01-30)
  Crypto Affiliate Programs: GSC returned 4 keywords
  Crypto Affiliate Programs: Skipping DFS (historical week)
  Crypto Ad Networks: GSC returned 2 keywords
  Crypto Ad Networks: Skipping DFS (historical week)

Week 3: 2026-01-26 (GSC: 2026-01-16 to 2026-01-23)
  ...

Week 4: 2026-01-19 (GSC: 2026-01-09 to 2026-01-16)
  ...

Completed in 125.3s - Created 84 snapshots, skipped 12 existing
```

### Individual Trigger Example
```
Processing: Crypto Ad Networks
Keywords: 2 active
Date range: 2026-01-30 to 2026-02-06
✓ GSC: 2 keyword results
✓ DFS: 2 keyword results
✓ Created 2 snapshots
⚠ Status updated to "declining"

✓ Completed in 15.2s
Alerts: 0 critical, 1 warnings, 0 positive
```

---

## 🎬 DEMO FLOW

### Testing the New Features

**Step 1: Backfill Historical Data**
```
1. Go to https://ranking-tracker-production.up.railway.app/
2. Click "Settings" in sidebar
3. Scroll to "Manual Actions" section
4. Click "⏮ Backfill Historical Data"
5. Wait 2-5 minutes
6. See results with 4 weeks of data created
```

**Step 2: View Trends**
```
1. Click "Weekly Report" in sidebar
2. See all 4 weeks of data now available
3. Click on an article to expand keywords
4. See position changes over 4 weeks
```

**Step 3: Refresh Individual Article**
```
1. Go back to "Dashboard"
2. Click on any article
3. Click "🔄 Refresh Rankings" button
4. Wait 10-30 seconds
5. See updated rankings and new snapshots
6. Charts automatically update with new data
```

---

## 🔒 SECURITY & PERMISSIONS

- Both endpoints require no authentication (admin-only use)
- Consider adding authentication in production
- Endpoints are in `/api/admin/` namespace
- Could add IP whitelisting or API key in future

---

## 🐛 TROUBLESHOOTING

### Backfill Issues

**"GSC ERROR: permission denied"**
- Check GSC_CREDENTIALS environment variable
- Verify service account has access in Search Console

**"No data returned from GSC"**
- Article might be too new (< 3 days old)
- Check if URL is verified in Search Console
- Try with a different date range

**"Snapshots skipped"**
- Normal! Means data already exists for those weeks
- Run backfill again to fill in missing weeks only

### Individual Trigger Issues

**"URL with ID X not found"**
- Article might have been deleted
- Check URL ID in database

**"DFS ERROR: rate limit"**
- Triggered too many refreshes too quickly
- Wait 1 minute and try again
- DataForSEO allows 100 keywords/minute

**"No alerts created"**
- Normal! Only creates alerts if thresholds met
- Check Settings → Alert Thresholds
- May need previous week data for comparison

---

## 📝 FILES CHANGED

### New Files
1. `src/app/api/admin/backfill/route.js` (201 lines)
2. `src/app/api/admin/trigger-url/route.js` (343 lines)

### Modified Files
1. `src/app/page.js` (added backfill + refresh UI)

### Documentation
1. `NEW_FEATURES.md` (this file)

---

## ✅ TESTING CHECKLIST

Before deploying:
- [ ] Test backfill with 1 week first
- [ ] Verify no duplicate snapshots created
- [ ] Test individual trigger on existing article
- [ ] Test individual trigger on new article
- [ ] Check DataForSEO credit usage
- [ ] Verify GSC connection working
- [ ] Test with article that has no keywords
- [ ] Test with article that has many keywords
- [ ] Check UI updates after refresh
- [ ] Verify alerts are created correctly
