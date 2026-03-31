"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
import api from "@/lib/services";
import {
  Badge,
  Card,
  Spinner,
  EmptyState,
  PositionText,
  ChangeIndicator,
  Select,
} from "@/components/ui";
import {
  Target,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  MousePointerClick,
} from "lucide-react";

const BUCKET_CONFIG = {
  on_target: { label: "On Target", sub: "Position 1–3", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
  close: { label: "Close", sub: "Position 4–10", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" },
  off_target: { label: "Off Target", sub: "Position 11+", color: "text-red-700", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" },
  not_ranking: { label: "Not Ranking", sub: "No position data", color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-200", dot: "bg-slate-400" },
};

function formatNumber(n) {
  if (n == null) return "—";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function InsightsStatusPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterLocale, setFilterLocale] = useState("all");
  const [days, setDays] = useState("14");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, overviewRes] = await Promise.all([
        api("/insights?type=status"),
        api(`/insights?type=overview&days=${days}`),
      ]);
      setData(statusRes);
      setOverview(overviewRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const allLocales = useMemo(() => {
    const locs = new Set();
    (data?.items || []).forEach((item) => { if (item.locale) locs.add(item.locale); });
    return [...locs].sort();
  }, [data]);

  const items = useMemo(() => {
    const all = data?.items || [];
    if (filterLocale === "all") return all;
    return all.filter((item) => item.locale === filterLocale);
  }, [data, filterLocale]);

  const counts = data?.counts || {};

  const grouped = useMemo(() => {
    const groups = {};
    for (const item of items) {
      const key = item.articleId || "unknown";
      if (!groups[key]) {
        groups[key] = { articleId: item.articleId, articleTitle: item.articleTitle, category: item.category, items: [] };
      }
      groups[key].items.push(item);
    }
    return Object.values(groups).sort((a, b) => (a.articleTitle || "").localeCompare(b.articleTitle || ""));
  }, [items]);

  const onSelect = (id) => router.push(`/articles/${id}`);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={24} className="text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Overview */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <OverviewCard icon={TrendingDown} iconColor="text-red-500" iconBg="bg-red-50" label="Drops" value={overview.recentDrops} sub={`last ${days}d`} />
          <OverviewCard icon={TrendingUp} iconColor="text-emerald-500" iconBg="bg-emerald-50" label="Gains" value={overview.recentGains} sub={`last ${days}d`} />
          <OverviewCard icon={Target} iconColor="text-blue-500" iconBg="bg-blue-50" label="Avg Position" value={overview.avgPosition ? `#${overview.avgPosition}` : "—"} sub={`${overview.totalKeywords} keywords`} />
          <OverviewCard icon={MousePointerClick} iconColor="text-indigo-500" iconBg="bg-indigo-50" label="GSC Clicks" value={formatNumber(overview.totalClicks)} sub={`${formatNumber(overview.totalImpressions)} impressions`} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {allLocales.length > 1 && (
          <Select value={filterLocale} onChange={(e) => setFilterLocale(e.target.value)}>
            <option value="all">All Locales</option>
            {allLocales.map((l) => (<option key={l} value={l}>{l.toUpperCase()}</option>))}
          </Select>
        )}
        <Select value={days} onChange={(e) => setDays(e.target.value)}>
          <option value="7">7 days</option>
          <option value="14">14 days</option>
          <option value="30">30 days</option>
          <option value="60">60 days</option>
        </Select>
      </div>

      {/* Bucket summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(BUCKET_CONFIG).map(([key, cfg]) => (
          <Card key={key} className={`px-4 py-3 border ${cfg.border}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
              <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{counts[key] || 0}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{cfg.sub}</div>
          </Card>
        ))}
      </div>

      {/* Grouped by article */}
      {items.length === 0 ? (
        <EmptyState message="No tracked keywords found." icon={<Target size={32} />} />
      ) : (
        grouped.map((group) => (
          <Card key={group.articleId} className="p-0 overflow-hidden">
            <div
              className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={() => onSelect(group.articleId)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900 truncate">{group.articleTitle}</span>
                  {group.category && <Badge className="text-[9px] shrink-0">{group.category}</Badge>}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {group.items.filter((i) => i.bucket === "on_target").length} on target · {group.items.length} keywords
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-300 shrink-0" />
            </div>
            <div className="divide-y divide-slate-50">
              {group.items.sort((a, b) => (a.position || 999) - (b.position || 999)).map((item) => {
                const cfg = BUCKET_CONFIG[item.bucket];
                return (
                  <div key={item.keywordId} className="flex items-center gap-3 px-4 py-2.5">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-slate-700 truncate block">{item.keyword}</span>
                    </div>
                    <Badge variant="info" className="text-[9px] shrink-0">{(item.locale || "").toUpperCase()}</Badge>
                    <div className="shrink-0 min-w-[50px] text-right"><PositionText position={item.position} /></div>
                    <div className="shrink-0 w-10 text-right"><ChangeIndicator change={item.posChange} /></div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

function OverviewCard({ icon: Icon, iconColor, iconBg, label, value, sub }) {
  return (
    <Card className="px-4 py-3">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon size={15} className={iconColor} />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</div>
          <div className="text-lg font-extrabold text-slate-900 leading-tight">{value}</div>
          {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
        </div>
      </div>
    </Card>
  );
}
