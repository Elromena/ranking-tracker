import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const colors = ["#3b82f6", "#10b981", "#f59e0b"];

export default function RankingChart({ chartData }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

        <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} />

        {/* reversed because lower ranking is better */}
        <YAxis
          reversed
          domain={[1, "auto"]}
          tick={{ fontSize: 10, fill: "#94a3b8" }}
        />

        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e2e8f0",
          }}
        />

        {Object.keys(chartData[0])
          .filter((key) => key !== "month")
          .map((kw, i) => (
            <Line
              key={kw}
              type="monotone"
              dataKey={kw}
              stroke={colors[i % colors.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              name={kw}
            />
          ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
