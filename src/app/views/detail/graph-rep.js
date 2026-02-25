import { format, parseISO, subDays } from "date-fns";
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

const SERPRankingChart = ({
  data,
  viewMode,
  setViewMode,
  dateRange,
  setDateRange,
  chartMetrics,
  setChartMetrics,
}) => {
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [activeNote, setActiveNote] = useState(null);

  // const toggleChartMetric = (metric) => {
  //   setChartMetrics((prev) => ({
  //     ...prev,
  //     [metric]: !prev[metric],
  //   }));
  // };

  // Process the data to create time-series format
  const processedData = useMemo(() => {
    // Group by date and keyword
    const groupedByDate = {};
    
    // First, map all snapshots
    data.keywords.forEach((keyword) => {
      keyword.snapshots.forEach((snapshot) => {
        const dateStr = snapshot.weekStarting.split("T")[0]; // e.g., "2026-02-23"
        
        if (!groupedByDate[dateStr]) {
          groupedByDate[dateStr] = {};
        }
        
        if (chartMetrics.total) {
          groupedByDate[dateStr][keyword.keyword] = snapshot.gscClicks || 0;
        } else {
          groupedByDate[dateStr][keyword.keyword] = snapshot.serpPosition || 100;
        }
      });
    });

    // Then, map all notes
    if (data.notes && data.notes.length > 0) {
      data.notes.forEach(note => {
        if (!note.createdAt) return;
        const dateStr = note.createdAt.split("T")[0];
        
        if (!groupedByDate[dateStr]) {
          groupedByDate[dateStr] = {};
        }
        
        if (!groupedByDate[dateStr].notes) {
          groupedByDate[dateStr].notes = [];
        }
        groupedByDate[dateStr].notes.push(note);
        groupedByDate[dateStr].notePos = 0.05;
      });
    }

    // Convert to array format for Recharts with better date formatting
    const chartData = Object.keys(groupedByDate)
      .sort()
      .map((dateStr) => {
        const fullDate = `${dateStr}T00:00:00Z`;
        return {
          date: format(parseISO(fullDate), "d MMM"), // This gives "2 Feb" format
          fullDate,
          notes: groupedByDate[dateStr].notes || null,
          ...groupedByDate[dateStr],
        };
      });

    // Filter based on time range
    const now = new Date();
    let cutoffDate;

    // Use current settings state (backend now handles primary filtering,
    // but keep this for any client-side refinements if needed)
    if (viewMode === "weekly") {
      cutoffDate = subDays(now, 56); // 8 weeks back
    } else {
      cutoffDate = subDays(now, dateRange);
    }

    return chartData.filter((item) => parseISO(item.fullDate) >= cutoffDate);
  }, [data, viewMode, dateRange, chartMetrics]);

   const shouldShowTick = (_, index, data) => {
    // Show first, last, and every 3rd date in between
    if (index === 0 || index === data.length - 1) return true;
    if (index % 3 === 0) return true;
    return false;
  };

  

  // Get unique colors for lines
  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#ff0000", "#10b981", "#3b82f6", "#8b5cf6"];

  // Handle keyword selection
  const toggleKeyword = (keyword) => {
    if (selectedKeywords.includes(keyword)) {
      setSelectedKeywords(selectedKeywords.filter((k) => k !== keyword));
    } else {
      setSelectedKeywords([...selectedKeywords, keyword]);
    }
  };

  // Custom tooltip with smaller font
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const filteredPayload = payload.filter(
        (entry) => entry.dataKey !== "notePos"
      );

      if (filteredPayload.length === 0) return null;

      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-lg text-xs max-w-xs pointer-events-none">
          <p className="font-bold mb-1 text-xs">{label}</p>
          {filteredPayload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-xs">
              {entry.name}:{" "}
              <span className="font-bold">
                {chartMetrics.total
                  ? entry.value
                  : entry.value === 100
                  ? "Not ranked"
                  : `#${entry.value}`}
              </span>
            </p>
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
    <div className="w-full p-4">
      <div className="chart-header flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-lg font-bold">Performance</h2>
        
        <div className="chart-controls flex flex-wrap items-center gap-4 text-sm">
          <div className="view-type-buttons flex items-center bg-gray-100 rounded-md p-1">
            {/* <button
              className={`px-3 py-1 rounded-md text-xs transition-colors ${
                viewMode === "daily" ? "bg-white shadow-sm font-medium" : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setViewMode("daily")}
            >
              Daily
            </button> */}
            {/* <button
               className={`px-3 py-1 rounded-md text-xs transition-colors ${
                viewMode === "weekly" ? "bg-white shadow-sm font-medium" : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setViewMode("weekly")}
            >
              Weekly
            </button> */}
          </div>

          {viewMode === "daily" ? (
            <div className="date-range-buttons flex items-center gap-1">
              {[7, 30, 60, 90].map((days) => (
                <button
                  key={days}
                   className={`px-2 py-1 rounded-md text-xs transition-colors border ${
                    dateRange === days 
                      ? "bg-blue-50 border-blue-200 text-blue-700 font-medium" 
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setDateRange(days)}
                >
                  {days}d
                </button>
              ))}
            </div>
          ) : (
            <div className="weekly-note">
              <span className="text-xs text-slate-500">Last 8 weeks</span>
            </div>
          )}

          {/* <div className="chart-metrics flex items-center gap-3 border-l pl-4 border-gray-200">
            <label className="checkbox-label flex items-center gap-1.5 cursor-pointer text-xs text-gray-700">
              <input
                type="checkbox"
                checked={chartMetrics.total}
                onChange={() => toggleChartMetric("total")}
                className="rounded text-blue-600 focus:ring-blue-500 h-3 w-3"
              />
              Total Clicks
            </label>
            <label className="checkbox-label flex items-center gap-1.5 cursor-pointer text-xs text-gray-700 opacity-60 tooltip-container" title="Data currently unavailable">
              <input
                type="checkbox"
                checked={chartMetrics.byPlatform}
                onChange={() => toggleChartMetric("byPlatform")}
                className="rounded text-blue-600 focus:ring-blue-500 h-3 w-3"
              />
              By Platform
            </label>
            <label className="checkbox-label flex items-center gap-1.5 cursor-pointer text-xs text-gray-700 opacity-60 tooltip-container" title="Data currently unavailable">
              <input
                type="checkbox"
                checked={chartMetrics.byCategory}
                onChange={() => toggleChartMetric("byCategory")}
                className="rounded text-blue-600 focus:ring-blue-500 h-3 w-3"
              />
              By Category
            </label>
          </div> */}
        </div>
      </div>

      {/* Controls with smaller font */}
      <div className="mb-6 flex flex-wrap gap-4 items-center text-sm">
        {/* Keyword selector with smaller font */}
        <div className="flex flex-wrap gap-2">
          {data.keywords.map((keyword, index) => (
            <button
              key={keyword.id}
              onClick={() => toggleKeyword(keyword.keyword)}
              className={`px-2 py-1 rounded text-xs ${
                selectedKeywords.includes(keyword.keyword)
                  ? "text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              style={{
                backgroundColor: selectedKeywords.includes(keyword.keyword)
                  ? colors[index % colors.length]
                  : undefined,
              }}
            >
              {keyword.keyword.length > 30
                ? `${keyword.keyword.substring(0, 30)}...`
                : keyword.keyword}
            </button>
          ))}
        </div>
      </div>

      {/* Chart with smaller fonts */}
      <div className="w-full h-96 relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={processedData}
            margin={{ top: 5, right: 30, left: 25, bottom: 25 }}
            onMouseLeave={() => setActiveNote(null)}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              label={{
                value: "Date",
                position: "insideBottom",
                offset: -10,
                fontSize: 11,
              }}
              tick={{ fontSize: 10 }}
 tickFormatter={(value, index) => {
            // Return the date only for specific indices
            return shouldShowTick(value, index, data) ? value : "";
          }}            />
            <YAxis
              reversed={!chartMetrics.total} // Reverse only if showing position
              domain={chartMetrics.total ? [0, "auto"] : [1, 100]}
              label={{
                value: chartMetrics.total ? "Clicks" : "Position",
                angle: -90,
                position: "insideLeft",
                fontSize: 11,
                offset: -5,
              }}
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => (!chartMetrics.total && value === 100 ? "NR" : value)}
            />
            <YAxis yAxisId="notes" domain={[0, 1]} hide={true} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
              iconSize={8}
            />

            {data.keywords.map((keyword, index) =>
              selectedKeywords.length === 0 ||
              selectedKeywords.includes(keyword.keyword) ? (
                <Line
                  key={keyword.id}
                  type="monotone"
                  dataKey={keyword.keyword}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                />
              ) : null
            )}

            <Line
              yAxisId="notes"
              type="monotone"
              dataKey="notePos"
              stroke="none"
              activeDot={false}
              isAnimationActive={false}
              dot={renderCustomNoteDot}
            />
          </LineChart>
        </ResponsiveContainer>

        {activeNote && (
          <div
            className="absolute z-10 bg-white p-3 border border-yellow-200 rounded shadow-lg text-xs max-w-sm pointer-events-none"
            style={{
              left: activeNote.x,
              top: activeNote.y,
              transform: "translate(-50%, -100%)",
              marginTop: "-12px",
            }}
          >
            <div className="font-bold text-yellow-600 mb-2 flex items-center gap-1 border-b border-yellow-100 pb-1">
              <span className="h-2 w-2 rounded-full bg-yellow-500 inline-block"></span>
              Notes for {activeNote.date}
            </div>
            {activeNote.notes.map((note, idx) => (
              <div key={idx} className="mb-1 text-gray-700 whitespace-pre-wrap">
                {note.text}
              </div>
            ))}
            <div
              className="absolute w-3 h-3 bg-white border-b border-r border-yellow-200"
              style={{
                bottom: "-7px",
                left: "50%",
                transform: "translateX(-50%) rotate(45deg)",
              }}
            ></div>
          </div>
        )}
      </div>

      {/* Optional: Add a note about date format */}
      <div className="mt-4 text-right text-xs text-gray-400">
        Date format: Day Month (e.g., 2 Feb)
      </div>
    </div>
  );
};

export default SERPRankingChart;
