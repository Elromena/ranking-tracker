"use client";

import { Img, SectionHeading, SubHeading, P, Tip } from "../_components";

export default function GuideCostPage() {
  return (
    <div>
      <SectionHeading>Cost &amp; Usage</SectionHeading>
      <P>
        Cost &amp; Usage tracks DataForSEO call volume, estimated spend, and recent cron run history.
      </P>
      <Img src="/guide/cost.png" alt="Cost page" caption="Monthly totals and run history." />

      <SubHeading>Run Log Interpretation</SubHeading>
      <ul className="text-sm text-slate-600 space-y-1.5 ml-4 list-disc mb-4">
        <li><strong>0 API calls</strong> does not always mean failure; it often means no locales were due.</li>
        <li>Look at stage distribution and last snapshot date in logs.</li>
        <li>Use manual check when immediate data is required.</li>
      </ul>

      <Tip>
        Keep non-priority locales in Monitoring/Backlog to control costs while preserving trend visibility.
      </Tip>
    </div>
  );
}
