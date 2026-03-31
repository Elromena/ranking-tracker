import { format, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import {
  Card,
  Table,
  Th,
  Td,
  Badge,
  PositionText,
  ChangeIndicator,
  EmptyState,
} from "@/components/ui";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const SERPDataTable = ({ data, timeRange = "daily", startDate, endDate }) => {
  const [sortConfig, setSortConfig] = useState({
    key: "position",
    direction: "asc",
  });

  const getFilteredSnapshots = (keyword) => {
    return keyword.snapshots.filter((snapshot) => {
      const d = parseISO(snapshot.date || snapshot.weekStarting);
      return d >= startDate && d <= endDate;
    });
  };

  const getLatestSnapshot = (keyword) => {
    const filteredSnapshots = getFilteredSnapshots(keyword);
    return (
      filteredSnapshots.sort(
        (a, b) =>
          new Date(b.date || b.weekStarting) -
          new Date(a.date || a.weekStarting)
      )[0] || keyword.snapshots[0]
    );
  };

  const getAveragePosition = (keyword) => {
    const filteredSnapshots = getFilteredSnapshots(keyword);
    const positions = filteredSnapshots
      .map((s) => s.serpPosition)
      .filter((p) => p);
    if (positions.length === 0) return null;
    return Math.round(positions.reduce((a, b) => a + b, 0) / positions.length);
  };

  const getTrend = (keyword) => {
    const filteredSnapshots = getFilteredSnapshots(keyword).sort(
      (a, b) =>
        new Date(a.date || a.weekStarting) -
        new Date(b.date || b.weekStarting)
    );

    if (filteredSnapshots.length < 2) return null;

    const first = filteredSnapshots[0].serpPosition;
    const last = filteredSnapshots[filteredSnapshots.length - 1].serpPosition;

    if (!first || !last) return null;
    return last - first;
  };

  const processedKeywords = useMemo(() => {
    return (data.keywords || [])
      .filter((k) => k.tracked)
      .map((kw) => {
        const latest = getLatestSnapshot(kw);
        const avgPosition = getAveragePosition(kw);
        const trend = getTrend(kw);

        return {
          ...kw,
          latestSnapshot: latest,
          avgPosition,
          trend,
          snapshotsInRange: getFilteredSnapshots(kw).length,
        };
      });
  }, [data, timeRange]);

  const sortedKeywords = useMemo(() => {
    const sortableKeywords = [...processedKeywords];

    sortableKeywords.sort((a, b) => {
      let aVal, bVal;

      switch (sortConfig.key) {
        case "keyword":
          aVal = a.keyword;
          bVal = b.keyword;
          break;
        case "position":
          aVal = a.latestSnapshot?.serpPosition || 999;
          bVal = b.latestSnapshot?.serpPosition || 999;
          break;
        case "avgPosition":
          aVal = a.avgPosition || 999;
          bVal = b.avgPosition || 999;
          break;
        case "prev":
          aVal = a.latestSnapshot?.prevPosition || 999;
          bVal = b.latestSnapshot?.prevPosition || 999;
          break;
        case "change":
          aVal = a.latestSnapshot?.posChange || 0;
          bVal = b.latestSnapshot?.posChange || 0;
          break;
        case "trend":
          aVal = a.trend || 0;
          bVal = b.trend || 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return sortableKeywords;
  }, [processedKeywords, sortConfig]);

  const requestSort = (key) => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "asc"
          ? "desc"
          : "asc",
    });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return " ↕";
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return "—";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const TrendIndicator = ({ trend }) => {
    if (trend === null) return <span className="text-slate-300">—</span>;
    if (trend < 0) {
      return (
        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
          <TrendingUp size={12} /> Improving
        </span>
      );
    }
    if (trend > 0) {
      return (
        <span className="flex items-center gap-1 text-red-600 font-semibold">
          <TrendingDown size={12} /> Declining
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-slate-400 font-semibold">
        <Minus size={12} /> Stable
      </span>
    );
  };

  const headers = [
    { key: "keyword", label: "Keyword" },
    { key: "position", label: timeRange === "daily" ? "Position" : "Latest Pos" },
    ...(timeRange !== "daily" ? [{ key: "avgPosition", label: "Avg Position" }] : []),
    { key: "prev", label: "Previous" },
    { key: "change", label: "Change" },
    ...(timeRange !== "daily" ? [{ key: "trend", label: "Trend" }] : []),
    { key: "features", label: "Features" },
  ];

  return (
    <Card className="p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <span className="text-xs text-slate-500">
          Showing: <span className="font-semibold text-slate-700">{timeRange}</span> view
        </span>
        <span className="text-xs text-slate-400">
          {sortedKeywords.length} keywords · Updated {format(new Date(), "d MMM, HH:mm")}
        </span>
      </div>

      {/* Table */}
      <Table>
        <thead>
          <tr className="bg-slate-50/50">
            {headers.map((h) => (
              <Th
                key={h.key}
                className="cursor-pointer select-none whitespace-nowrap"
                onClick={() => requestSort(h.key)}
              >
                {h.label}
                <span className="text-[9px] opacity-50 ml-1">
                  {getSortIndicator(h.key)}
                </span>
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedKeywords.map((kw) => {
            const latest = kw.latestSnapshot;
            if (!latest) return null;

            const pos = latest.serpPosition;
            const prev = latest.prevPosition;
            const chg = latest.posChange || 0;

            return (
              <tr key={kw.id}>
                {/* Keyword */}
                <Td className="font-medium max-w-[220px]">
                  <div className="flex items-center gap-2">
                    <span className="truncate">{kw.keyword}</span>
                    <Badge className="text-[9px] shrink-0">
                      {kw.snapshotsInRange} rec
                    </Badge>
                  </div>
                </Td>

                {/* Position */}
                <Td>
                  <PositionText position={pos} />
                </Td>

                {/* Avg Position (weekly/monthly) */}
                {timeRange !== "daily" && (
                  <Td className="font-mono text-xs text-slate-500">
                    {kw.avgPosition ? `#${kw.avgPosition}` : "—"}
                  </Td>
                )}

                {/* Previous */}
                <Td className="font-mono text-xs text-slate-400">
                  {prev ? `#${prev}` : "—"}
                </Td>

                {/* Change */}
                <Td>
                  <ChangeIndicator change={chg} />
                </Td>

                {/* Trend (weekly/monthly) */}
                {timeRange !== "daily" && (
                  <Td className="text-xs">
                    <TrendIndicator trend={kw.trend} />
                  </Td>
                )}

                {/* Features */}
                <Td className="text-[10px] text-slate-500 max-w-[120px] truncate">
                  {latest.serpFeatures || "—"}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      {sortedKeywords.length === 0 && (
        <EmptyState message="No keywords tracked in this time range" />
      )}
    </Card>
  );
};

export default SERPDataTable;
