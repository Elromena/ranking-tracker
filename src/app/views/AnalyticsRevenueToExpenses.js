import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const colors = ["#3b82f6", "#10b981", "#f59e0b"];

const chartData = [
  {
    month: "Aug 2024",
    "web3 advertising": 8,
    "blockchain advertising": 6,
    "web3 ads": 4,
  },
  {
    month: "Sep 2024",
    "web3 advertising": 7,
    "blockchain advertising": 5,
    "web3 ads": 3,
  },
  {
    month: "Oct 2024",
    "web3 advertising": 6,
    "blockchain advertising": 4,
    "web3 ads": 2,
  },
  {
    month: "Nov 2024",
    "web3 advertising": 9,
    "blockchain advertising": 6,
    "web3 ads": 5,
  },
];

export default function RankingChart() {
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
