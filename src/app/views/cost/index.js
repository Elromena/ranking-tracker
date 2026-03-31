"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/services";
import {
  Card,
  Badge,
  Spinner,
  EmptyState,
  Table,
  Th,
  Td,
} from "@/components/ui";
import {
  DollarSign,
  Activity,
  Clock,
  BarChart3,
} from "lucide-react";

export default function CostUsageView() {
  const [estimate, setEstimate] = useState(null);
  const [runs, setRuns] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api("/cost-estimate"),
      api("/cron-runs?limit=15"),
    ])
      .then(([est, r]) => {
        setEstimate(est);
        setRuns(r);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={24} className="text-slate-400" />
      </div>
    );
  }

  const monthTotal = runs?.monthSummary?.totalCost?.toFixed(2) || "0.00";
  const monthRuns = runs?.monthSummary?.runCount || 0;
  const lastRun = runs?.runs?.[0];
  const lastRunCost = lastRun ? `$${lastRun.estimatedCost.toFixed(2)}` : "--";
  const lastRunCalls = lastRun ? `${lastRun.apiCalls} calls` : "no runs";
  const nextRunCost = `$${estimate?.estimatedCost?.toFixed(2) || "0.00"}`;
  const nextRunCalls = `${estimate?.totalCalls || 0} API calls`;
  const monthCalls = runs?.monthSummary?.totalCalls?.toLocaleString() || "0";

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          icon={DollarSign}
          label="Month Total"
          value={`$${monthTotal}`}
          sub={`${monthRuns} runs`}
        />
        <SummaryCard
          icon={Clock}
          label="Last Run"
          value={lastRunCost}
          sub={lastRunCalls}
        />
        <SummaryCard
          icon={Activity}
          label="Next Run Est."
          value={nextRunCost}
          sub={nextRunCalls}
        />
        <SummaryCard
          icon={BarChart3}
          label="Month API Calls"
          value={monthCalls}
          sub="DataForSEO"
        />
      </div>

      {/* Per-Locale Breakdown */}
      {estimate?.breakdown?.length > 0 && (
        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Per-Locale Breakdown (Next Run)
            </h3>
          </div>
          <Table>
            <thead>
              <tr className="bg-slate-50/50">
                <Th>Locale</Th>
                <Th>Articles</Th>
                <Th>Keywords</Th>
                <Th>Countries</Th>
                <Th>API Calls</Th>
                <Th>Est. Cost</Th>
              </tr>
            </thead>
            <tbody>
              {estimate.breakdown.map((b) => (
                <tr key={b.locale}>
                  <Td className="font-semibold">
                    {(b.locale || "").toUpperCase()}
                  </Td>
                  <Td className="font-mono">{b.articles}</Td>
                  <Td className="font-mono">{b.keywords}</Td>
                  <Td className="font-mono">{b.countries}</Td>
                  <Td className="font-mono">{b.calls}</Td>
                  <Td className="font-mono font-semibold">
                    ${b.cost.toFixed(2)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Recent Runs */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Recent Runs</h3>
        </div>
        <Table>
          <thead>
            <tr className="bg-slate-50/50">
              <Th>Date</Th>
              <Th>Status</Th>
              <Th>API Calls</Th>
              <Th>Keywords</Th>
              <Th>Errors</Th>
              <Th>Cost</Th>
              <Th>Duration</Th>
            </tr>
          </thead>
          <tbody>
            {(runs?.runs || []).map((run) => {
              const dur = run.completedAt
                ? `${((new Date(run.completedAt) - new Date(run.startedAt)) / 1000).toFixed(0)}s`
                : "--";
              const statusVariant =
                run.status === "completed"
                  ? "success"
                  : run.status === "failed"
                    ? "danger"
                    : "warning";

              return (
                <tr key={run.id}>
                  <Td>
                    {new Date(run.startedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Td>
                  <Td>
                    <Badge variant={statusVariant}>{run.status}</Badge>
                  </Td>
                  <Td className="font-mono">{run.apiCalls}</Td>
                  <Td className="font-mono">{run.keywordsProcessed}</Td>
                  <Td
                    className={`font-mono ${run.errors > 0 ? "text-red-600" : "text-slate-400"}`}
                  >
                    {run.errors}
                  </Td>
                  <Td className="font-mono font-semibold">
                    ${run.estimatedCost.toFixed(2)}
                  </Td>
                  <Td className="font-mono">{dur}</Td>
                </tr>
              );
            })}
            {(!runs?.runs || runs.runs.length === 0) && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-slate-400"
                >
                  No runs recorded yet
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, sub }) {
  return (
    <Card className="px-5 py-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-slate-400" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-2xl font-extrabold text-slate-900 font-mono">
        {value}
      </div>
      <div className="text-xs text-slate-400 mt-1">{sub}</div>
    </Card>
  );
}
