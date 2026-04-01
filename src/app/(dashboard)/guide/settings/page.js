"use client";

import { Img, SectionHeading, SubHeading, P, Tip, KeyBadge } from "../_components";

export default function GuideSettingsPage() {
  return (
    <div>
      <SectionHeading>Settings</SectionHeading>
      <P>
        Settings manages credentials, integrations, locale config, and manual operations.
      </P>
      <Img src="/guide/settings.png" alt="Settings" caption="Credentials, GSC, Telegram, and operations." />

      <SubHeading>DataForSEO</SubHeading>
      <P>
        Add DFS credentials in Settings. These are used first; env vars remain fallback.
      </P>

      <SubHeading>GSC</SubHeading>
      <P>
        Configure service account and property in env vars, then use <KeyBadge>Test GSC Connection</KeyBadge>.
        Traffic is stored at page level, not keyword level.
      </P>

      <SubHeading>Telegram</SubHeading>
      <P>
        Configure bot token/chat ID and use test action before relying on alert summaries.
      </P>

      <SubHeading>Manual Operations</SubHeading>
      <ul className="text-sm text-slate-600 space-y-1.5 ml-4 list-disc mb-4">
        <li><strong>Run Data Collection</strong> for global immediate checks.</li>
        <li><strong>Check Rankings</strong> in Article Detail for targeted immediate refresh.</li>
      </ul>

      <Tip>
        Keep cron/web env vars consistent. Mismatched CRON_SECRET or APP_URL is a common issue.
      </Tip>
    </div>
  );
}
