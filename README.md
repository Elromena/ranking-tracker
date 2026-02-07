# 📊 SEO Ranking Tracker — blockchain-ads.com

Weekly keyword ranking tracker that pulls data from Google Search Console + DataForSEO, stores in Postgres, alerts via Telegram, and shows everything in a dashboard.

## What it does

Every Monday at 6 AM UTC, the cron job:
1. Reads all tracked URLs and their keywords from the database
2. Pulls last 7 days of search data from Google Search Console (clicks, impressions, CTR, avg position)
3. Pulls live SERP positions from DataForSEO for each keyword
4. Compares to previous week and flags position drops, page 1 exits, and recoveries
5. Auto-discovers new keywords from GSC (if enabled)
6. Sends a summary to your Telegram group with all alerts
7. Archives old data to keep the database lean

## Stack

- **Next.js 14** — dashboard + API routes
- **PostgreSQL** — data storage (Railway addon)
- **Prisma** — database ORM
- **Google Search Console API** — real traffic data
- **DataForSEO API** — live SERP positions
- **Telegram Bot API** — alert notifications
- **Railway** — hosting + cron scheduling

---

## 🚀 Deploy to Railway (15 minutes)

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ranking-tracker.git
git push -u origin main
```

### Step 2: Create Railway project

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub Repo
2. Select your `ranking-tracker` repo
3. Railway auto-detects Next.js and starts building

### Step 3: Add PostgreSQL

1. In your Railway project → **+ New** → **Database** → **PostgreSQL**
2. Railway auto-sets `DATABASE_URL` — no config needed

### Step 4: Set environment variables

In Railway → your service → **Variables** tab, add:

| Variable | Value |
|---|---|
| `GSC_CREDENTIALS` | Your Google service account JSON (see below) |
| `GSC_PROPERTY` | `https://blockchain-ads.com` |
| `DATAFORSEO_LOGIN` | Your DataForSEO login |
| `DATAFORSEO_PASSWORD` | Your DataForSEO password |
| `TELEGRAM_BOT_TOKEN` | From @BotFather (see below) |
| `TELEGRAM_CHAT_ID` | Your group chat ID (see below) |
| `CRON_SECRET` | Any random string (e.g. `mySecret123`) |
| `DASHBOARD_URL` | Your Railway app URL (after first deploy) |

### Step 5: Seed the database

After first deploy, open the Railway service shell or run:

```bash
# Via Railway CLI
railway run npm run db:seed
```

Or skip seeding and add articles through the dashboard UI.

### Step 6: Set up the cron job

In Railway → your project → **+ New** → **Cron Job**:
- **Schedule**: `0 6 * * 1` (every Monday 6 AM UTC)
- **Command**: `node scripts/cron.js`
- Set the same environment variables, plus:
  - `APP_URL` = your Railway app URL (e.g. `https://ranking-tracker-production.up.railway.app`)

---

## 🔑 Setting up API keys

### Google Search Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable the **Search Console API**
4. Go to **IAM & Admin** → **Service Accounts** → Create
5. Download the JSON key
6. Go to [Search Console](https://search.google.com/search-console) → Settings → Users → Add the service account email as a **Full** user
7. Paste the entire JSON as the `GSC_CREDENTIALS` env var

### DataForSEO

1. Sign up at [dataforseo.com](https://dataforseo.com)
2. Go to API Dashboard → get your login and password
3. Free trial gives you credits to test

### Telegram Bot

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` → follow the prompts → copy the token
3. Create a group chat and add your bot
4. To get the chat ID, visit: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
5. Send a message in your group, refresh the URL, and find `"chat":{"id":-100XXXXXXXXX}`

---

## 💻 Local development

```bash
# Install dependencies
npm install

# Set up .env (copy from .env.example and fill in)
cp .env.example .env

# Push database schema
npm run db:push

# Seed with sample data
npm run db:seed

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Run cron manually

From the Settings page in the dashboard, click **"Run Data Collection Now"** — or:

```bash
npm run cron
```

---

## 📁 Project structure

```
├── prisma/
│   └── schema.prisma          # Database schema (5 tables)
├── scripts/
│   ├── cron.js                # Standalone cron runner
│   └── seed.js                # Database seeder
├── src/
│   ├── app/
│   │   ├── layout.js          # Root layout + fonts
│   │   ├── page.js            # Full dashboard (client component)
│   │   └── api/
│   │       ├── urls/           # CRUD for tracked URLs
│   │       ├── weekly/         # Aggregated weekly report data
│   │       ├── alerts/         # Alert management
│   │       ├── config/         # Settings key-value store
│   │       └── cron/           # HTTP-triggered data collection
│   └── lib/
│       ├── db.js              # Prisma client singleton
│       ├── gsc.js             # Google Search Console client
│       ├── dataforseo.js      # DataForSEO SERP checker
│       └── telegram.js        # Telegram notifications
├── railway.json               # Railway deploy config
├── .env.example               # Environment variables template
└── package.json
```

## Database schema

- **tracked_urls** — articles being monitored (url, title, category, status, priority)
- **keywords** — keywords per URL (keyword, source, intent, tracked flag)
- **weekly_snapshots** — weekly data points (GSC metrics + SERP position per keyword)
- **alerts** — triggered alerts with severity, status, and action tracking
- **notes** — changelog entries per URL
- **config** — app settings (thresholds, toggles, etc.)
