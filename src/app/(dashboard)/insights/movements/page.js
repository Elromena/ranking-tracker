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
import { TrendingDown, TrendingUp, ArrowRight, Activity } from "lucide-react";

function formatRelativeDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - date) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function InsightsMovementsPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterLocale, setFilterLocale] = useState("all");
  const [days, setDays] = useState("14");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api(`/insights?type=movements&days=${days}`);
      setData(res);
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

  const drops = items.filter((m) => m.netChange < 0);
  const gains = items.filter((m) => m.netChange > 0);
  const onSelect = (id) => router.push(`/articles/${id}`);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={24} className="text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="px-4 py-3 text-center">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Total Movements</div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{data?.total || 0}</div>
          <div className="text-[10px] text-slate-400">net change ≥ 3 in {days}d</div>
        </Card>
        <Card className="px-4 py-3 text-center border border-red-100">
          <div className="text-[10px] font-semibold text-red-400 uppercase tracking-wide">Drops</div>
          <div className="text-xl font-extrabold text-red-600 mt-1">{data?.dropCount || 0}</div>
        </Card>
        <Card className="px-4 py-3 text-center border border-emerald-100">
          <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">Gains</div>
          <div className="text-xl font-extrabold text-emerald-600 mt-1">{data?.gainCount || 0}</div>
        </Card>
      </div>

      {items.length === 0 ? (
        <EmptyState message={`No significant movements in the last ${days} days. Positions are stable.`} icon={<Activity size={32} />} />
      ) : (
        <div className="space-y-3">
          {drops.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <TrendingDown size={12} /> Drops ({drops.length})
              </h3>
              <MovementList items={drops} onSelect={onSelect} />
            </div>
          )}
          {gains.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <TrendingUp size={12} /> Gains ({gains.length})
              </h3>
              <MovementList items={gains} onSelect={onSelect} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MovementList({ items, onSelect }) {
  const grouped = useMemo(() => {
    const groups = {};
    for (const item of items) {
      const key = item.articleId || "unknown";
      if (!groups[key]) {
        groups[key] = { articleId: item.articleId, articleTitle: item.articleTitle, category: item.category, items: [] };
      }
      groups[key].items.push(item);
    }
    return Object.values(groups);
  }, [items]);

  return (
    <div className="space-y-2">
      {grouped.map((group) => (
        <Card key={group.articleId} className="p-0 overflow-hidden">
          <div
            className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={() => onSelect?.(group.articleId)}
          >
            <span className="text-xs font-semibold text-slate-900 truncate flex-1">{group.articleTitle}</span>
            {group.category && <Badge className="text-[9px] shrink-0">{group.category}</Badge>}
            <ArrowRight size={12} className="text-slate-300 shrink-0" />
          </div>
          <div className="divide-y divide-slate-50">
            {group.items.map((item) => (
              <div key={item.keywordId} className="flex items-center gap-3 px-4 py-2">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-slate-700 truncate block">{item.keyword}</span>
                  <span className="text-[9px] text-slate-400">
                    {formatRelativeDate(item.oldDate)} → {formatRelativeDate(item.newDate)}
                  </span>
                </div>
                <Badge variant="info" className="text-[9px] shrink-0">{(item.locale || "").toUpperCase()}</Badge>
                <div className="flex items-center gap-1.5 shrink-0 min-w-[80px] justify-end">
                  <PositionText position={item.oldPosition} className="text-xs opacity-60" />
                  <ArrowRight size={10} className="text-slate-300" />
                  <PositionText position={item.newPosition} />
                </div>
                <div className="shrink-0 w-12 text-right">
                  <ChangeIndicator change={item.netChange} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
