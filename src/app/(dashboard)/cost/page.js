"use client";

import CostUsageView from "../../views/cost";

export default function CostPage() {
  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Cost & Usage</h1>
        <p className="text-xs text-slate-400 mt-0.5">API usage, run history, and cost controls</p>
      </div>

      <CostUsageView />
    </>
  );
}
