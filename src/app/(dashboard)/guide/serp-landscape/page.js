"use client";

import { SectionHeading, SubHeading, P, Tip, KeyBadge } from "../_components";

export default function GuideSerpLandscapePage() {
  return (
    <div>
      <SectionHeading>SERP Landscape</SectionHeading>
      <P>
        SERP Landscape compares two dates side-by-side and mimics real SERP composition, including
        non-organic blocks like AI Overview and PAA. This helps you see your <em>true</em> position
        in context of everything above it.
      </P>

      <SubHeading>What Gets Saved</SubHeading>
      <ul className="text-sm text-slate-600 space-y-1.5 ml-4 list-disc mb-4">
        <li>Top 20 items by <KeyBadge>rank_absolute</KeyBadge> per keyword/date</li>
        <li>Item type (<strong>organic</strong>, <strong>ai_overview</strong>, <strong>people_also_ask</strong>, etc.)</li>
        <li>URL, domain, title (when available)</li>
        <li>Exact tracked URL match (<strong>foundUrl</strong>)</li>
        <li>Other domain URLs with positions (<strong>cannibalization</strong>)</li>
      </ul>

      <SubHeading>Curved Connection Lines</SubHeading>
      <P>
        The middle overlay uses curved cubic Bezier paths to connect matching domains between dates:
      </P>
      <ul className="text-sm text-slate-600 space-y-1.5 ml-4 list-disc mb-4">
        <li><span className="text-emerald-600 font-semibold">Green</span>: improved</li>
        <li><span className="text-red-600 font-semibold">Red</span>: dropped</li>
        <li><span className="text-slate-500 font-semibold">Grey</span>: unchanged</li>
        <li><strong>Our domain line</strong>: thicker and highlighted</li>
      </ul>

      <SubHeading>SERP Features Included</SubHeading>
      <P>
        The table includes AI Overview, PAA, Featured Snippet, Local Pack, Video, Top Stories,
        Shopping, Paid, and other returned SERP blocks when present.
      </P>

      <Tip>
        If your organic row is #4 but AI Overview, Featured Snippet, and PAA appear above it, the
        landscape helps explain traffic pressure despite “good” organic rank.
      </Tip>
    </div>
  );
}
