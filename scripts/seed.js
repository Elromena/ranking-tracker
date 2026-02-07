/**
 * Seed script — populate database with initial articles and keywords
 * 
 * Usage: node scripts/seed.js
 * 
 * This creates the same mock data from the dashboard prototype
 * so you can see the app working before the first real cron run.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SEED_DATA = [
  {
    url: 'https://blockchain-ads.com/blog/what-is-web3-advertising',
    title: 'What is Web3 Advertising',
    category: 'Advertising',
    status: 'active',
    priority: 'high',
    keywords: [
      { keyword: 'web3 advertising', source: 'manual', intent: 'informational' },
      { keyword: 'blockchain advertising', source: 'gsc', intent: 'informational' },
      { keyword: 'web3 ads', source: 'gsc', intent: 'commercial' },
      { keyword: 'crypto advertising platform', source: 'gsc', intent: 'commercial' },
      { keyword: 'decentralized advertising', source: 'manual', intent: 'informational' },
      { keyword: 'web3 digital marketing', source: 'gsc', intent: 'informational' },
    ],
    notes: ['Added 2025 stats, refreshed intro paragraph', 'Noticed gradual decline #3→#8, investigating', 'Added FAQ schema markup'],
  },
  {
    url: 'https://blockchain-ads.com/blog/crypto-gaming-ads-guide',
    title: 'Crypto Gaming Ads Guide',
    category: 'Gaming',
    status: 'active',
    priority: 'high',
    keywords: [
      { keyword: 'crypto gaming ads', source: 'manual', intent: 'commercial' },
      { keyword: 'blockchain gaming marketing', source: 'manual', intent: 'informational' },
      { keyword: 'web3 gaming advertising', source: 'gsc', intent: 'commercial' },
      { keyword: 'play to earn advertising', source: 'gsc', intent: 'commercial' },
      { keyword: 'gamefi marketing', source: 'gsc', intent: 'informational' },
    ],
    notes: ['Stable — no action needed', 'Refreshed stats section'],
  },
  {
    url: 'https://blockchain-ads.com/blog/telegram-advertising-crypto',
    title: 'Telegram Advertising Crypto',
    category: 'Advertising',
    status: 'growing',
    priority: 'high',
    keywords: [
      { keyword: 'telegram advertising crypto', source: 'manual', intent: 'commercial' },
      { keyword: 'telegram crypto ads', source: 'manual', intent: 'commercial' },
      { keyword: 'telegram marketing crypto', source: 'gsc', intent: 'informational' },
      { keyword: 'telegram mini apps advertising', source: 'gsc', intent: 'commercial' },
      { keyword: 'crypto community advertising', source: 'gsc', intent: 'informational' },
    ],
    notes: ['Hit #2 for main keyword! 🎉', 'Trending — pushing more internal links'],
  },
  {
    url: 'https://blockchain-ads.com/blog/defi-marketing-guide',
    title: 'DeFi Marketing Guide',
    category: 'Fintech',
    status: 'declining',
    priority: 'urgent',
    keywords: [
      { keyword: 'defi marketing', source: 'manual', intent: 'informational' },
      { keyword: 'defi advertising', source: 'manual', intent: 'commercial' },
      { keyword: 'decentralized finance marketing', source: 'gsc', intent: 'informational' },
      { keyword: 'defi user acquisition', source: 'gsc', intent: 'commercial' },
      { keyword: 'defi growth strategy', source: 'gsc', intent: 'informational' },
    ],
    notes: ['🚨 ALERT — dropped from #4→#12 in 2 weeks', 'Content refresh in progress'],
  },
  {
    url: 'https://blockchain-ads.com/blog/programmatic-crypto-advertising',
    title: 'Programmatic Crypto Advertising',
    category: 'Advertising',
    status: 'recovering',
    priority: 'medium',
    keywords: [
      { keyword: 'programmatic crypto advertising', source: 'manual', intent: 'commercial' },
      { keyword: 'crypto programmatic ads', source: 'manual', intent: 'commercial' },
      { keyword: 'blockchain ad exchange', source: 'gsc', intent: 'commercial' },
      { keyword: 'crypto dsp', source: 'gsc', intent: 'commercial' },
      { keyword: 'web3 programmatic', source: 'gsc', intent: 'informational' },
    ],
    notes: ['Recovery confirmed — #9→#4 since rewrite', 'Major rewrite — updated for 2025 trends'],
  },
  {
    url: 'https://blockchain-ads.com/blog/fintech-advertising-strategies',
    title: 'Fintech Advertising Strategies',
    category: 'Fintech',
    status: 'active',
    priority: 'medium',
    keywords: [
      { keyword: 'fintech advertising', source: 'manual', intent: 'commercial' },
      { keyword: 'fintech marketing strategies', source: 'manual', intent: 'informational' },
      { keyword: 'financial services ads', source: 'gsc', intent: 'commercial' },
      { keyword: 'neobank advertising', source: 'gsc', intent: 'commercial' },
      { keyword: 'fintech growth marketing', source: 'gsc', intent: 'informational' },
    ],
    notes: ['Competitor published similar piece — monitor'],
  },
];

const DEFAULT_CONFIG = {
  gscProperty: 'https://blockchain-ads.com',
  dfsCountry: 'us',
  dfsLanguage: 'en',
  alertThreshold: '3',
  clickDropPct: '20',
  page1Alert: 'true',
  autoAddGsc: 'true',
  autoAddMinImpr: '100',
  maxKwPerUrl: '10',
  archiveWeeks: '13',
};

async function seed() {
  console.log('🌱 Seeding database...\n');

  // Clear existing data
  await prisma.alert.deleteMany();
  await prisma.weeklySnapshot.deleteMany();
  await prisma.note.deleteMany();
  await prisma.keyword.deleteMany();
  await prisma.trackedUrl.deleteMany();
  await prisma.config.deleteMany();

  // Create URLs with keywords and notes
  for (const data of SEED_DATA) {
    const url = await prisma.trackedUrl.create({
      data: {
        url: data.url,
        title: data.title,
        category: data.category,
        status: data.status,
        priority: data.priority,
        keywords: {
          create: data.keywords.map(kw => ({
            keyword: kw.keyword,
            source: kw.source,
            intent: kw.intent,
            tracked: true,
          })),
        },
        notes: {
          create: data.notes.map(text => ({ text })),
        },
      },
    });
    console.log(`  ✅ ${url.title} (${data.keywords.length} keywords)`);
  }

  // Seed config
  for (const [key, value] of Object.entries(DEFAULT_CONFIG)) {
    await prisma.config.create({ data: { key, value } });
  }
  console.log(`\n  ⚙️  ${Object.keys(DEFAULT_CONFIG).length} config entries`);

  console.log('\n✅ Seed complete!\n');
}

seed()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
