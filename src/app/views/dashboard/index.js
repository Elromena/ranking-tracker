"use client";

import { useState, useMemo } from "react";
import { Search, Plus, BarChart3, Globe, Target, AlertTriangle } from "lucide-react";
import { stageCfg, STAGES, localeFlags } from "@/lib/utils";
import {
  Card, Badge, Input, Select, Button, EmptyState, Spinner,
  LocalePill,
} from "@/components/ui";

export default function DashboardView({ articles, onSelectArticle, onAddArticle, loading, onRefresh }) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterLocale, setFilterLocale] = useState("all");

  // ── Derived data ──────────────────────────────────────────
  const categories = useMemo(() => {
    const cats = new Set(articles.map(a => a.category).filter(Boolean));
    return [...cats].sort();
  }, [articles]);

  const allLocales = useMemo(() => {
    const locs = new Set();
    articles.forEach(a => a.locales?.forEach(l => locs.add(l.locale)));
    return [...locs].sort();
  }, [articles]);

  const filtered = useMemo(() => {
    return articles.filter(a => {
      if (filterCategory !== "all" && a.category !== filterCategory) return false;
      if (filterLocale !== "all" && !a.locales?.some(l => l.locale === filterLocale)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!a.title.toLowerCase().includes(q) && !a.slug?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [articles, filterCategory, filterLocale, search]);

  // ── Summary metrics ───────────────────────────────────────
  const metrics = useMemo(() => {
    const localeSet = new Set();
    let totalPos = 0;
    let posCount = 0;
    let needsAttention = 0;

    articles.forEach(a => {
      a.locales?.forEach(l => {
        localeSet.add(l.locale);
        if (l.avgPosition) {
          totalPos += l.avgPosition;
          posCount++;
        }
        if (l.avgPosition > 20 || l.netChange < -3) {
          needsAttention++;
        }
      });
    });

    return {
      totalArticles: articles.length,
      activeLocales: localeSet.size,
      avgPosition: posCount > 0 ? Math.round(totalPos / posCount) : 0,
      needsAttention,
    };
  }, [articles]);

  const metricCards = [
    { label: "Total Articles", value: metrics.totalArticles, icon: BarChart3, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active Locales", value: metrics.activeLocales, icon: Globe, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Avg Position", value: metrics.avgPosition ? `#${metrics.avgPosition}` : "—", icon: Target, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Needs Attention", value: metrics.needsAttention, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  // ── Filter options ────────────────────────────────────────
  const categoryOptions = [
    { value: "all", label: "All Categories" },
    ...categories.map(c => ({ value: c, label: c })),
  ];

  const localeOptions = [
    { value: "all", label: "All Locales" },
    ...allLocales.map(l => ({ value: l, label: localeFlags[l] || l.toUpperCase() })),
  ];

  const formatDisplayUrl = (url) => {
    if (!url) return "";
    try {
      const u = new URL(url);
      const host = u.hostname.replace(/^www\./, "");
      const path = u.pathname === "/" ? "" : u.pathname;
      const compact = `${host}${path}`;
      return compact.length > 52 ? `${compact.slice(0, 51)}…` : compact;
    } catch {
      return url.length > 52 ? `${url.slice(0, 51)}…` : url;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map(m => (
          <Card key={m.label} className="flex items-center gap-4 p-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${m.bg}`}>
              <m.icon size={18} className={m.color} />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{m.label}</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">{m.value}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search articles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9 w-56"
          />
        </div>
        <Select
          options={categoryOptions}
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
        />
        <Select
          options={localeOptions}
          value={filterLocale}
          onChange={e => setFilterLocale(e.target.value)}
        />
        <div className="ml-auto">
          <Button variant="primary" size="sm" onClick={onAddArticle}>
            <Plus size={14} className="mr-1.5" />
            Add Article
          </Button>
        </div>
      </div>

      {/* Article List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size={24} className="text-slate-400" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState message="No articles found" icon={<BarChart3 size={28} />} />
      ) : (
        <div className="space-y-2">
          {filtered.map(article => {
            const totalKeywords = (article.locales || []).reduce(
              (sum, l) => sum + (l.keywordCount || 0), 0
            );
            const firstLocaleUrl = article.locales?.[0]?.url || "";

            return (
              <Card
                key={article.id}
                className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all"
                onClick={() => onSelectArticle(article.id)}
              >
                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    {article.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1 min-w-0">
                    {article.category && (
                      <Badge variant="default" className="text-[10px]">{article.category}</Badge>
                    )}
                    <span
                      className="text-[11px] text-slate-400 truncate"
                      title={`slug: /${article.slug}`}
                    >
                      slug: /{article.slug}
                    </span>
                  </div>
                  {firstLocaleUrl && (
                    <div className="text-[11px] text-slate-500 truncate mt-0.5" title={firstLocaleUrl}>
                      {formatDisplayUrl(firstLocaleUrl)}
                    </div>
                  )}
                  </div>
                </div>

                {/* Locale pills */}
                <div className="flex flex-wrap gap-1.5 shrink-0">
                  {(article.locales || []).map(loc => (
                    <LocalePill
                      key={loc.id}
                      locale={loc.locale}
                      stage={loc.stage}
                      avgPosition={loc.avgPosition}
                      change={loc.netChange}
                    />
                  ))}
                </div>

                {/* Keyword count */}
                <div className="text-xs font-mono text-slate-500 text-right w-14 shrink-0">
                  {totalKeywords} kw
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
