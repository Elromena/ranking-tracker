"use client";

import { useState, useEffect, useRef } from "react";
import {
  BarChart3,
  LayoutGrid,
  Lightbulb,
  DollarSign,
  Settings,
  BookOpen,
  Plus,
  ArrowLeft,
  Pencil,
  Trash2,
  RefreshCw,
  GripVertical,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  ChevronRight,
} from "lucide-react";

const SECTIONS = [
  { id: "getting-started", label: "Getting Started" },
  { id: "dashboard", label: "Dashboard" },
  { id: "adding-articles", label: "Adding Articles" },
  { id: "article-detail", label: "Article Detail" },
  { id: "workbench", label: "Workbench" },
  { id: "insights", label: "Insights" },
  { id: "cost-usage", label: "Cost & Usage" },
  { id: "settings", label: "Settings" },
  { id: "notes", label: "Notes & Change Tracking" },
  { id: "reference", label: "Key Concepts" },
];

function Img({ src, alt, caption }) {
  return (
    <figure className="my-5">
      <img
        src={src}
        alt={alt}
        className="w-full rounded-lg border border-slate-200 shadow-sm"
        loading="lazy"
      />
      {caption && (
        <figcaption className="text-xs text-slate-400 mt-2 text-center italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function SectionHeading({ id, children }) {
  return (
    <h2 id={id} className="text-lg font-bold text-slate-900 mt-10 mb-3 scroll-mt-6">
      {children}
    </h2>
  );
}

function SubHeading({ children }) {
  return <h3 className="text-sm font-bold text-slate-700 mt-6 mb-2">{children}</h3>;
}

function P({ children }) {
  return <p className="text-sm text-slate-600 leading-relaxed mb-3">{children}</p>;
}

function Tip({ children }) {
  return (
    <div className="flex gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 my-4 text-sm text-blue-800">
      <Lightbulb size={16} className="shrink-0 mt-0.5 text-blue-500" />
      <div>{children}</div>
    </div>
  );
}

function KeyBadge({ children }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-[11px] font-mono font-semibold text-slate-700 border border-slate-200">
      {children}
    </span>
  );
}

function StageRow({ color, label, desc }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span
        className="mt-1 w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <div>
        <span className="text-sm font-semibold text-slate-800">{label}</span>
        <span className="text-sm text-slate-500 ml-2">{desc}</span>
      </div>
    </div>
  );
}

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState("getting-started");
  const observerRef = useRef(null);

  useEffect(() => {
    const headings = document.querySelectorAll("h2[id]");
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-10% 0px -80% 0px" }
    );
    headings.forEach((h) => observerRef.current.observe(h));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="flex gap-8">
      {/* Sticky Table of Contents */}
      <nav className="hidden lg:block w-48 shrink-0 sticky top-6 self-start">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
          User Guide
        </div>
        <ul className="space-y-0.5">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className={`block px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeSection === s.id
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content */}
      <div className="flex-1 min-w-0 max-w-3xl pb-20">
        <div className="mb-6">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
            User Guide
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Everything your team needs to know about using the Ranking Tracker
          </p>
        </div>

        {/* ── Getting Started ── */}
        <SectionHeading id="getting-started">Getting Started</SectionHeading>
        <P>
          Ranking Tracker monitors your articles&apos; Google search positions across
          multiple locales and keywords. It uses DataForSEO to check SERP rankings
          and Google Search Console (GSC) for page-level traffic data.
        </P>

        <SubHeading>Core Concepts</SubHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
          {[
            {
              title: "Article",
              desc: "A piece of content (e.g. a blog post). Groups all its locale variants together.",
            },
            {
              title: "Locale",
              desc: "A language variant of an article (EN, RU, KO, etc.), each with its own URL and keywords.",
            },
            {
              title: "Keyword",
              desc: "A search term you track for a specific locale. Each keyword gets daily position checks.",
            },
            {
              title: "Snapshot",
              desc: "A single position data point for a keyword on a specific date and country.",
            },
            {
              title: "Stage",
              desc: "Where an article locale is in your workflow pipeline (Backlog through Monitoring).",
            },
            {
              title: "Page Traffic",
              desc: "Aggregate GSC data (clicks, impressions) for an entire page URL, not per keyword.",
            },
          ].map((c) => (
            <div
              key={c.title}
              className="card px-4 py-3"
            >
              <div className="text-xs font-bold text-slate-900">{c.title}</div>
              <div className="text-xs text-slate-500 mt-1">{c.desc}</div>
            </div>
          ))}
        </div>

        <SubHeading>Navigation</SubHeading>
        <P>
          The sidebar on the left gives you access to all sections. You can collapse
          it by clicking the collapse button at the bottom to give yourself more
          screen space. The collapsed state is remembered across sessions.
        </P>
        <Img
          src="/guide/sidebar-expanded.png"
          alt="Sidebar navigation expanded"
          caption="The sidebar with all navigation links. Click 'Collapse' at the bottom to minimize it."
        />

        {/* ── Dashboard ── */}
        <SectionHeading id="dashboard">Dashboard</SectionHeading>
        <P>
          The Dashboard is your home screen. It shows a high-level overview of all
          tracked articles with summary metrics at the top.
        </P>
        <Img
          src="/guide/dashboard.png"
          alt="Dashboard overview"
          caption="Dashboard showing summary cards and article list with locale performance."
        />

        <SubHeading>Summary Cards</SubHeading>
        <ul className="text-sm text-slate-600 space-y-1.5 ml-4 list-disc mb-4">
          <li><strong>Total Articles</strong> &mdash; Number of articles you&apos;re tracking</li>
          <li><strong>Active Locales</strong> &mdash; Total locale variants with tracking enabled</li>
          <li><strong>Avg Position</strong> &mdash; Average ranking position across all tracked keywords</li>
          <li><strong>Needs Attention</strong> &mdash; Articles that have dropped more than 3 positions recently</li>
        </ul>

        <SubHeading>Filtering and Search</SubHeading>
        <P>
          Use the search bar to find articles by title or slug. The dropdown
          filters let you narrow by category or locale. These filters apply to the
          article list below the summary cards.
        </P>

        <SubHeading>Article Cards</SubHeading>
        <P>
          Each article card shows the title, category, slug, locale badges with
          average position and recent change, and keyword count. Click any article
          card to open its detail page.
        </P>
        <Tip>
          Green position changes (e.g. <strong>+8</strong>) mean the keyword moved <em>up</em> in
          rankings (closer to position 1). Red changes mean it moved <em>down</em>.
        </Tip>

        {/* ── Adding Articles ── */}
        <SectionHeading id="adding-articles">Adding Articles</SectionHeading>
        <P>
          Click the <KeyBadge><Plus size={10} /> Add Article</KeyBadge> button on the
          Dashboard to open the article creation modal.
        </P>

        <SubHeading>Step-by-Step</SubHeading>
        <ol className="text-sm text-slate-600 space-y-2 ml-4 list-decimal mb-4">
          <li>
            <strong>Article Title</strong> &mdash; Enter a descriptive title for the
            content piece (e.g. &quot;Best Crypto Ad Networks&quot;).
          </li>
          <li>
            <strong>Category</strong> &mdash; Select from your configured categories
            or type a new one.
          </li>
          <li>
            <strong>Add Locale</strong> &mdash; Click &quot;Add Locale&quot; to add a language variant.
            For each locale:
            <ul className="list-disc ml-4 mt-1 space-y-1">
              <li>Select the <strong>locale</strong> (EN, RU, KO, etc.)</li>
              <li>Paste the <strong>full URL</strong> of the page</li>
              <li>Add <strong>keywords</strong> you want to track &mdash; one per line or comma-separated</li>
              <li>Set the <strong>intent</strong> for each keyword (informational, commercial, transactional, navigational)</li>
            </ul>
          </li>
          <li>
            <strong>Save</strong> &mdash; The article and its locales are created.
            Keywords will be checked on the next cron run.
          </li>
        </ol>
        <Tip>
          You can add more locales or keywords to an existing article later by
          clicking <KeyBadge><Pencil size={10} /> Edit</KeyBadge> on the article detail page.
        </Tip>

        {/* ── Article Detail ── */}
        <SectionHeading id="article-detail">Article Detail</SectionHeading>
        <P>
          Click any article from the Dashboard to open its detail page. This is
          where you do most of your analysis work.
        </P>
        <Img
          src="/guide/article-detail.png"
          alt="Article detail page with ranking chart"
          caption="Article detail showing the SERP ranking chart in the Overview tab."
        />

        <SubHeading>Header Actions</SubHeading>
        <ul className="text-sm text-slate-600 space-y-1.5 ml-4 list-disc mb-4">
          <li><KeyBadge><ArrowLeft size={10} /> Back</KeyBadge> &mdash; Return to the Dashboard</li>
          <li><KeyBadge><Pencil size={10} /> Edit</KeyBadge> &mdash; Open the edit modal to change title, category, add/remove locales and keywords</li>
          <li><KeyBadge><RefreshCw size={10} /></KeyBadge> &mdash; Refresh data from the server</li>
          <li><KeyBadge><Trash2 size={10} /></KeyBadge> &mdash; Delete the article (requires confirmation)</li>
        </ul>

        <SubHeading>Locale Selector</SubHeading>
        <P>
          Below the header, you&apos;ll see locale pills (e.g. &quot;All Locales&quot;, &quot;EN&quot;,
          &quot;RU&quot;). Click one to filter the view to that specific locale. Selecting a
          single locale also reveals the <strong>Stage</strong> selector to change its
          pipeline stage.
        </P>

        <SubHeading>Tabs</SubHeading>
        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-2">
            <span className="badge bg-slate-100 text-slate-700 shrink-0 mt-0.5">Overview</span>
            <span className="text-sm text-slate-600">
              SERP ranking chart with keyword toggle buttons, GSC traffic summary
              cards, SERP feature badges, and impact analysis during review periods.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="badge bg-slate-100 text-slate-700 shrink-0 mt-0.5">Keywords</span>
            <span className="text-sm text-slate-600">
              Data table of all keywords with current position, previous position,
              change, record count, and SERP features.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="badge bg-slate-100 text-slate-700 shrink-0 mt-0.5">Change Log</span>
            <span className="text-sm text-slate-600">
              Timeline of notes you&apos;ve added &mdash; content changes, optimizations,
              technical fixes, algorithm updates. Add new notes here.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="badge bg-slate-100 text-slate-700 shrink-0 mt-0.5">Locale Heatmap</span>
            <span className="text-sm text-slate-600">
              Visible only when &quot;All Locales&quot; is selected. Shows a matrix of
              keyword positions across all locales for quick comparison.
            </span>
          </div>
        </div>

        <Img
          src="/guide/article-keywords.png"
          alt="Keywords tab showing ranking data table"
          caption="The Keywords tab with sortable columns showing position, change, and SERP features."
        />

        <SubHeading>Chart Controls</SubHeading>
        <P>
          Above the chart and keywords table, you&apos;ll find controls that work
          across both the Overview and Keywords tabs:
        </P>
        <ul className="text-sm text-slate-600 space-y-1.5 ml-4 list-disc mb-4">
          <li><strong>Daily / Weekly / Monthly</strong> &mdash; Switches chart aggregation. Weekly averages out noise, monthly shows long-term trends.</li>
          <li><strong>Show Traffic</strong> &mdash; (Overview only) Replaces the keyword position lines with a page-level GSC clicks chart.</li>
          <li><strong>Date range buttons</strong> (7d, 30d, 60d, 90d) &mdash; Quick presets for the data window.</li>
          <li><strong>Custom date range</strong> &mdash; Click the date display to pick specific start/end dates.</li>
          <li><strong>Compare</strong> &mdash; Enables a comparison overlay showing how positions changed between two time periods.</li>
        </ul>

        <SubHeading>Keyword Toggle Buttons</SubHeading>
        <P>
          In the Overview tab, colored buttons above the chart represent each keyword.
          Click a keyword button to toggle its visibility on the chart. This lets
          you focus on specific keywords without clutter.
        </P>

        {/* ── Workbench ── */}
        <SectionHeading id="workbench">Workbench</SectionHeading>
        <P>
          The Workbench is a Kanban-style board for managing your content
          optimization pipeline. Each locale variant of an article is a card that
          moves through stages.
        </P>
        <Img
          src="/guide/workbench.png"
          alt="Workbench Kanban board"
          caption="The Workbench showing pipeline stages with draggable article cards."
        />

        <SubHeading>Pipeline Stages</SubHeading>
        <div className="card px-4 py-3 my-4">
          <StageRow color="#94a3b8" label="Backlog" desc="Articles queued for work. Checked monthly for positions." />
          <StageRow color="#3b82f6" label="In Progress" desc="Actively being optimized. Checked daily to see impact." />
          <StageRow color="#f59e0b" label="In Review" desc="Changes deployed, waiting for Google to re-evaluate. Checked daily. Auto-expires after review period." />
          <StageRow color="#10b981" label="Monitoring" desc="Stable articles being watched. Checked weekly." />
          <StageRow color="#94a3b8" label="Parked" desc="Low priority or paused. Checked monthly." />
        </div>
        <Tip>
          Crawl frequency is tied to stage. &quot;In Progress&quot; and &quot;In Review&quot; articles
          get daily position checks, while &quot;Monitoring&quot; articles are checked weekly.
          This keeps DataForSEO API costs down.
        </Tip>

        <SubHeading>Moving Cards</SubHeading>
        <P>
          You have two ways to move a card to a different stage:
        </P>
        <ul className="text-sm text-slate-600 space-y-1.5 ml-4 list-disc mb-4">
          <li><strong>Drag and drop</strong> &mdash; Grab the handle (<GripVertical size={12} className="inline" />) and drag the card to another column.</li>
          <li><strong>Move button</strong> &mdash; Click the dot buttons at the bottom of each card to quickly jump to a specific stage.</li>
        </ul>

        <SubHeading>Quick Notes</SubHeading>
        <P>
          Each card has a note icon (<MessageSquare size={12} className="inline" />) that opens
          a quick note overlay. Use this to jot down what you changed before moving
          a card to &quot;In Review&quot;. Notes with a type other than &quot;General&quot; can
          automatically start a review period.
        </P>

        {/* ── Insights ── */}
        <SectionHeading id="insights">Insights</SectionHeading>
        <P>
          Insights gives you an analytical view of ranking performance across all
          articles. It has three sub-tabs:
        </P>
        <Img
          src="/guide/insights.png"
          alt="Insights Status page"
          caption="Insights Status tab showing position buckets and per-article keyword breakdowns."
        />

        <SubHeading>Status Tab</SubHeading>
        <P>
          Shows an overview of where all your keywords stand right now:
        </P>
        <ul className="text-sm text-slate-600 space-y-1.5 ml-4 list-disc mb-4">
          <li><strong className="text-green-600">On Target</strong> &mdash; Position 1&ndash;3 (where you want to be)</li>
          <li><strong className="text-amber-600">Close</strong> &mdash; Position 4&ndash;10 (first page, within reach)</li>
          <li><strong className="text-red-600">Off Target</strong> &mdash; Position 11+ (needs work)</li>
          <li><strong className="text-slate-500">Not Ranking</strong> &mdash; No position data found</li>
        </ul>
        <P>
          Below the buckets, keywords are grouped by article so you can see which
          articles need the most attention. The overview cards at the top show total
          drops, gains, average position, and GSC click data.
        </P>

        <SubHeading>Movements Tab</SubHeading>
        <P>
          Shows significant position changes over your selected time period. Keywords
          are split into <strong>Drops</strong> (lost positions) and <strong>Gains</strong> (improved positions),
          grouped by article. Use the day selector to look at 7, 14, 30, or 60-day windows.
        </P>

        <SubHeading>Trends Tab</SubHeading>
        <P>
          Detects gradual declines that might not show up as dramatic single-day
          drops. Flags keywords that have:
        </P>
        <ul className="text-sm text-slate-600 space-y-1.5 ml-4 list-disc mb-4">
          <li><strong>Lost Top 3</strong> &mdash; Were in positions 1&ndash;3 but have slipped out</li>
          <li><strong>Declining</strong> &mdash; Show a consistent downward trend in weekly averages</li>
        </ul>
        <P>
          Each row includes a mini sparkline showing weekly average positions so you
          can visually spot the decline.
        </P>

        {/* ── Cost & Usage ── */}
        <SectionHeading id="cost-usage">Cost & Usage</SectionHeading>
        <P>
          Tracks how much the DataForSEO API is costing you and logs every cron run.
        </P>
        <Img
          src="/guide/cost.png"
          alt="Cost & Usage page"
          caption="Cost & Usage showing monthly totals and the recent runs table."
        />

        <SubHeading>Summary Cards</SubHeading>
        <ul className="text-sm text-slate-600 space-y-1.5 ml-4 list-disc mb-4">
          <li><strong>Month Total</strong> &mdash; Cumulative DataForSEO cost for the current month</li>
          <li><strong>Last Run</strong> &mdash; When the most recent data collection completed</li>
          <li><strong>Next Run Est.</strong> &mdash; Estimated cost of the next cron run based on due keywords</li>
          <li><strong>Month API Calls</strong> &mdash; Total DataForSEO API calls this month</li>
        </ul>

        <SubHeading>Recent Runs Table</SubHeading>
        <P>
          Shows the history of cron executions with status, number of API calls,
          keywords processed, errors encountered, cost, and duration. Use this to
          verify your cron job is running correctly and spot any failures.
        </P>

        {/* ── Settings ── */}
        <SectionHeading id="settings">Settings</SectionHeading>
        <P>
          Configure all external integrations, manage categories and locales, and
          run manual operations.
        </P>
        <Img
          src="/guide/settings.png"
          alt="Settings page"
          caption="Settings page showing API credentials, GSC setup, and Telegram configuration."
        />

        <SubHeading>API Credentials</SubHeading>
        <P>
          Enter your DataForSEO login and password, Telegram bot token and chat ID,
          and your target domain. Click <KeyBadge>Save Configuration</KeyBadge> after
          making changes. Use <KeyBadge>Test DataForSEO</KeyBadge> to verify your
          credentials work.
        </P>

        <SubHeading>Google Search Console</SubHeading>
        <P>
          GSC provides page-level traffic data (clicks, impressions, CTR). It requires
          a service account configured via environment variables. The settings page
          shows step-by-step setup instructions and a <KeyBadge>Test GSC Connection</KeyBadge> button.
        </P>

        <SubHeading>Telegram Notifications</SubHeading>
        <P>
          When enabled, the cron job sends a summary of significant ranking movements
          to your Telegram chat after each run. Follow the setup instructions on the
          page and use <KeyBadge>Test Telegram</KeyBadge> to confirm it works.
        </P>

        <SubHeading>Categories &amp; Locales</SubHeading>
        <P>
          Manage your article categories and locale configurations. You can add new
          locales with custom country targeting and language codes, and toggle them
          on or off.
        </P>

        <SubHeading>Manual Operations</SubHeading>
        <ul className="text-sm text-slate-600 space-y-1.5 ml-4 list-disc mb-4">
          <li><strong>Run Data Collection</strong> &mdash; Manually triggers a cron run to check keyword positions now</li>
          <li><strong>Clear All Ranking Data</strong> &mdash; Deletes all snapshots (requires confirmation). Use with extreme caution.</li>
        </ul>

        {/* ── Notes ── */}
        <SectionHeading id="notes">Notes &amp; Change Tracking</SectionHeading>
        <P>
          Notes let you record what changes you made to an article and when. This is
          essential for correlating ranking changes with your optimization efforts.
        </P>

        <SubHeading>Adding a Note</SubHeading>
        <P>
          Go to an article&apos;s <strong>Change Log</strong> tab. Select the locale,
          choose a note type, enter your text, and optionally set a custom date
          (defaults to today). Click &quot;Add Note&quot; to save.
        </P>

        <SubHeading>Note Types</SubHeading>
        <div className="card px-4 py-3 my-4 space-y-2">
          {[
            { label: "Content Change", color: "#2563eb", bg: "#dbeafe", desc: "Updated text, added sections, rewrote content" },
            { label: "Optimization", color: "#7c3aed", bg: "#ede9fe", desc: "On-page SEO changes, meta tags, internal links" },
            { label: "Technical", color: "#d97706", bg: "#fef3c7", desc: "Page speed, schema markup, crawl fixes" },
            { label: "Algorithm", color: "#dc2626", bg: "#fef2f2", desc: "Known Google algorithm update affecting rankings" },
            { label: "General", color: "#64748b", bg: "#f1f5f9", desc: "General observations, does not trigger review" },
          ].map((t) => (
            <div key={t.label} className="flex items-center gap-3">
              <span
                className="px-2 py-0.5 rounded text-[11px] font-semibold shrink-0"
                style={{ color: t.color, backgroundColor: t.bg }}
              >
                {t.label}
              </span>
              <span className="text-sm text-slate-500">{t.desc}</span>
            </div>
          ))}
        </div>
        <Tip>
          Adding a note with any type other than &quot;General&quot; can automatically move
          the locale into the &quot;In Review&quot; stage and start a review countdown. This
          lets you track whether your changes had an impact on rankings.
        </Tip>

        <SubHeading>Editing and Deleting Notes</SubHeading>
        <P>
          In the Change Log timeline, each note has edit and delete buttons. You can
          update the text or adjust the date after the fact. Deleted notes cannot be recovered.
        </P>

        {/* ── Reference ── */}
        <SectionHeading id="reference">Key Concepts Reference</SectionHeading>

        <SubHeading>Position Change Indicators</SubHeading>
        <div className="card px-4 py-3 my-4 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-green-600">+5</span>
            <span className="text-sm text-slate-500">Improved 5 positions (e.g. 15 &rarr; 10). Green = good.</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-red-600">-3</span>
            <span className="text-sm text-slate-500">Dropped 3 positions (e.g. 10 &rarr; 13). Red = needs attention.</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-400">&mdash;</span>
            <span className="text-sm text-slate-500">No change or no previous data to compare.</span>
          </div>
        </div>

        <SubHeading>Position Buckets (Insights)</SubHeading>
        <div className="card px-4 py-3 my-4 space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
            <span className="text-sm text-slate-600"><strong>On Target</strong> &mdash; Position 1&ndash;3. The goal for every keyword.</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span className="text-sm text-slate-600"><strong>Close</strong> &mdash; Position 4&ndash;10. First page, good opportunity to push higher.</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
            <span className="text-sm text-slate-600"><strong>Off Target</strong> &mdash; Position 11+. Requires optimization work.</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
            <span className="text-sm text-slate-600"><strong>Not Ranking</strong> &mdash; No data found in SERP results.</span>
          </div>
        </div>

        <SubHeading>Crawl Frequency by Stage</SubHeading>
        <div className="card px-4 py-3 my-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wider">
                <th className="pb-2">Stage</th>
                <th className="pb-2">Check Frequency</th>
                <th className="pb-2">Use Case</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              <tr className="border-t border-slate-100">
                <td className="py-2 font-medium">In Progress</td>
                <td className="py-2">Daily</td>
                <td className="py-2">Track immediate impact of changes</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="py-2 font-medium">In Review</td>
                <td className="py-2">Daily</td>
                <td className="py-2">Watch for Google re-evaluation</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="py-2 font-medium">Monitoring</td>
                <td className="py-2">Weekly</td>
                <td className="py-2">Routine health check</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="py-2 font-medium">Backlog</td>
                <td className="py-2">Monthly</td>
                <td className="py-2">Baseline position tracking</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="py-2 font-medium">Parked</td>
                <td className="py-2">Monthly</td>
                <td className="py-2">Minimal monitoring</td>
              </tr>
            </tbody>
          </table>
        </div>

        <SubHeading>Data Sources</SubHeading>
        <div className="card px-4 py-3 my-4 space-y-3">
          <div>
            <span className="text-sm font-semibold text-slate-800">DataForSEO</span>
            <span className="text-sm text-slate-500 ml-2">
              Provides SERP position data and SERP features. Paid API &mdash; cost
              depends on number of keywords and check frequency.
            </span>
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-800">Google Search Console</span>
            <span className="text-sm text-slate-500 ml-2">
              Free. Provides page-level clicks, impressions, CTR, and average
              position. Requires a service account with access to your GSC property.
            </span>
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-800">Telegram</span>
            <span className="text-sm text-slate-500 ml-2">
              Free. Sends ranking movement alerts after each cron run so your team
              stays informed without checking the dashboard.
            </span>
          </div>
        </div>

        <Tip>
          The cron job runs automatically on a schedule. Check the Cost &amp; Usage
          page to see when it last ran and whether there were any errors. If you
          need data immediately, use &quot;Run Data Collection&quot; in Settings.
        </Tip>

      </div>
    </div>
  );
}
