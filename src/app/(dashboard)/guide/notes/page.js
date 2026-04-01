"use client";

import { SectionHeading, SubHeading, P, Tip } from "../_components";

export default function GuideNotesPage() {
  return (
    <div>
      <SectionHeading>Notes &amp; Change Tracking</SectionHeading>
      <P>
        Notes record what changed and when, so ranking movement can be tied to actions.
      </P>

      <SubHeading>Best Practice</SubHeading>
      <ul className="text-sm text-slate-600 space-y-1.5 ml-4 list-disc mb-4">
        <li>Add note immediately after each major optimization change.</li>
        <li>Use consistent note types so reports stay meaningful.</li>
        <li>Avoid generic notes for measurable experiments.</li>
      </ul>

      <SubHeading>Review Flow</SubHeading>
      <P>
        Non-general optimization notes can move a locale into In Review and start a focused
        watch window for impact measurement.
      </P>

      <Tip>
        Strong note hygiene improves confidence when validating gains/drops and rollout impact.
      </Tip>
    </div>
  );
}
