"use client";

import { Img, SectionHeading, SubHeading, P, Tip } from "../_components";

export default function GuideArticleDetailPage() {
  return (
    <div>
      <SectionHeading>Article Detail</SectionHeading>
      <P>
        Article Detail is your analysis workspace: trend chart, keyword table, notes timeline,
        stage management, and manual ranking checks.
      </P>
      <Img
        src="/guide/article-detail.png"
        alt="Article detail page"
        caption="Overview tab with chart, traffic and ranking context."
      />

      <SubHeading>Tabs</SubHeading>
      <ul className="text-sm text-slate-600 space-y-1.5 ml-4 list-disc mb-4">
        <li><strong>Overview:</strong> chart + traffic + impact + SERP features + cannibalization warning</li>
        <li><strong>Keywords:</strong> rows with position, change, records, and SERP features</li>
        <li><strong>SERP Landscape:</strong> side-by-side SERP comparison with curved movement lines</li>
        <li><strong>Change Log:</strong> notes and optimization history</li>
      </ul>

      <Img
        src="/guide/article-keywords.png"
        alt="Keywords tab"
        caption="Keywords table for deeper diagnostics."
      />

      <Tip>
        Use the <strong>Check Rankings</strong> button for immediate refresh without waiting for the next cron cycle.
      </Tip>
    </div>
  );
}
