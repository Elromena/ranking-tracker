"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Bot,
  Star,
  HelpCircle,
  Play,
  MapPin,
  ShoppingCart,
  Megaphone,
  Newspaper,
  Search,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { Badge, Spinner, Select } from "@/components/ui";
import api from "@/lib/services";

const SERP_TYPE_CONFIG = {
  organic: { label: "Organic", icon: null, bg: "bg-white", border: "border-slate-200" },
  featured_snippet: { label: "Featured Snippet", icon: Star, bg: "bg-amber-50", border: "border-amber-300" },
  people_also_ask: { label: "People Also Ask", icon: HelpCircle, bg: "bg-blue-50", border: "border-blue-200" },
  ai_overview: { label: "AI Overview", icon: Bot, bg: "bg-gradient-to-r from-violet-50 to-blue-50", border: "border-violet-300" },
  knowledge_graph: { label: "Knowledge Panel", icon: Search, bg: "bg-indigo-50", border: "border-indigo-200" },
  local_pack: { label: "Local Pack", icon: MapPin, bg: "bg-green-50", border: "border-green-200" },
  video: { label: "Video", icon: Play, bg: "bg-red-50", border: "border-red-200" },
  top_stories: { label: "Top Stories", icon: Newspaper, bg: "bg-sky-50", border: "border-sky-200" },
  shopping: { label: "Shopping", icon: ShoppingCart, bg: "bg-orange-50", border: "border-orange-200" },
  paid: { label: "Ad", icon: Megaphone, bg: "bg-yellow-50", border: "border-yellow-300" },
  answer_box: { label: "Answer Box", icon: Star, bg: "bg-emerald-50", border: "border-emerald-200" },
  carousel: { label: "Carousel", icon: ArrowRight, bg: "bg-slate-50", border: "border-slate-200" },
};

function getTypeConfig(type) {
  return SERP_TYPE_CONFIG[type] || SERP_TYPE_CONFIG.organic;
}

function normalizeUrlIdentity(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    const path = u.pathname.replace(/\/$/, "") || "/";
    return `${host}${path}`;
  } catch {
    return String(url).trim().toLowerCase();
  }
}

function getItemIdentity(item) {
  const urlKey = normalizeUrlIdentity(item?.url);
  if (urlKey) return `url:${urlKey}`;
  if (item?.type) return `feature:${item.type}:${item?.title || item?.rank || ""}`;
  return null;
}

function formatDisplayUrl(url, domain) {
  if (!url) return domain || "—";
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname === "/" ? "" : u.pathname;
    const compact = `${host}${path}`;
    return compact.length > 68 ? `${compact.slice(0, 67)}…` : compact;
  } catch {
    return url.length > 68 ? `${url.slice(0, 67)}…` : url;
  }
}

function SerpCard({ item, isOurDomain, side }) {
  const cfg = getTypeConfig(item.type);
  const Icon = cfg.icon;
  const isFeature = item.type !== "organic" && item.type !== "paid";

  return (
    <div
      className={`relative rounded-lg border px-3 py-2.5 transition-all ${cfg.bg} ${cfg.border} ${
        isOurDomain
          ? "ring-2 ring-emerald-400 shadow-emerald-100 shadow-md"
          : "shadow-sm"
      }`}
    >
      {/* Rank badge */}
      <div
        className={`absolute -top-2 ${side === "left" ? "-right-2" : "-left-2"} w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
          isOurDomain
            ? "bg-emerald-500 text-white"
            : isFeature
              ? "bg-slate-400 text-white"
              : "bg-slate-700 text-white"
        }`}
      >
        {item.rank}
      </div>

      {isFeature ? (
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-slate-500 shrink-0" />}
          <span className="text-xs font-semibold text-slate-600">{cfg.label}</span>
        </div>
      ) : (
        <div className="space-y-0.5 min-w-0">
          {/* URL line */}
          <div className="flex items-center gap-1.5 min-w-0">
            {item.domain && (
              <img
                src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=16`}
                alt=""
                className="w-3.5 h-3.5 rounded-sm"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            )}
            <span
              title={item.url || item.domain || ""}
              className={`text-[11px] truncate min-w-0 block ${isOurDomain ? "text-emerald-700 font-semibold" : "text-green-700"}`}
            >
              {formatDisplayUrl(item.url, item.domain)}
            </span>
          </div>
          {/* Title */}
          <p
            title={item.title || ""}
            className={`text-xs leading-snug line-clamp-2 break-words ${isOurDomain ? "text-emerald-900 font-semibold" : "text-blue-800"}`}
          >
            {item.title || "Untitled"}
          </p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ type }) {
  if (type === "new") {
    return <Badge variant="success" className="text-[10px] px-1.5 py-0.5">NEW</Badge>;
  }
  if (type === "gone") {
    return <Badge variant="danger" className="text-[10px] px-1.5 py-0.5">GONE</Badge>;
  }
  return null;
}

function BezierLines({ leftRefs, rightRefs, matchPairs, ourDomain, containerRef }) {
  const [lines, setLines] = useState([]);

  const computeLines = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLines = [];

    for (const pair of matchPairs) {
      const leftEl = leftRefs.current[pair.leftKey];
      const rightEl = rightRefs.current[pair.rightKey];
      if (!leftEl || !rightEl) continue;

      const leftRect = leftEl.getBoundingClientRect();
      const rightRect = rightEl.getBoundingClientRect();

      const x1 = leftRect.right - containerRect.left;
      const y1 = leftRect.top + leftRect.height / 2 - containerRect.top;
      const x2 = rightRect.left - containerRect.left;
      const y2 = rightRect.top + rightRect.height / 2 - containerRect.top;

      const rankChange = pair.leftRank - pair.rightRank;
      let color = "#94a3b8"; // grey = unchanged
      if (rankChange < 0) color = "#ef4444"; // red = dropped (1 -> 3)
      if (rankChange > 0) color = "#22c55e"; // green = improved (12 -> 4)

      const isOurs = pair.domain && pair.domain.includes(ourDomain);
      const thickness = isOurs ? 3 : Math.min(2, 1 + Math.abs(rankChange) * 0.1);

      newLines.push({ x1, y1, x2, y2, color, thickness, isOurs, key: pair.leftKey });
    }

    setLines(newLines);
  }, [matchPairs, ourDomain, leftRefs, rightRefs, containerRef]);

  useEffect(() => {
    computeLines();
    window.addEventListener("resize", computeLines);
    return () => window.removeEventListener("resize", computeLines);
  }, [computeLines]);

  // Re-compute after a brief delay to let cards render
  useEffect(() => {
    const t = setTimeout(computeLines, 100);
    return () => clearTimeout(t);
  }, [matchPairs, computeLines]);

  if (lines.length === 0) return null;

  const maxY = Math.max(...lines.flatMap((l) => [l.y1, l.y2])) + 20;
  const maxX = Math.max(...lines.map((l) => l.x2)) + 20;

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none"
      style={{ width: maxX, height: maxY }}
    >
      {lines
        .sort((a, b) => (a.isOurs ? 1 : 0) - (b.isOurs ? 1 : 0))
        .map((line) => {
          const midX = (line.x1 + line.x2) / 2;
          const cp1x = midX;
          const cp2x = midX;
          return (
            <path
              key={line.key}
              d={`M ${line.x1},${line.y1} C ${cp1x},${line.y1} ${cp2x},${line.y2} ${line.x2},${line.y2}`}
              fill="none"
              stroke={line.color}
              strokeWidth={line.thickness}
              strokeOpacity={line.isOurs ? 0.9 : 0.4}
              strokeLinecap="round"
            />
          );
        })}
    </svg>
  );
}

export default function SerpLandscape({ articleId, keywords = [] }) {
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [dateA, setDateA] = useState("");
  const [dateB, setDateB] = useState("");
  const [showExtended, setShowExtended] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);
  const leftRefs = useRef({});
  const rightRefs = useRef({});

  // Auto-select first keyword
  useEffect(() => {
    if (keywords.length > 0 && !selectedKeyword) {
      setSelectedKeyword(keywords[0]);
    }
  }, [keywords, selectedKeyword]);

  const fetchData = useCallback(async () => {
    if (!selectedKeyword?.id || !dateA || !dateB) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api(
        `/articles/${articleId}/serp-landscape?keywordId=${selectedKeyword.id}&dateA=${dateA}&dateB=${dateB}`
      );
      setData(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [articleId, selectedKeyword, dateA, dateB]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to top-10 view when comparison inputs change
  useEffect(() => {
    setShowExtended(false);
  }, [selectedKeyword?.id, dateA, dateB]);

  // Preset handlers
  const applyPreset = (preset) => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const past = new Date(now);

    if (preset === "week") past.setDate(past.getDate() - 7);
    else if (preset === "month") past.setMonth(past.getMonth() - 1);
    else if (preset === "3months") past.setMonth(past.getMonth() - 3);

    setDateA(past.toISOString().split("T")[0]);
    setDateB(todayStr);
  };

  // Initialize with "vs Last Week" preset
  useEffect(() => {
    if (!dateA && !dateB) {
      applyPreset("week");
    }
  }, []);

  // Build match pairs for Bezier lines
  const leftResults = useMemo(() => {
    const rows = data?.dateA?.results || [];
    return showExtended ? rows : rows.filter((r) => r.rank <= 10);
  }, [data, showExtended]);

  const rightResults = useMemo(() => {
    const rows = data?.dateB?.results || [];
    return showExtended ? rows : rows.filter((r) => r.rank <= 10);
  }, [data, showExtended]);

  const hasExtendedRows = useMemo(() => {
    const leftHas = (data?.dateA?.results || []).some((r) => r.rank > 10);
    const rightHas = (data?.dateB?.results || []).some((r) => r.rank > 10);
    return leftHas || rightHas;
  }, [data]);

  const matchPairs = useMemo(() => {
    if (!leftResults.length || !rightResults.length) return [];

    const pairs = [];
    const rightByIdentity = new Map();

    for (const item of rightResults) {
      const id = getItemIdentity(item);
      if (!id) continue;
      if (!rightByIdentity.has(id)) {
        rightByIdentity.set(id, item);
      }
    }

    for (const leftItem of leftResults) {
      const key = getItemIdentity(leftItem);
      if (!key) continue;

      const rightItem = rightByIdentity.get(key);
      if (!rightItem) continue;

      pairs.push({
        leftKey: `left-${leftItem.rank}`,
        rightKey: `right-${rightItem.rank}`,
        leftRank: leftItem.rank,
        rightRank: rightItem.rank,
        domain: leftItem.domain,
      });
    }

    return pairs;
  }, [leftResults, rightResults]);

  // Identity keys only on left or right (for NEW/GONE badges)
  const { leftOnly, rightOnly } = useMemo(() => {
    if (!leftResults.length && !rightResults.length) return { leftOnly: new Set(), rightOnly: new Set() };

    const leftKeys = new Set(leftResults.map(getItemIdentity).filter(Boolean));
    const rightKeys = new Set(rightResults.map(getItemIdentity).filter(Boolean));

    return {
      leftOnly: new Set([...leftKeys].filter((k) => !rightKeys.has(k))),
      rightOnly: new Set([...rightKeys].filter((k) => !leftKeys.has(k))),
    };
  }, [leftResults, rightResults]);

  const ourDomain = data?.ourDomain || "";

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Keyword selector */}
        <div className="min-w-[200px]">
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Keyword</label>
          <div className="relative">
            <select
              value={selectedKeyword?.id || ""}
              onChange={(e) => {
                const kw = keywords.find((k) => k.id === parseInt(e.target.value));
                setSelectedKeyword(kw);
              }}
              className="input pr-8 text-sm"
            >
              {keywords.map((kw) => (
                <option key={kw.id} value={kw.id}>
                  {kw.keyword}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Presets */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Compare</label>
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            {[
              { key: "week", label: "vs Last Week" },
              { key: "month", label: "vs Last Month" },
              { key: "3months", label: "vs 3 Months" },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => applyPreset(p.key)}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-white hover:shadow-sm text-slate-600"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom dates */}
        <div className="flex items-center gap-2">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">From</label>
            <input
              type="date"
              value={dateA}
              onChange={(e) => setDateA(e.target.value)}
              className="input text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">To</label>
            <input
              type="date"
              value={dateB}
              onChange={(e) => setDateB(e.target.value)}
              className="input text-sm"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Spinner className="w-6 h-6" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {!loading && !error && data && !data.dateA && !data.dateB && (
        <div className="text-center py-16 text-slate-400">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No SERP landscape data yet</p>
          <p className="text-xs mt-1">Run a ranking check to start collecting SERP data</p>
        </div>
      )}

      {!loading && !error && data && (data.dateA || data.dateB) && (
        <div className="relative" ref={containerRef}>
          {hasExtendedRows && (
            <div className="flex justify-center mb-3">
              <button
                type="button"
                onClick={() => setShowExtended((s) => !s)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800 transition-colors"
              >
                {showExtended ? "Show top 10 only" : "Show positions 11-20"}
              </button>
            </div>
          )}

          <BezierLines
            leftRefs={leftRefs}
            rightRefs={rightRefs}
            matchPairs={matchPairs}
            ourDomain={ourDomain}
            containerRef={containerRef}
          />

          <div className="grid grid-cols-[minmax(0,1fr)_80px_minmax(0,1fr)] gap-0">
            {/* Left column header */}
            <div className="text-center pb-3">
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                {data.dateA?.date || dateA}
              </span>
              {data.dateA?.serpPosition && (
                <span className="ml-2 text-xs text-slate-500">
                  Our rank: <strong>#{data.dateA.serpPosition}</strong>
                </span>
              )}
            </div>

            {/* Center spacer header */}
            <div />

            {/* Right column header */}
            <div className="text-center pb-3">
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                {data.dateB?.date || dateB}
              </span>
              {data.dateB?.serpPosition && (
                <span className="ml-2 text-xs text-slate-500">
                  Our rank: <strong>#{data.dateB.serpPosition}</strong>
                </span>
              )}
            </div>

            {/* Left column results */}
            <div className="space-y-2 min-w-0">
              {leftResults.map((item) => (
                <div
                  key={`left-${item.rank}`}
                  ref={(el) => { leftRefs.current[`left-${item.rank}`] = el; }}
                  className="relative"
                >
                  <SerpCard
                    item={item}
                    isOurDomain={item.domain && item.domain.includes(ourDomain)}
                    side="left"
                  />
                  {leftOnly.has(getItemIdentity(item)) && (
                    <div className="absolute -right-1 top-0">
                      <StatusBadge type="gone" />
                    </div>
                  )}
                </div>
              ))}
              {leftResults.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No data for this date
                </div>
              )}
            </div>

            {/* Center connection zone (Bezier lines are drawn via SVG overlay) */}
            <div className="relative" />

            {/* Right column results */}
            <div className="space-y-2 min-w-0">
              {rightResults.map((item) => (
                <div
                  key={`right-${item.rank}`}
                  ref={(el) => { rightRefs.current[`right-${item.rank}`] = el; }}
                  className="relative"
                >
                  <SerpCard
                    item={item}
                    isOurDomain={item.domain && item.domain.includes(ourDomain)}
                    side="right"
                  />
                  {rightOnly.has(getItemIdentity(item)) && (
                    <div className="absolute -left-1 top-0">
                      <StatusBadge type="new" />
                    </div>
                  )}
                </div>
              ))}
              {rightResults.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No data for this date
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 bg-emerald-500 rounded" />
              <span className="text-[10px] text-slate-500">Improved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 bg-red-500 rounded" />
              <span className="text-[10px] text-slate-500">Dropped</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 bg-slate-400 rounded" />
              <span className="text-[10px] text-slate-500">Unchanged</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 ring-2 ring-emerald-400" />
              <span className="text-[10px] text-slate-500">Our domain</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
