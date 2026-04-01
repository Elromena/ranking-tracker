"use client";

import { Img, SectionHeading, SubHeading, P, Tip } from "../_components";

export default function GuideDashboardPage() {
  return (
    <div>
      <SectionHeading>Dashboard</SectionHeading>
      <P>
        Dashboard gives the highest-level view of tracked articles, locale performance, and quick
        filtering so your team can prioritize what needs action.
      </P>
      <Img
        src="/guide/dashboard.png"
        alt="Dashboard overview"
        caption="Summary cards and article list with locale snapshots."
      />

      <SubHeading>What To Watch</SubHeading>
      <ul className="text-sm text-slate-600 space-y-1.5 ml-4 list-disc mb-4">
        <li><strong>Total Articles</strong>, <strong>Active Locales</strong>, and <strong>Avg Position</strong></li>
        <li><strong>Needs Attention</strong> to catch worsening performance early</li>
        <li>Locale pills on each card for quick per-locale health checks</li>
      </ul>

      <Tip>
        Click an article card to open its detail page for charts, keyword table, SERP landscape, and notes.
      </Tip>
    </div>
  );
}
