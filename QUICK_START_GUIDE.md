# Quick Start Guide - New Features

## ✅ WHAT WAS FIXED & ADDED

### Fixed from Previous Session
1. ✅ Manual cron trigger now works
2. ✅ GSC connection test button added
3. ✅ No more hardcoded secrets

### New Features (Just Added)
1. ✅ **Backfill 4 weeks of historical data**
2. ✅ **Refresh individual articles on-demand**

---

## 🚀 HOW TO USE RIGHT NOW

### Step 1: Wait for Deployment (2-3 minutes)
Railway is automatically rebuilding your app now.
Check: https://ranking-tracker-production.up.railway.app/

### Step 2: Test GSC Connection
```
1. Go to Settings
2. Click "🔍 Test GSC Connection"
3. Should show:
   ✅ GSC Connection Working!
   - Your service account email
   - Sample keywords from your site
```

### Step 3: Backfill Historical Data (RECOMMENDED)
```
1. Still in Settings > Manual Actions
2. Click "⏮ Backfill Historical Data"
3. Wait 2-5 minutes (pulls 4 weeks of data)
4. See results:
   ✅ Backfill completed in 125.3s
   Created 84 snapshots, skipped 12 existing
   Processed 4 weeks
```

**Why do this?** You'll now have 4 weeks of ranking data to see actual trends instead of just 1-2 weeks.

### Step 4: View Your Trends
```
1. Click "Weekly Report" in sidebar
2. You'll now see 4 weeks of data for each article
3. Click any article to expand and see keyword-level trends
4. See position changes week over week
```

### Step 5: Test Individual Article Refresh
```
1. Go to Dashboard
2. Click on any article (e.g., "Crypto Affiliate Programs")
3. Click "🔄 Refresh Rankings" button at the top
4. Wait 10-30 seconds
5. See updated data:
   ✅ Rankings updated in 15.2s
   Processed 4 keywords • GSC: 4 • DFS: 4
   Alerts: 0 critical, 1 warnings, 2 positive
```

---

## 📊 WHAT YOU'LL SEE

### Before Backfill
- Only 1-2 weeks of data
- Hard to tell if changes are trends or fluctuations
- Can't see if SEO work from 3 weeks ago helped

### After Backfill
- 4 weeks of historical GSC data
- Clear trend lines in charts
- See week-over-week position changes
- Context for all your ranking alerts

---

## 🎯 WHEN TO USE WHAT

### Use "Run Data Collection Now" when:
- You want to update ALL articles at once
- It's been a week since last cron run
- You want a full system refresh

### Use "Backfill Historical Data" when:
- First time setting up (do this once)
- You want more historical context
- Monthly refresh to extend data retention

### Use "Refresh Rankings" (individual) when:
- Just published a new article
- Made changes to one specific article
- Want immediate feedback on one article
- Troubleshooting data issues for one article

---

## 💡 ANSWERS TO YOUR QUESTIONS

### Q1: "Is there a way to pull data for the last 4 weeks?"
**A: YES!** Use the "Backfill Historical Data" button in Settings.

**What it does:**
- Pulls GSC data (clicks, impressions, CTR, position) for last 4 weeks
- Only uses DataForSEO credits for current week
- Historical weeks use free GSC data
- Skips any data you already have

**Result:** You'll see 4 weeks of trends in your Weekly Report and article detail charts.

### Q2: "Is there a way to manually trigger rankings for individual articles?"
**A: YES!** Use the "🔄 Refresh Rankings" button in article detail view.

**What it does:**
- Pulls latest GSC data for that article only
- Gets live SERP positions from DataForSEO
- Creates alerts if rankings dropped/improved
- Auto-discovers new keywords (if enabled)
- Updates immediately - no waiting

**Use cases:**
- New article just published → Refresh to see initial rankings
- Updated meta title → Refresh to see if it helped
- Competitor published something → Refresh to check your position
- Article showing errors → Refresh to troubleshoot

---

## 🔍 CHECKING IF IT'S WORKING

### Test GSC Connection
**What you should see:**
```
✅ GSC Connection Working!
Service Account: your-bot@project.iam.gserviceaccount.com
Retrieved 150 keywords from GSC

Sample keywords:
• crypto affiliate programs - Pos: 8.5, Clicks: 23
• best crypto ads - Pos: 3.2, Clicks: 45
• blockchain advertising - Pos: 12.1, Clicks: 15
```

**If you see errors:**
- "GSC_CREDENTIALS not set" → Add in Railway env variables
- "permission denied" → Add service account to Search Console users
- "property not found" → Check GSC_PROPERTY matches your verified property

### Test Backfill
**What you should see:**
```
✅ Backfill completed in 125.3s
Created 84 snapshots, skipped 12 existing
Processed 4 weeks

Starting backfill for last 4 weeks
Processing 2 URLs

Week 1: 2026-02-09 (GSC: 2026-01-30 to 2026-02-06)
  Crypto Affiliate Programs: GSC returned 4 keywords
  Crypto Ad Networks: GSC returned 2 keywords
...
```

**Then check Weekly Report:**
- Should show 4 weeks of data instead of 1-2
- Charts should have more data points
- Position changes visible across weeks

### Test Individual Refresh
**What you should see:**
```
✅ Rankings updated in 15.2s
Processed 4 keywords • GSC: 4 • DFS: 4
Alerts: 0 critical, 1 warnings, 2 positive
```

**Then check the article:**
- Charts update with new data point
- Snapshots table shows new entry
- Alerts section shows any new alerts

---

## 📝 IMPORTANT NOTES

### DataForSEO Credits
- **Backfill:** Only uses credits for current week (~6 keywords)
- **Individual refresh:** Uses credits for that article's keywords (~2-6 keywords)
- **Full cron:** Uses credits for all keywords (~20-50 keywords)

**Recommendation:** Use backfill once, individual refresh as needed, let weekly cron handle routine updates.

### GSC Data Delay
- GSC data is typically 3 days old
- New articles may not show data for 3-4 days
- This is normal - Google needs time to process data

### Rate Limits
- DataForSEO: 100 keywords per minute
- If you trigger too many refreshes quickly, you'll hit rate limit
- Wait 1 minute and try again

---

## 🎬 RECOMMENDED FIRST RUN

**Do this in order:**

1. **Test GSC** (30 seconds)
   - Settings → Test GSC Connection
   - Verify it's working

2. **Backfill Data** (2-5 minutes)
   - Settings → Backfill Historical Data
   - Get 4 weeks of context

3. **View Trends** (1 minute)
   - Weekly Report → See all 4 weeks
   - Check which articles are trending up/down

4. **Test Individual Refresh** (30 seconds)
   - Dashboard → Pick an article
   - Click Refresh Rankings
   - See immediate update

5. **Review Alerts** (1 minute)
   - Alerts Inbox → See what needs attention
   - Critical alerts first

**Total time:** ~10 minutes to get fully set up with historical data

---

## 🆘 TROUBLESHOOTING

### "Backfill shows 0 snapshots created"
- Your data might already be complete
- Or articles are too new (< 3 days old)
- Check Weekly Report to see if data is there

### "Individual refresh says 0 keywords processed"
- Article might have no tracked keywords
- Add keywords manually or enable auto-discovery

### "GSC test fails with permission denied"
1. Go to Google Search Console
2. Click Settings → Users and permissions
3. Add your service account email (from error message)
4. Give it "Full" permission
5. Wait 2-3 minutes
6. Test again

### "Refresh button shows error"
- Check error message in red box
- Common: rate limit (wait 1 minute)
- Or: GSC connection issue (test GSC first)

---

## 📚 MORE INFO

- **Full Documentation:** See `NEW_FEATURES.md` in repo
- **Settings Fixes:** See `FIXES_APPLIED.md` in repo
- **Audit Report:** See `AUDIT_REPORT.md` in repo

---

## 🎉 YOU'RE ALL SET!

Your ranking tracker now has:
- ✅ 4 weeks of historical data (after backfill)
- ✅ Individual article refresh capability
- ✅ Working manual cron trigger
- ✅ GSC connection testing
- ✅ Detailed error messages and logs

**Next:** Run backfill, let weekly cron handle routine updates, use individual refresh for new articles or after making changes.
