import { format, parseISO, startOfWeek, startOfMonth } from "date-fns";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Design-system aligned colors
const CHART_COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#8b5cf6", // violet-500
  "#f59e0b", // amber-500
  "#f43f5e", // rose-500
  "#06b6d4", // cyan-500
  "#ec4899", // pink-500
  "#64748b", // slate-500
];

function getBucketKey(dateStr, viewMode) {
  if (viewMode === "weekly") {
    const d = parseISO(`${dateStr}T00:00:00Z`);
    return format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
  }
  if (viewMode === "monthly") {
    const d = parseISO(`${dateStr}T00:00:00Z`);
    return format(startOfMonth(d), "yyyy-MM-dd");
  }
  return dateStr;
}

function formatBucketLabel(dateStr, viewMode) {
  const d = parseISO(`${dateStr}T00:00:00Z`);
  if (viewMode === "weekly") return `w/o ${format(d, "d MMM")}`;
  if (viewMode === "monthly") return format(d, "MMM yyyy");
  return format(d, "d MMM");
}

const SERPRankingChart = ({
  data,
  chartMetrics,
  startDate: propStartDate,
  endDate: propEndDate,
  pageTraffic = [],
  viewMode = "daily",
}) => {
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [activeNote, setActiveNote] = useState(null);

  const isTrafficMode = chartMetrics.total;

  const processedData = useMemo(() => {
    const dailyData = {};

    if (isTrafficMode) {
      for (const pt of pageTraffic) {
        const dateStr = pt.date.split("T")[0];
        if (!dailyData[dateStr]) dailyData[dateStr] = {};
        dailyData[dateStr]["Page Clicks"] = (dailyData[dateStr]["Page Clicks"] || 0) + (pt.clicks || 0);
      }
    } else {
      data.keywords.forEach((keyword) => {
        keyword.snapshots.forEach((snapshot) => {
          const dateStr = (snapshot.date || snapshot.weekStarting).split("T")[0];
          if (!dailyData[dateStr]) dailyData[dateStr] = {};
          dailyData[dateStr][keyword.keyword] = snapshot.serpPosition || 100;
        });
      });
    }

    if (data.notes && data.notes.length > 0) {
      data.notes.forEach((note) => {
        if (!note.createdAt) return;
        const dateStr = note.createdAt.split("T")[0];
        if (!dailyData[dateStr]) dailyData[dateStr] = {};
        if (!dailyData[dateStr].notes) dailyData[dateStr].notes = [];
        dailyData[dateStr].notes.push(note);
      });
    }

    const filteredDates = Object.keys(dailyData).filter((dateStr) => {
      const d = parseISO(`${dateStr}T00:00:00Z`);
      return d >= propStartDate && d <= propEndDate;
    }).sort();

    if (viewMode === "daily") {
      return filteredDates.map((dateStr) => ({
        date: format(parseISO(`${dateStr}T00:00:00Z`), "d MMM"),
        fullDate: `${dateStr}T00:00:00Z`,
        notes: dailyData[dateStr].notes || null,
        notePos: dailyData[dateStr].notes ? 0.05 : undefined,
        ...dailyData[dateStr],
      }));
    }

    const kwNames = isTrafficMode
      ? ["Page Clicks"]
      : data.keywords.map((k) => k.keyword);
    const buckets = {};

    for (const dateStr of filteredDates) {
      const key = getBucketKey(dateStr, viewMode);
      if (!buckets[key]) {
        buckets[key] = { sums: {}, counts: {}, notes: [] };
        kwNames.forEach((kw) => { buckets[key].sums[kw] = 0; buckets[key].counts[kw] = 0; });
      }
      const bucket = buckets[key];
      kwNames.forEach((kw) => {
        const val = dailyData[dateStr][kw];
        if (val != null) {
          bucket.sums[kw] += val;
          bucket.counts[kw]++;
        }
      });
      if (dailyData[dateStr].notes) {
        bucket.notes.push(...dailyData[dateStr].notes);
      }
    }

    return Object.keys(buckets).sort().map((key) => {
      const b = buckets[key];
      const point = {
        date: formatBucketLabel(key, viewMode),
        fullDate: `${key}T00:00:00Z`,
        notes: b.notes.length > 0 ? b.notes : null,
        notePos: b.notes.length > 0 ? 0.05 : undefined,
      };
      kwNames.forEach((kw) => {
        if (b.counts[kw] > 0) {
          point[kw] = isTrafficMode
            ? b.sums[kw]
            : Math.round(b.sums[kw] / b.counts[kw]);
        }
      });
      return point;
    });
  }, [data, isTrafficMode, pageTraffic, propStartDate, propEndDate, viewMode]);

  const shouldShowTick = (_, index, data) => {
    if (index === 0 || index === data.length - 1) return true;
    if (index % 3 === 0) return true;
    return false;
  };

  const toggleKeyword = (keyword) => {
    if (selectedKeywords.includes(keyword)) {
      setSelectedKeywords(selectedKeywords.filter((k) => k !== keyword));
    } else {
      setSelectedKeywords([...selectedKeywords, keyword]);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const filteredPayload = payload.filter(
        (entry) => entry.dataKey !== "notePos"
      );

      if (filteredPayload.length === 0) return null;

      return (
        <div className="bg-white px-3 py-2.5 border border-slate-200 rounded-xl shadow-sm text-xs max-w-xs pointer-events-none">
          <p className="font-semibold text-slate-900 mb-1.5 text-xs">{label}</p>
          {filteredPayload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 py-0.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-500 truncate">{entry.name}</span>
              <span className="font-mono font-bold text-slate-900 ml-auto">
                {chartMetrics.total
                  ? entry.value
                  : entry.value === 100
                    ? "NR"
                    : `#${entry.value}`}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderCustomNoteDot = (props) => {
    const { cx, cy, payload } = props;
    if (!payload.notes || payload.notes.length === 0) return null;
    return (
      <circle
        key={`note-dot-${payload.date}`}
        cx={cx}
        cy={cy}
        r={6}
        fill="#f59e0b"
        stroke="#fff"
        strokeWidth={2}
        onMouseEnter={() =>
          setActiveNote({
            x: cx,
            y: cy,
            notes: payload.notes,
            date: payload.date,
          })
        }
        onMouseLeave={() => setActiveNote(null)}
        style={{ cursor: "pointer", pointerEvents: "all" }}
      />
    );
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-sm font-bold text-slate-700">Ranking Positions</h2>
        <p className="text-xs text-slate-400">Lower is better — position 1 = top of Google</p>
      </div>

      {/* Keyword toggles (only in ranking mode, not traffic mode) */}
      {!isTrafficMode && (
        <div className="mb-5 flex flex-wrap gap-1.5">
          {data.keywords.map((keyword, index) => (
            <button
              key={keyword.id}
              onClick={() => toggleKeyword(keyword.keyword)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors border ${
                selectedKeywords.length === 0 || selectedKeywords.includes(keyword.keyword)
                  ? "text-white border-transparent"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
              style={
                selectedKeywords.length === 0 || selectedKeywords.includes(keyword.keyword)
                  ? { backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }
                  : undefined
              }
            >
              {keyword.keyword.length > 30
                ? `${keyword.keyword.substring(0, 30)}...`
                : keyword.keyword}
            </button>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="w-full h-96 relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={processedData}
            margin={{ top: 5, right: 30, left: 25, bottom: 25 }}
            onMouseLeave={() => setActiveNote(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              label={{
                value: "Date",
                position: "insideBottom",
                offset: -10,
                fontSize: 12,
                fill: "#94a3b8",
              }}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickFormatter={(value, index) => {
                return shouldShowTick(value, index, processedData) ? value : "";
              }}
              stroke="#e2e8f0"
            />
            <YAxis
              reversed={!chartMetrics.total}
              domain={chartMetrics.total ? [0, "auto"] : [1, 100]}
              label={{
                value: chartMetrics.total ? "Clicks" : "Position",
                angle: -90,
                position: "insideLeft",
                fontSize: 12,
                offset: -5,
                fill: "#94a3b8",
              }}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickFormatter={(value) =>
                !chartMetrics.total && value === 100 ? "NR" : value
              }
              stroke="#e2e8f0"
            />
            <YAxis yAxisId="notes" domain={[0, 1]} hide={true} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
              iconSize={10}
              iconType="circle"
              payload={
                isTrafficMode
                  ? [{ value: "Page Clicks", type: "circle", color: "#3b82f6" }]
                  : data.keywords
                      .filter((kw) => selectedKeywords.length === 0 || selectedKeywords.includes(kw.keyword))
                      .map((kw, i) => ({ value: kw.keyword, type: "circle", color: CHART_COLORS[i % CHART_COLORS.length] }))
              }
            />

            {isTrafficMode ? (
              <Line
                key="page-clicks"
                type="monotone"
                dataKey="Page Clicks"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3, fill: "#3b82f6" }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            ) : (
              data.keywords.map((keyword, index) =>
                selectedKeywords.length === 0 ||
                selectedKeywords.includes(keyword.keyword) ? (
                  <Line
                    key={keyword.id}
                    type="monotone"
                    dataKey={keyword.keyword}
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3, fill: CHART_COLORS[index % CHART_COLORS.length] }}
                    activeDot={{ r: 5 }}
                    connectNulls={false}
                  />
                ) : null
              )
            )}

            <Line
              yAxisId="notes"
              type="monotone"
              dataKey="notePos"
              stroke="none"
              activeDot={false}
              isAnimationActive={false}
              dot={renderCustomNoteDot}
              legendType="none"
            />
          </LineChart>
        </ResponsiveContainer>

        {activeNote && (
          <div
            className="absolute z-10 bg-white px-3 py-2.5 border border-amber-200 rounded-xl shadow-sm text-xs max-w-sm pointer-events-none"
            style={{
              left: activeNote.x,
              top: activeNote.y,
              transform: "translate(-50%, -100%)",
              marginTop: "-12px",
            }}
          >
            <div className="font-bold text-amber-600 mb-1.5 flex items-center gap-1.5 border-b border-amber-100 pb-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
              Notes — {activeNote.date}
            </div>
            {activeNote.notes.map((note, idx) => (
              <div key={idx} className="text-slate-600 whitespace-pre-wrap py-0.5">
                {note.text}
              </div>
            ))}
            <div
              className="absolute w-3 h-3 bg-white border-b border-r border-amber-200"
              style={{
                bottom: "-7px",
                left: "50%",
                transform: "translateX(-50%) rotate(45deg)",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SERPRankingChart;
