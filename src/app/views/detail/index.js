"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  RefreshCw,
  Plus,
  Save,
  X,
  Globe,
  Calendar,
  Clock,
  ExternalLink,
} from "lucide-react";
import {
  Button,
  Badge,
  Card,
  Input,
  Select,
  Spinner,
  LocalePill,
  StageDot,
  Table,
  Th,
  Td,
  EmptyState,
} from "@/components/ui";
import api from "@/lib/services";
import { stageCfg, STAGES, noteTypeCfg, localeFlags } from "@/lib/utils";
import DateRangePicker from "@/components/ui/date-range-picker";
import SERPRankingChart from "./graph-rep";
import SERPDataTable from "./keywords-graph";

const NOTE_DOT_COLORS = {
  change: "bg-blue-500",
  optimization: "bg-emerald-500",
  technical: "bg-amber-500",
  algorithm: "bg-purple-500",
  general: "bg-slate-400",
};

function positionCellClasses(pos) {
  if (pos == null) return "bg-slate-100 text-slate-400";
  if (pos <= 3) return "bg-green-500 text-white";
  if (pos <= 10) return "bg-green-200 text-green-900";
  if (pos <= 20) return "bg-amber-200 text-amber-900";
  return "bg-red-200 text-red-900";
}

export default function ArticleDetailView({
  articleId,
  onBack,
  onEdit,
  onDelete,
  onRefresh,
}) {
  const [data, setData] = useState(null);
  const [activeLocale, setActiveLocale] = useState("all");
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("daily");
  const [dateRange, setDateRange] = useState(30);
  const [country, setCountry] = useState(null);
  const [chartMetrics, setChartMetrics] = useState({});

  // Date range picker state
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [endDate, setEndDate] = useState(() => new Date());
  const [comparing, setComparing] = useState(false);
  const [compareStartDate, setCompareStartDate] = useState(null);
  const [compareEndDate, setCompareEndDate] = useState(null);

  // Note form state
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState("change");
  const [noteDate, setNoteDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [noteReviewDays, setNoteReviewDays] = useState(21);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit note state
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editingDate, setEditingDate] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    api(
      `/articles/${articleId}?days=${dateRange}${
        country ? `&country=${country}` : ""
      }${activeLocale !== "all" ? `&locale=${activeLocale}` : ""}`
    )
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [articleId, dateRange, country, activeLocale]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const locales = data?.locales || [];
  const currentLocale =
    activeLocale === "all"
      ? null
      : locales.find((l) => l.locale === activeLocale);
  const isAllLocales = activeLocale === "all";

  // Countries from keywords
  const allCountries = useMemo(() => {
    const set = new Set();
    locales.forEach((l) =>
      l.keywords?.forEach((k) => {
        (k.targetCountries || "us")
          .split(",")
          .forEach((c) => set.add(c.trim()));
      })
    );
    return [...set];
  }, [locales]);

  const displayKeywords = currentLocale
    ? currentLocale.keywords || []
    : locales.flatMap((l) =>
        (l.keywords || []).map((k) => ({ ...k, _locale: l.locale }))
      );

  const displayNotes = useMemo(() => {
    const notes = currentLocale
      ? (currentLocale.notes || []).map((n) => ({
          ...n,
          _localeId: currentLocale.id,
        }))
      : locales.flatMap((l) =>
          (l.notes || []).map((n) => ({
            ...n,
            _locale: l.locale,
            _localeId: l.id,
          }))
        );
    return notes.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [currentLocale, locales]);

  const chartData = currentLocale || {
    keywords: displayKeywords,
    notes: displayNotes,
  };

  const allPageTraffic = useMemo(() => {
    if (currentLocale) return currentLocale.pageTraffic || [];
    return locales.flatMap((l) => l.pageTraffic || []);
  }, [currentLocale, locales]);

  // Heatmap data
  const heatmapKeywords = useMemo(() => {
    if (!isAllLocales) return [];
    const kwMap = {};
    for (const loc of locales) {
      for (const kw of loc.keywords || []) {
        if (!kwMap[kw.keyword]) kwMap[kw.keyword] = {};
        const latest = kw.snapshots?.sort(
          (a, b) =>
            new Date(b.date || b.weekStarting) -
            new Date(a.date || a.weekStarting)
        )[0];
        kwMap[kw.keyword][loc.locale] =
          latest?.serpPosition ?? kw.position ?? kw.currentPosition ?? null;
      }
    }
    return { keywords: Object.keys(kwMap).sort(), map: kwMap };
  }, [isAllLocales, locales]);

  const reviewDaysLeft = useMemo(() => {
    if (!currentLocale?.reviewStartedAt) return null;
    return Math.max(
      0,
      (currentLocale.reviewDays || 21) -
        Math.floor(
          (Date.now() - new Date(currentLocale.reviewStartedAt).getTime()) /
            86400000
        )
    );
  }, [currentLocale]);

  // Actions
  const addNote = async () => {
    if (!noteText.trim() || !currentLocale) return;
    setActionLoading(true);
    const dt = new Date(noteDate);
    dt.setUTCHours(12, 0, 0, 0);
    try {
      await api(`/urls/${currentLocale.id}/notes`, {
        method: "POST",
        body: JSON.stringify({
          text: noteText.trim(),
          createdAt: dt.toISOString(),
          type: noteType,
          reviewDays: noteReviewDays,
        }),
      });
      setNoteText("");
      setNoteDate(new Date().toISOString().split("T")[0]);
      fetchData();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Add note failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteNote = async (localeId, noteId) => {
    setActionLoading(true);
    try {
      await api(`/urls/${localeId}/notes/${noteId}`, {
        method: "DELETE",
      });
      fetchData();
    } catch (err) {
      console.error("Delete note failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const startEdit = (note) => {
    setEditingId(note.id);
    setEditingText(note.text);
    setEditingDate(new Date(note.createdAt).toISOString().split("T")[0]);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  const saveEdit = async (localeId) => {
    if (!editingText.trim()) return;
    setSaving(true);
    const dt = new Date(editingDate);
    dt.setUTCHours(12, 0, 0, 0);
    try {
      await api(`/urls/${localeId}/notes/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify({
          text: editingText,
          createdAt: dt.toISOString(),
        }),
      });
      cancelEdit();
      fetchData();
    } catch (err) {
      console.error("Edit note failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const changeStage = async (localeId, newStage) => {
    try {
      await api(`/articles/${articleId}/locales/${localeId}/stage`, {
        method: "PUT",
        body: JSON.stringify({ stage: newStage }),
      });
      fetchData();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Stage change failed:", err);
    }
  };

  // Impact panel: compare positions before/after the last note
  const impactData = useMemo(() => {
    if (!currentLocale || currentLocale.stage !== "in_review" || !currentLocale.reviewStartedAt) return null;
    const reviewStart = new Date(currentLocale.reviewStartedAt);
    const impacts = [];

    for (const kw of currentLocale.keywords || []) {
      const sortedSnaps = (kw.snapshots || []).sort((a, b) => new Date(a.date || a.weekStarting) - new Date(b.date || b.weekStarting));
      const before = sortedSnaps.filter(s => new Date(s.date || s.weekStarting) < reviewStart);
      const after = sortedSnaps.filter(s => new Date(s.date || s.weekStarting) >= reviewStart);
      const beforePos = before.length > 0 ? before[before.length - 1].serpPosition : null;
      const afterPos = after.length > 0 ? after[after.length - 1].serpPosition : null;

      if (beforePos || afterPos) {
        impacts.push({
          keyword: kw.keyword,
          before: beforePos,
          after: afterPos,
          change: beforePos && afterPos ? beforePos - afterPos : null,
        });
      }
    }

    return impacts.length > 0 ? impacts : null;
  }, [currentLocale]);

  // Comparison summary: avg position delta between two periods
  const comparisonSummary = useMemo(() => {
    if (!comparing || !compareStartDate || !compareEndDate) return null;
    const kws = currentLocale ? currentLocale.keywords : locales.flatMap(l => l.keywords || []);
    let primarySum = 0, primaryCount = 0, compareSum = 0, compareCount = 0;
    let bestImprovement = null, worstDecline = null;

    for (const kw of kws || []) {
      for (const snap of kw.snapshots || []) {
        const d = new Date(snap.date || snap.weekStarting);
        if (snap.serpPosition) {
          if (d >= startDate && d <= endDate) { primarySum += snap.serpPosition; primaryCount++; }
          if (d >= compareStartDate && d <= compareEndDate) { compareSum += snap.serpPosition; compareCount++; }
        }
      }
    }

    const primaryAvg = primaryCount > 0 ? primarySum / primaryCount : null;
    const compareAvg = compareCount > 0 ? compareSum / compareCount : null;
    const delta = primaryAvg && compareAvg ? compareAvg - primaryAvg : null;

    return { primaryAvg, compareAvg, delta };
  }, [comparing, compareStartDate, compareEndDate, startDate, endDate, currentLocale, locales]);

  // Page-level traffic from GSC (stored per locale, not per keyword)
  const trafficSummary = useMemo(() => {
    let clicks = 0, impressions = 0;
    for (const loc of locales) {
      for (const pt of loc.pageTraffic || []) {
        clicks += pt.clicks || 0;
        impressions += pt.impressions || 0;
      }
    }
    return { clicks, impressions };
  }, [locales]);

  // Sub-tab config
  const subTabs = useMemo(() => {
    const tabs = [
      { key: "overview", label: "Overview" },
      { key: "keywords", label: "Keywords" },
      { key: "notes", label: "Change Log" },
    ];
    if (isAllLocales) tabs.push({ key: "heatmap", label: "Locale Heatmap" });
    return tabs;
  }, [isAllLocales]);

  useEffect(() => {
    if (!isAllLocales && tab === "heatmap") setTab("overview");
  }, [isAllLocales, tab]);

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex items-center justify-center py-32">
          <Spinner className="w-8 h-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Actions */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit(data)}
            className="gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh || fetchData}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("Delete this article and all locales?"))
                onDelete(articleId);
            }}
            className="gap-1.5 text-red-500 hover:text-red-600"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Article Header Card */}
      <Card className="p-5">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            {data.title}
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-400">
            {data.category && (
              <Badge>
                {typeof data.category === "string"
                  ? data.category
                  : data.category.name}
              </Badge>
            )}
            {data.slug && <span>/{data.slug}</span>}
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              {locales.length} locale{locales.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Locale Tabs */}
        <div className="flex gap-2 mt-4 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveLocale("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              isAllLocales
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            All Locales
          </button>
          {locales.map((loc) => (
            <button
              key={loc.locale}
              type="button"
              onClick={() => setActiveLocale(loc.locale)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeLocale === loc.locale
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              <StageDot stage={loc.stage} />
              {localeFlags[loc.locale] || loc.locale.toUpperCase()}
            </button>
          ))}
        </div>
      </Card>

      {/* Stage Banner (single locale only) */}
      {currentLocale && (
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <StageDot stage={currentLocale.stage} />
                <span className="text-sm font-bold text-slate-700">
                  {stageCfg[currentLocale.stage]?.l || currentLocale.stage}
                </span>
              </div>
              {currentLocale.stage === "in_review" &&
                reviewDaysLeft !== null && (
                  <span className="flex items-center gap-1 text-xs text-amber-600">
                    <Clock className="w-3 h-3" />
                    {reviewDaysLeft} day{reviewDaysLeft !== 1 ? "s" : ""} left in
                    review
                  </span>
                )}
              {currentLocale.url && (
                <a
                  href={currentLocale.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 truncate max-w-xs"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">{currentLocale.url}</span>
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={currentLocale.stage}
                onChange={(e) =>
                  changeStage(currentLocale.id, e.target.value)
                }
                className="text-sm"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {stageCfg[s].l}
                  </option>
                ))}
              </Select>
              {allCountries.length > 1 && (
                <Select
                  value={country || ""}
                  onChange={(e) => setCountry(e.target.value || null)}
                  className="text-sm"
                >
                  <option value="">All Countries</option>
                  {allCountries.map((c) => (
                    <option key={c} value={c}>
                      {c.toUpperCase()}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {subTabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.key
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Shared controls for Overview + Keywords */}
      {(tab === "overview" || tab === "keywords") && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            {["daily", "weekly", "monthly"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setViewMode(m)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  viewMode === m
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
          {tab === "overview" && (
            <button
              type="button"
              onClick={() =>
                setChartMetrics((prev) => ({ ...prev, total: !prev.total }))
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                chartMetrics.total
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {chartMetrics.total ? "Showing Traffic" : "Show Traffic"}
            </button>
          )}
        </div>
      )}

      {/* ── Overview Tab ── */}
      {tab === "overview" && (
        <div className="space-y-4">
          {/* Date Range Picker */}
          <Card className="px-5 py-3">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(s, e) => {
                setStartDate(s);
                setEndDate(e);
                const days = Math.round((e - s) / (1000 * 60 * 60 * 24));
                setDateRange(days);
              }}
              compareStartDate={compareStartDate}
              compareEndDate={compareEndDate}
              onCompareChange={(s, e) => { setCompareStartDate(s); setCompareEndDate(e); }}
              comparing={comparing}
              onComparingToggle={setComparing}
            />
          </Card>

          {/* Comparison Summary Cards */}
          {comparing && comparisonSummary && (
            <div className="grid grid-cols-3 gap-3">
              <Card className="px-4 py-3 text-center">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Current Avg</div>
                <div className="text-lg font-extrabold font-mono text-slate-900 mt-1">
                  {comparisonSummary.primaryAvg ? `#${Math.round(comparisonSummary.primaryAvg)}` : "—"}
                </div>
              </Card>
              <Card className="px-4 py-3 text-center">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Previous Avg</div>
                <div className="text-lg font-extrabold font-mono text-slate-900 mt-1">
                  {comparisonSummary.compareAvg ? `#${Math.round(comparisonSummary.compareAvg)}` : "—"}
                </div>
              </Card>
              <Card className="px-4 py-3 text-center">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Position Delta</div>
                <div className={`text-lg font-extrabold font-mono mt-1 ${
                  comparisonSummary.delta > 0 ? "text-emerald-600" : comparisonSummary.delta < 0 ? "text-red-600" : "text-slate-400"
                }`}>
                  {comparisonSummary.delta != null
                    ? `${comparisonSummary.delta > 0 ? "+" : ""}${Math.round(comparisonSummary.delta * 10) / 10}`
                    : "—"}
                </div>
                {comparisonSummary.delta != null && (
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {comparisonSummary.delta > 0 ? "Improved" : comparisonSummary.delta < 0 ? "Declined" : "No change"}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Traffic Summary */}
          {(trafficSummary.clicks > 0 || trafficSummary.impressions > 0) && (
            <div className="grid grid-cols-2 gap-3">
              <Card className="px-4 py-3">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Total Clicks</div>
                <div className="text-lg font-extrabold text-slate-900 mt-1">
                  {trafficSummary.clicks.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400">in selected period</div>
              </Card>
              <Card className="px-4 py-3">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Total Impressions</div>
                <div className="text-lg font-extrabold text-slate-900 mt-1">
                  {trafficSummary.impressions.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400">in selected period</div>
              </Card>
            </div>
          )}

          {/* Ranking Chart */}
          <Card className="p-5">
            <SERPRankingChart
              chartMetrics={chartMetrics}
              data={chartData}
              startDate={startDate}
              endDate={endDate}
              pageTraffic={allPageTraffic}
              viewMode={viewMode}
            />
          </Card>

          {/* Impact Panel (in_review only) */}
          {impactData && currentLocale?.stage === "in_review" && (
            <Card className="p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-1">Impact Since Review Started</h3>
              <p className="text-xs text-slate-400 mb-3">
                Position changes since {new Date(currentLocale.reviewStartedAt).toLocaleDateString()}
              </p>
              <div className="space-y-1.5">
                {impactData.map((item) => (
                  <div key={item.keyword} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50">
                    <span className="text-xs font-medium text-slate-700 flex-1 truncate">{item.keyword}</span>
                    <span className="text-xs font-mono text-slate-400">
                      {item.before ? `#${item.before}` : "—"}
                    </span>
                    <span className="text-slate-300">→</span>
                    <span className={`text-xs font-mono font-bold ${
                      item.after && item.after <= 3 ? "text-emerald-600" :
                      item.after && item.after <= 10 ? "text-slate-900" :
                      item.after && item.after <= 20 ? "text-amber-600" : "text-red-600"
                    }`}>
                      {item.after ? `#${item.after}` : "—"}
                    </span>
                    {item.change != null && (
                      <span className={`text-xs font-mono font-bold ${
                        item.change > 0 ? "text-emerald-600" : item.change < 0 ? "text-red-600" : "text-slate-400"
                      }`}>
                        ({item.change > 0 ? "+" : ""}{item.change})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* SERP Features Summary */}
          {displayKeywords.some(kw => kw.snapshots?.[0]?.serpFeatures) && (
            <Card className="p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-3">SERP Features</h3>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const features = {};
                  displayKeywords.forEach(kw => {
                    const feat = kw.snapshots?.[0]?.serpFeatures;
                    if (feat) feat.split(",").forEach(f => {
                      const t = f.trim();
                      if (t) features[t] = (features[t] || 0) + 1;
                    });
                  });
                  return Object.entries(features).sort((a, b) => b[1] - a[1]).map(([feat, count]) => (
                    <Badge key={feat} variant="info">
                      {feat.replace(/_/g, " ")} ({count})
                    </Badge>
                  ));
                })()}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Keywords Tab ── */}
      {tab === "keywords" && (
        <SERPDataTable data={chartData} timeRange={viewMode} startDate={startDate} endDate={endDate} />
      )}

      {/* ── Change Log Tab ── */}
      {tab === "notes" && (
        <div className="space-y-5">
          {/* Review flow hint */}
          <div className="px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
            <strong>Tip:</strong> Adding a non-general note starts a review period to track ranking impact.
            The locale moves to &ldquo;In Review&rdquo; and reverts to &ldquo;Monitoring&rdquo; after the review window ends.
          </div>

          {/* Add Note Form (specific locale only) */}
          {currentLocale ? (
            <Card className="p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-3">
                Add Note
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                <Input
                  type="date"
                  value={noteDate}
                  onChange={(e) =>
                    setNoteDate(
                      typeof e === "string" ? e : e.target.value
                    )
                  }
                  className="w-36"
                />
                <Select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value)}
                  className="w-40"
                >
                  {Object.entries(noteTypeCfg).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.l}
                    </option>
                  ))}
                </Select>
                <Select
                  value={noteReviewDays}
                  onChange={(e) =>
                    setNoteReviewDays(parseInt(e.target.value))
                  }
                  className="w-40"
                >
                  <option value={7}>Review: 1 week</option>
                  <option value={14}>Review: 2 weeks</option>
                  <option value={21}>Review: 3 weeks</option>
                  <option value={28}>Review: 4 weeks</option>
                  <option value={35}>Review: 5 weeks</option>
                  <option value={42}>Review: 6 weeks</option>
                </Select>
              </div>
              <div className="flex gap-2">
                <Input
                  value={noteText}
                  onChange={(e) =>
                    setNoteText(
                      typeof e === "string" ? e : e.target.value
                    )
                  }
                  placeholder="What did you change?"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addNote();
                    }
                  }}
                />
                <Button
                  onClick={addNote}
                  disabled={actionLoading || !noteText.trim()}
                  className="gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Add Note
                </Button>
              </div>
            </Card>
          ) : (
            <div className="px-3 py-2.5 bg-slate-50 rounded-lg text-xs text-slate-400">
              Select a specific locale tab to add notes
            </div>
          )}

          {/* Notes Timeline */}
          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4">
              {isAllLocales ? "All Notes" : "Notes"}
            </h3>

            {displayNotes.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">
                No notes yet
              </p>
            ) : (
              <div className="relative pl-7">
                {/* Vertical line */}
                <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-slate-200" />

                <div className="space-y-6">
                  {displayNotes.map((n, i) => {
                    const ntCfg = noteTypeCfg[n.type] || noteTypeCfg.general;
                    const localeId =
                      n._localeId ||
                      currentLocale?.id ||
                      locales.find((l) => l.locale === n._locale)?.id;
                    const dotColor =
                      NOTE_DOT_COLORS[n.type] || NOTE_DOT_COLORS.general;

                    return (
                      <div key={n.id || i} className="relative">
                        {/* Timeline dot */}
                        <div
                          className={`absolute -left-5 top-1 w-2.5 h-2.5 rounded-full ring-2 ring-white ${dotColor}`}
                        />

                        <div className="space-y-1">
                          {/* Meta row */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono font-semibold text-slate-400">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                            <Badge>{ntCfg.l}</Badge>
                            {n._locale && (
                              <LocalePill locale={n._locale} />
                            )}
                          </div>

                          {/* Content or edit form */}
                          {editingId === n.id ? (
                            <div className="mt-2 p-3 bg-slate-50 rounded-lg space-y-2">
                              <Input
                                type="date"
                                value={editingDate}
                                onChange={(e) =>
                                  setEditingDate(
                                    typeof e === "string"
                                      ? e
                                      : e.target.value
                                  )
                                }
                                className="w-40"
                              />
                              <textarea
                                value={editingText}
                                onChange={(e) =>
                                  setEditingText(e.target.value)
                                }
                                rows={2}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 resize-y"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => saveEdit(localeId)}
                                  disabled={saving}
                                  className="gap-1"
                                >
                                  <Save className="w-3 h-3" />
                                  {saving ? "Saving..." : "Save"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={cancelEdit}
                                  className="gap-1"
                                >
                                  <X className="w-3 h-3" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm text-slate-700 leading-relaxed">
                                {n.text}
                              </p>
                              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => startEdit(n)}
                                  className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteNote(localeId, n.id)
                                  }
                                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Locale Heatmap Tab (All Locales only) ── */}
      {tab === "heatmap" && isAllLocales && (
        <Card className="p-5 overflow-x-auto">
          <h3 className="text-sm font-bold text-slate-700 mb-4">
            Keyword x Locale Matrix
          </h3>

          {heatmapKeywords.keywords?.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">
              No keyword data across locales to compare
            </p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th className="sticky left-0 bg-white z-10 min-w-[180px]">
                    Keyword
                  </Th>
                  {locales.map((l) => (
                    <Th
                      key={l.locale}
                      className="text-center min-w-[72px]"
                    >
                      {localeFlags[l.locale] || l.locale.toUpperCase()}
                    </Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapKeywords.keywords?.map((kw) => (
                  <tr key={kw}>
                    <Td className="sticky left-0 bg-white z-10 font-medium text-sm truncate max-w-[220px]">
                      {kw}
                    </Td>
                    {locales.map((l) => {
                      const pos =
                        heatmapKeywords.map[kw]?.[l.locale] ?? null;
                      return (
                        <Td key={l.locale} className="p-0 text-center">
                          <div
                            className={`w-full px-2 py-2 text-xs font-bold font-mono ${positionCellClasses(pos)}`}
                          >
                            {pos != null ? `#${pos}` : "-"}
                          </div>
                        </Td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}
