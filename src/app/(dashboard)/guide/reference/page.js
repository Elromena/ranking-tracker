"use client";

import { SectionHeading, SubHeading, P, Tip } from "../_components";

export default function GuideReferencePage() {
  return (
    <div>
      <SectionHeading>Key Concepts Reference</SectionHeading>

      <SubHeading>Position Change Direction</SubHeading>
      <ul className="text-sm text-slate-600 space-y-1.5 ml-4 list-disc mb-4">
        <li><strong className="text-emerald-600">+N</strong>: improved (e.g., 18 to 9)</li>
        <li><strong className="text-red-600">-N</strong>: dropped (e.g., 7 to 15)</li>
      </ul>

      <SubHeading>Cannibalization</SubHeading>
      <P>
        Cannibalization means multiple URLs from your own domain rank for the same keyword.
        The app stores these in <code>otherUrls</code> and surfaces them in Overview.
      </P>

      <SubHeading>Cron Frequency</SubHeading>
      <P>
        In Progress/In Review are checked every run; Monitoring every 7 days; Backlog every 30 days; Parked skipped.
      </P>

      <Tip>
        “Cron succeeded with 0 calls” can still be expected behavior under stage-based scheduling.
      </Tip>
    </div>
  );
}
