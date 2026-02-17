import { format, parseISO, subDays, subMonths, subWeeks } from "date-fns";
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

const SERPRankingChart = ({ data, viewMode }) => {
  const [selectedKeywords, setSelectedKeywords] = useState([]);

  // Process the data to create time-series format
  const processedData = useMemo(() => {
    // Get all unique dates from all snapshots
    const allSnapshots = data.keywords.flatMap((keyword) =>
      keyword.snapshots.map((snapshot) => ({
        date: snapshot.weekStarting,
        keywordId: keyword.id,
        keywordName: keyword.keyword,
        position: snapshot.serpPosition || 100,
        prevPosition: snapshot.prevPosition,
        posChange: snapshot.posChange,
      })),
    );

    // Group by date and keyword
    const groupedByDate = {};
    allSnapshots.forEach((snapshot) => {
      if (!groupedByDate[snapshot.date]) {
        groupedByDate[snapshot.date] = {};
      }
      groupedByDate[snapshot.date][snapshot.keywordName] = snapshot.position;
    });

    // Convert to array format for Recharts with better date formatting
    const chartData = Object.keys(groupedByDate)
      .sort()
      .map((date) => ({
        date: format(parseISO(date), "d MMM"), // This gives "2 Feb" format
        fullDate: date,
        ...groupedByDate[date],
      }));

    // Filter based on time range
    const now = new Date();
    let cutoffDate;

    switch (viewMode) {
      case "daily":
        cutoffDate = subDays(now, 1);
        break;
      case "weekly":
        cutoffDate = subWeeks(now, 1);
        break;
      case "monthly":
        cutoffDate = subMonths(now, 1);
        break;
      default:
        cutoffDate = subDays(now, 1);
    }

    return chartData.filter((item) => parseISO(item.fullDate) >= cutoffDate);
  }, [data, viewMode]);

  // Get unique colors for lines
  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#ff0000"];

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
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-lg text-xs">
          <p className="font-bold mb-1 text-xs">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-xs">
              {entry.name}:{" "}
              <span className="font-bold">
                {entry.value === 100 ? "Not ranked" : `#${entry.value}`}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full p-4">
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
      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={processedData}
            margin={{ top: 5, right: 30, left: 25, bottom: 25 }}
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
              tickFormatter={(value) => value}
            />
            <YAxis
              reversed
              domain={[1, 100]}
              label={{
                value: "Position",
                angle: -90,
                position: "insideLeft",
                fontSize: 11,
                offset: -5,
              }}
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => (value === 100 ? "NR" : value)}
            />
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
              ) : null,
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Optional: Add a note about date format */}
      <div className="mt-4 text-right text-xs text-gray-400">
        Date format: Day Month (e.g., 2 Feb)
      </div>
    </div>
  );
};

export default SERPRankingChart;
