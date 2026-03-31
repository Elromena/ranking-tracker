"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
import api from "@/lib/services";
import {
  Badge,
  Card,
  Spinner,
  EmptyState,
  Select,
} from "@/components/ui";
import { TrendingDown, BarChart3, ShieldAlert } from "lucide-react";

export default function InsightsTrendsPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterLocale, setFilterLocale] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api("/insights?type=trends");
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

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
      {allLocales.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filterLocale} onChange={(e) => setFilterLocale(e.target.value)}>
            <option value="all">All Locales</option>
            {allLocales.map((l) => (<option key={l} value={l}>{l.toUpperCase()}</option>))}
          </Select>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="px-4 py-3 text-center">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Flagged Keywords</div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{data?.total || 0}</div>
          <div className="text-[10px] text-slate-400">30-day window</div>
        </Card>
        <Card className="px-4 py-3 text-center border border-red-100">
          <div className="text-[10px] font-semibold text-red-400 uppercase tracking-wide">Lost Top 3</div>
          <div className="text-xl font-extrabold text-red-600 mt-1">{data?.lostTop3Count || 0}</div>
        </Card>
        <Card className="px-4 py-3 text-center border border-amber-100">
          <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide">Declining</div>
          <div className="text-xl font-extrabold text-amber-600 mt-1">{data?.decliningCount || 0}</div>
        </Card>
      </div>

      {items.length === 0 ? (
        <EmptyState message="No concerning trends detected. Positions are stable over the last 30 days." icon={<BarChart3 size={32} />} />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card
              key={item.keywordId}
              className="px-4 py-3 cursor-pointer hover:border-slate-300 transition-colors"
              onClick={() => onSelect(item.articleId)}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-900 truncate">{item.keyword}</span>
                    <Badge variant="info" className="text-[9px] shrink-0">{(item.locale || "").toUpperCase()}</Badge>
                    {item.category && <Badge className="text-[9px] shrink-0">{item.category}</Badge>}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{item.articleTitle}</div>
                </div>

                {/* Flags */}
                <div className="flex flex-wrap gap-1 shrink-0">
                  {item.lostTop3 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-semibold">
                      <ShieldAlert size={10} /> Lost Top 3
                    </span>
                  )}
                  {item.consistentDecline && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold">
                      <TrendingDown size={10} /> Declining
                    </span>
                  )}
                </div>

                {/* Mini sparkline */}
                {item.weeklyAvgs && item.weeklyAvgs.length > 0 && (
                  <div className="flex items-end gap-0.5 h-6 shrink-0">
                    {item.weeklyAvgs.map((avg, i) => {
                      const max = Math.max(...item.weeklyAvgs, 20);
                      const height = Math.max(4, (1 - avg / max) * 24);
                      const isLast = i === item.weeklyAvgs.length - 1;
                      return (
                        <div
                          key={i}
                          className={`w-1.5 rounded-sm ${isLast ? "bg-red-400" : "bg-slate-300"}`}
                          style={{ height: `${height}px` }}
                          title={`Week ${i + 1}: #${avg}`}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Position change */}
                <div className="shrink-0 text-right min-w-[70px]">
                  <div className="text-[10px] text-slate-400">
                    #{item.startPosition} → #{item.currentPosition}
                  </div>
                  <div className={`text-xs font-bold font-mono ${item.slope > 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {item.slope > 0 ? "+" : ""}{item.slope}/wk
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
