"use client";

import { Img, SectionHeading, SubHeading, P, Tip, StageRow } from "../_components";

export default function GuideWorkbenchPage() {
  return (
    <div>
      <SectionHeading>Workbench</SectionHeading>
      <P>
        Workbench is the operational pipeline for locale URLs. Stage determines crawl frequency and
        therefore DataForSEO cost and freshness.
      </P>
      <Img
        src="/guide/workbench.png"
        alt="Workbench"
        caption="Kanban flow for content optimization lifecycle."
      />

      <SubHeading>Stages and Check Frequency</SubHeading>
      <div className="card px-4 py-3 my-4">
        <StageRow color="#3b82f6" label="In Progress" desc="Checked every run (daily schedule recommended)." />
        <StageRow color="#f59e0b" label="In Review" desc="Checked every run while review window is active." />
        <StageRow color="#10b981" label="Monitoring" desc="Checked every 7 days." />
        <StageRow color="#94a3b8" label="Backlog" desc="Checked every 30 days." />
        <StageRow color="#64748b" label="Parked" desc="Skipped." />
      </div>

      <SubHeading>How To Use</SubHeading>
      <ul className="text-sm text-slate-600 space-y-1.5 ml-4 list-disc mb-4">
        <li>Move cards as work progresses, not just for organization.</li>
        <li>Use notes when changing content so review impact is traceable.</li>
        <li>Keep strategic pages in In Progress/In Review for daily freshness.</li>
      </ul>

      <Tip>
        If cron logs show <strong>0 keywords</strong>, it usually means nothing is due yet under current stages.
      </Tip>
    </div>
  );
}
