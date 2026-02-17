import {
  format,
  isAfter,
  parseISO,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { useMemo, useState } from "react";

const SERPDataTable = ({ data, timeRange = "daily" }) => {
  const [sortConfig, setSortConfig] = useState({
    key: "position",
    direction: "asc",
  });

  // Filter snapshots based on time range
  const getFilteredSnapshots = (keyword) => {
    const now = new Date();
    let cutoffDate;

    switch (timeRange) {
      case "daily":
        cutoffDate = subDays(now, 1);
        break;
      case "weekly":
        cutoffDate = subWeeks(now, 7);
        break;
      case "monthly":
        cutoffDate = subMonths(now, 30);
        break;
      default:
        cutoffDate = subDays(now, 1);
    }

    return keyword.snapshots.filter((snapshot) =>
      isAfter(parseISO(snapshot.weekStarting), cutoffDate),
    );
  };

  // Get the latest snapshot for each keyword within the time range
  const getLatestSnapshot = (keyword) => {
    const filteredSnapshots = getFilteredSnapshots(keyword);
    return (
      filteredSnapshots.sort(
        (a, b) => new Date(b.weekStarting) - new Date(a.weekStarting),
      )[0] || keyword.snapshots[0]
    ); // Fallback to first if none in range
  };

  // Calculate average position for the time range
  const getAveragePosition = (keyword) => {
    const filteredSnapshots = getFilteredSnapshots(keyword);
    const positions = filteredSnapshots
      .map((s) => s.serpPosition)
      .filter((p) => p);
    if (positions.length === 0) return null;
    return Math.round(positions.reduce((a, b) => a + b, 0) / positions.length);
  };

  // Calculate trend (improving/declining)
  const getTrend = (keyword) => {
    const filteredSnapshots = getFilteredSnapshots(keyword).sort(
      (a, b) => new Date(a.weekStarting) - new Date(b.weekStarting),
    );

    if (filteredSnapshots.length < 2) return null;

    const first = filteredSnapshots[0].serpPosition;
    const last = filteredSnapshots[filteredSnapshots.length - 1].serpPosition;

    if (!first || !last) return null;
    return last - first; // Negative means improving (lower number = better)
  };

  // Process keywords with time-range data
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

  // Sorting function
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
        case "change":
          aVal = a.latestSnapshot?.posChange || 0;
          bVal = b.latestSnapshot?.posChange || 0;
          break;
        case "trend":
          aVal = a.trend || 0;
          bVal = b.trend || 0;
          break;
        case "clicks":
          aVal = a.latestSnapshot?.gscClicks || 0;
          bVal = b.latestSnapshot?.gscClicks || 0;
          break;
        case "impressions":
          aVal = a.latestSnapshot?.gscImpressions || 0;
          bVal = b.latestSnapshot?.gscImpressions || 0;
          break;
        case "ctr":
          aVal = a.latestSnapshot?.gscCtr || 0;
          bVal = b.latestSnapshot?.gscCtr || 0;
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
    if (sortConfig.key !== key) return " ↕️";
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  // Dynamic headers based on time range
  const getHeaders = () => {
    const baseHeaders = [
      { key: "keyword", label: "Keyword" },
      {
        key: "position",
        label: timeRange === "daily" ? "Position" : "Latest Pos",
      },
    ];

    if (timeRange !== "daily") {
      baseHeaders.push({ key: "avgPosition", label: "Avg Position" });
    }

    baseHeaders.push(
      { key: "prev", label: "Previous" },
      { key: "change", label: "Change" },
    );

    if (timeRange !== "daily") {
      baseHeaders.push({ key: "trend", label: "Trend" });
    }

    baseHeaders.push(
      { key: "clicks", label: "Clicks" },
      { key: "impressions", label: "Impressions" },
      { key: "ctr", label: "CTR" },
      { key: "features", label: "Features" },
    );

    return baseHeaders;
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return "—";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const getChangeColor = (change) => {
    if (change > 0) return "#059669"; // Green for positive
    if (change < 0) return "#dc2626"; // Red for negative
    return "#94a3b8"; // Gray for no change
  };

  const getTrendIcon = (trend) => {
    if (trend === null) return "—";
    if (trend < 0) return "📈 Improving";
    if (trend > 0) return "📉 Declining";
    return "➡️ Stable";
  };

  return (
    <div>
      {/* Time range indicator and record count */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          fontSize: 11,
          color: "#64748b",
        }}
      >
        <span>
          Showing data for: <strong>{timeRange}</strong> view
        </span>
        <span>
          {sortedKeywords.length} keywords tracked • Last updated:{" "}
          {format(new Date(), "d MMM, HH:mm")}
        </span>
      </div>

      {/* Table */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          overflow: "auto",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          maxHeight: "600px",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 11,
            minWidth: "1000px",
          }}
        >
          <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
            <tr style={{ background: "#f8fafc" }}>
              {getHeaders().map((h) => (
                <th
                  key={h.key}
                  onClick={() => requestSort(h.key)}
                  style={{
                    padding: "10px 8px",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "#475569",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: 0.3,
                    borderBottom: "2px solid #e2e8f0",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    userSelect: "none",
                  }}
                >
                  {h.label}
                  <span style={{ fontSize: 9, opacity: 0.5, marginLeft: 2 }}>
                    {getSortIndicator(h.key)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedKeywords.map((kw, i) => {
              const latest = kw.latestSnapshot;
              if (!latest) return null;

              const pos = latest.serpPosition;
              const prev = latest.prevPosition;
              const chg = latest.posChange || 0;
              const avgPos = kw.avgPosition;
              const trend = kw.trend;

              return (
                <tr
                  key={kw.id}
                  style={{
                    borderBottom: "1px solid #f1f5f9",
                    background: i % 2 === 0 ? "#fff" : "#fafbfc",
                    fontSize: 11,
                  }}
                >
                  {/* Keyword */}
                  <td
                    style={{
                      padding: "8px 8px",
                      fontWeight: 500,
                      maxWidth: "200px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {kw.keyword}
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 9,
                        color: "#94a3b8",
                        background: "#f1f5f9",
                        padding: "2px 4px",
                        borderRadius: 4,
                      }}
                    >
                      {kw.snapshotsInRange} rec
                    </span>
                  </td>

                  {/* Position / Latest Position */}
                  <td
                    style={{
                      padding: "8px 8px",
                      fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                      fontWeight: 600,
                      fontSize: 11,
                      color:
                        pos && pos <= 3
                          ? "#059669"
                          : pos && pos <= 10
                            ? "#0f172a"
                            : pos && pos <= 20
                              ? "#b45309"
                              : "#dc2626",
                    }}
                  >
                    {pos ? `#${pos}` : "—"}
                  </td>

                  {/* Average Position (for weekly/monthly) */}
                  {timeRange !== "daily" && (
                    <td
                      style={{
                        padding: "8px 8px",
                        fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                        fontSize: 11,
                        color: "#64748b",
                      }}
                    >
                      {avgPos ? `#${avgPos}` : "—"}
                    </td>
                  )}

                  {/* Previous Position */}
                  <td
                    style={{
                      padding: "8px 8px",
                      fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                      fontSize: 11,
                      color: "#94a3b8",
                    }}
                  >
                    {prev ? `#${prev}` : "—"}
                  </td>

                  {/* Change */}
                  <td
                    style={{
                      padding: "8px 8px",
                      fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                      fontWeight: 600,
                      fontSize: 11,
                      color: getChangeColor(chg),
                    }}
                  >
                    {chg > 0 ? "+" : ""}
                    {chg || 0}
                  </td>

                  {/* Trend (for weekly/monthly) */}
                  {timeRange !== "daily" && (
                    <td
                      style={{
                        padding: "8px 8px",
                        fontSize: 11,
                        color:
                          trend < 0
                            ? "#059669"
                            : trend > 0
                              ? "#dc2626"
                              : "#64748b",
                      }}
                    >
                      {getTrendIcon(trend)}
                    </td>
                  )}

                  {/* Clicks */}
                  <td
                    style={{
                      padding: "8px 8px",
                      fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                      fontSize: 11,
                      fontWeight: latest.gscClicks > 0 ? 600 : 400,
                    }}
                  >
                    {formatNumber(latest.gscClicks)}
                  </td>

                  {/* Impressions */}
                  <td
                    style={{
                      padding: "8px 8px",
                      fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                      fontSize: 11,
                      color: "#64748b",
                    }}
                  >
                    {formatNumber(latest.gscImpressions)}
                  </td>

                  {/* CTR */}
                  <td
                    style={{
                      padding: "8px 8px",
                      fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                      fontSize: 11,
                    }}
                  >
                    {latest.gscCtr
                      ? (latest.gscCtr * 100).toFixed(1) + "%"
                      : "—"}
                  </td>

                  {/* Features */}
                  <td
                    style={{
                      padding: "8px 8px",
                      fontSize: 10,
                      color: "#64748b",
                      maxWidth: "120px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {latest.serpFeatures || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty state */}
        {sortedKeywords.length === 0 && (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 12,
            }}
          >
            No keywords tracked in this time range
          </div>
        )}
      </div>

      {/* Legend/Info */}
      <div
        style={{
          marginTop: 12,
          display: "flex",
          gap: 16,
          fontSize: 10,
          color: "#64748b",
          flexWrap: "wrap",
        }}
      >
        <span>🎨 Color: 🟢 Top 3 • ⚫ Top 10 • 🟠 Top 20 • 🔴 20+</span>
        <span>📊 "rec" = records in selected period</span>
        <span>↕️ Click headers to sort</span>
      </div>
    </div>
  );
};

export default SERPDataTable;
