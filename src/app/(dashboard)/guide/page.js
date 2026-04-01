"use client";

import Link from "next/link";
import { Rocket } from "lucide-react";
import { Img, SectionHeading, SubHeading, P, Tip, KeyBadge } from "./_components";

export default function GuideGettingStartedPage() {
  return (
    <div>
      <SectionHeading>Getting Started</SectionHeading>
      <P>
        Ranking Tracker monitors where your article URLs rank in Google across locales and countries.
        It stores daily/weekly/monthly snapshots by stage, tracks page-level GSC traffic, and surfaces
        movements, trends, cannibalization, and SERP landscape changes.
      </P>

      <SubHeading>Core Terms</SubHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
        {[
          { title: "Article", desc: "Content entity grouping all locale URLs." },
          { title: "Locale", desc: "Language variant URL (EN, RU, KO, etc.)." },
          { title: "Keyword", desc: "Tracked search term per locale URL." },
          { title: "Snapshot", desc: "Position data point for keyword/date/country." },
          { title: "Page Traffic", desc: "GSC clicks/impressions for the full page URL." },
          { title: "SERP Landscape", desc: "Saved top-20 SERP rows for side-by-side comparisons." },
        ].map((c) => (
          <div key={c.title} className="card px-4 py-3">
            <div className="text-xs font-bold text-slate-900">{c.title}</div>
            <div className="text-xs text-slate-500 mt-1">{c.desc}</div>
          </div>
        ))}
      </div>

      <SubHeading>Navigation</SubHeading>
      <P>
        Use the left app sidebar to switch between Dashboard, Workbench, Insights, Cost, Settings,
        and Guide. Inside the Guide, use the guide sidebar to move across focused sub-pages.
      </P>
      <Img
        src="/guide/sidebar-expanded.png"
        alt="Sidebar navigation expanded"
        caption="Collapse the app sidebar to free space; guide content is now split into sub-pages."
      />

      <SubHeading>Quick Jump</SubHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
        {[
          { href: "/guide/dashboard", title: "Dashboard", desc: "Overview cards, list filtering, and article entry points." },
          { href: "/guide/adding-articles", title: "Adding Articles", desc: "Create article/locale/keyword tracking records correctly." },
          { href: "/guide/article-detail", title: "Article Detail", desc: "Charts, keyword table, tabs, and manual ranking checks." },
          { href: "/guide/serp-landscape", title: "SERP Landscape", desc: "Side-by-side SERP with curved lines and feature-aware positions." },
          { href: "/guide/workbench", title: "Workbench", desc: "Stage flow and crawl-frequency behavior by pipeline status." },
          { href: "/guide/insights", title: "Insights", desc: "Status, movements, and long-term trend monitoring." },
          { href: "/guide/cost", title: "Cost & Usage", desc: "Run logs, API calls, and cost interpretation." },
          { href: "/guide/settings", title: "Settings", desc: "Credentials, integrations, and operations." },
          { href: "/guide/notes", title: "Notes & Tracking", desc: "Change logging and review-based impact analysis." },
          { href: "/guide/reference", title: "Key Concepts", desc: "Core definitions and interpretation rules." },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="card px-4 py-3 hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <div className="text-xs font-bold text-slate-900">{item.title}</div>
            <div className="text-xs text-slate-500 mt-1">{item.desc}</div>
          </Link>
        ))}
      </div>

      <Tip>
        Start with <KeyBadge><Rocket size={10} /> Getting Started</KeyBadge>, then read
        <KeyBadge>SERP Landscape</KeyBadge> and <KeyBadge>Workbench</KeyBadge> to understand
        ranking checks and scheduling behavior.
      </Tip>
    </div>
  );
}
