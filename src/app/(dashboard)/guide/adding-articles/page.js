"use client";

import { Plus } from "lucide-react";
import { SectionHeading, SubHeading, P, Tip, KeyBadge } from "../_components";

export default function GuideAddingArticlesPage() {
  return (
    <div>
      <SectionHeading>Adding Articles</SectionHeading>
      <P>
        Use <KeyBadge><Plus size={10} /> Add Article</KeyBadge> from Dashboard to create a new
        article with one or more locale URLs and keywords.
      </P>

      <SubHeading>Steps</SubHeading>
      <ol className="text-sm text-slate-600 space-y-2 ml-4 list-decimal mb-4">
        <li>Set title, slug, and category.</li>
        <li>Add locale entries (EN, RU, KO, etc.) with full URL per locale.</li>
        <li>Add keywords and set intent per keyword.</li>
        <li>Save; checks happen on cron based on stage frequency.</li>
      </ol>

      <Tip>
        Keep URL format exact and stable (canonical path), because specific URL matching is used in
        SERP landscape and cannibalization detection.
      </Tip>
    </div>
  );
}
