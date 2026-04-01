"use client";

import { Img, SectionHeading, SubHeading, P } from "../_components";

export default function GuideInsightsPage() {
  return (
    <div>
      <SectionHeading>Insights</SectionHeading>
      <P>
        Insights provides portfolio-level analysis across all tracked content.
      </P>
      <Img
        src="/guide/insights.png"
        alt="Insights"
        caption="Status, Movements, and Trends views."
      />

      <SubHeading>Status</SubHeading>
      <P>
        Bucketed view of keyword health: On Target (1-3), Close (4-10), Off Target (11+), and Not Ranking.
      </P>

      <SubHeading>Movements</SubHeading>
      <P>
        Significant gains and drops for selected periods, grouped by article.
      </P>

      <SubHeading>Trends</SubHeading>
      <P>
        Gradual decline detection and “lost top-3” signals using smoothed weekly movement patterns.
      </P>
    </div>
  );
}
