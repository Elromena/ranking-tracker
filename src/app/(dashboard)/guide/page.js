"use client";

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

      <Tip>
        Start with <KeyBadge><Rocket size={10} /> Getting Started</KeyBadge>, then read
        <KeyBadge>SERP Landscape</KeyBadge> and <KeyBadge>Workbench</KeyBadge> to understand
        ranking checks and scheduling behavior.
      </Tip>
    </div>
  );
}
