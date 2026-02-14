import Btn from "@/component/btn";
import Loading from "@/component/loading";
import Pill from "@/component/pill";
import { api } from "@/lib/services";
import { useEffect, useState } from "react";

export default function WeeklyReportView({ onSelectUrl }) {
  const [data, setData] = useState(null);
  const [selWeek, setSelWeek] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/weekly?weeks=4").then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading || !data) return <Loading />;

  const weeksList = data.weeks || [];
  const currentWeek = weeksList[selWeek];
  const rows = (data.data?.[currentWeek] || []).sort(
    (a, b) => parseFloat(a.avgPosition || 99) - parseFloat(b.avgPosition || 99),
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {weeksList.map((w, i) => (
          <Pill
            key={i}
            active={selWeek === i}
            onClick={() => {
              setSelWeek(i);
              setExpanded(null);
            }}
          >
            Week of{" "}
            {new Date(w).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Pill>
        ))}
        {weeksList.length === 0 && (
          <div style={{ color: "#94a3b8", fontSize: 13 }}>
            No weekly data yet. Run the cron job to collect data.
          </div>
        )}
      </div>
      {rows.length > 0 && (
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
          >
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {[
                  "",
                  "Article",
                  "Avg Position",
                  "Clicks",
                  "Impressions",
                  "CTR",
                  "Alert",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 14px",
                      textAlign: "left",
                      fontWeight: 700,
                      color: "#64748b",
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      borderBottom: "2px solid #e2e8f0",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody key={`tbody`}>
              {rows.map((r, i) => {
                const isExp = expanded === r.urlId;
                return (
                  <>
                    <tr
                      key={r.urlId}
                      style={{
                        borderBottom: isExp ? "none" : "1px solid #f8fafc",
                        background: i % 2 === 0 ? "#fff" : "#fafbfc",
                        cursor: "pointer",
                      }}
                      onClick={() => setExpanded(isExp ? null : r.urlId)}
                    >
                      <td style={{ padding: "10px 8px 10px 14px", width: 20 }}>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          style={{
                            transform: isExp ? "rotate(90deg)" : "none",
                            transition: "transform 0.15s",
                            color: "#94a3b8",
                          }}
                        >
                          <path
                            d="M4 2l4 4-4 4"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                          />
                        </svg>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {r.title}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "#94a3b8",
                            marginTop: 1,
                          }}
                        >
                          {r.category} · {r.kwCount} keywords
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          fontFamily: "'JetBrains Mono',monospace",
                          fontWeight: 700,
                          fontSize: 14,
                          color:
                            parseFloat(r.avgPosition) <= 5
                              ? "#059669"
                              : parseFloat(r.avgPosition) <= 10
                                ? "#0f172a"
                                : "#dc2626",
                        }}
                      >
                        {r.avgPosition || "—"}
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          fontFamily: "'JetBrains Mono',monospace",
                          fontWeight: 600,
                        }}
                      >
                        {r.totalClicks.toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          fontFamily: "'JetBrains Mono',monospace",
                          color: "#94a3b8",
                        }}
                      >
                        {r.totalImpressions.toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          fontFamily: "'JetBrains Mono',monospace",
                        }}
                      >
                        {(r.ctr * 100).toFixed(1)}%
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {r.alertText || (
                          <span style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </td>
                    </tr>
                    {isExp && (
                      <tr key={`${r.urlId}-exp`}>
                        <td
                          colSpan={7}
                          style={{ padding: 0, background: "#f8fafc" }}
                        >
                          <div style={{ padding: "4px 14px 14px 42px" }}>
                            <table
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                fontSize: 11,
                              }}
                            >
                              <thead>
                                <tr>
                                  {[
                                    "Keyword",
                                    "Position",
                                    "Change",
                                    "Clicks",
                                    "Impr",
                                    "CTR",
                                  ].map((h) => (
                                    <th
                                      key={h}
                                      style={{
                                        padding: "8px 10px",
                                        textAlign: "left",
                                        fontWeight: 700,
                                        color: "#94a3b8",
                                        fontSize: 10,
                                        borderBottom: "1px solid #e2e8f0",
                                      }}
                                    >
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {(r.keywords || []).map((kw, ki) => {
                                  const chg = kw.posChange || 0;
                                  return (
                                    <tr
                                      key={ki}
                                      style={{
                                        borderBottom: "1px solid #f1f5f9",
                                      }}
                                    >
                                      <td
                                        style={{
                                          padding: "6px 10px",
                                          fontWeight: 500,
                                        }}
                                      >
                                        {kw.keyword}
                                      </td>
                                      <td
                                        style={{
                                          padding: "6px 10px",
                                          fontFamily:
                                            "'JetBrains Mono',monospace",
                                          fontWeight: 700,
                                          color:
                                            kw.serpPosition &&
                                            kw.serpPosition <= 3
                                              ? "#059669"
                                              : kw.serpPosition &&
                                                  kw.serpPosition <= 10
                                                ? "#0f172a"
                                                : "#dc2626",
                                        }}
                                      >
                                        {kw.serpPosition
                                          ? `#${kw.serpPosition}`
                                          : "—"}
                                      </td>
                                      <td
                                        style={{
                                          padding: "6px 10px",
                                          fontFamily:
                                            "'JetBrains Mono',monospace",
                                          fontWeight: 700,
                                          color:
                                            chg > 0
                                              ? "#059669"
                                              : chg < 0
                                                ? "#dc2626"
                                                : "#94a3b8",
                                        }}
                                      >
                                        {chg > 0 ? "+" : ""}
                                        {chg}
                                      </td>
                                      <td
                                        style={{
                                          padding: "6px 10px",
                                          fontFamily:
                                            "'JetBrains Mono',monospace",
                                        }}
                                      >
                                        {kw.clicks}
                                      </td>
                                      <td
                                        style={{
                                          padding: "6px 10px",
                                          fontFamily:
                                            "'JetBrains Mono',monospace",
                                          color: "#94a3b8",
                                        }}
                                      >
                                        {kw.impressions?.toLocaleString()}
                                      </td>
                                      <td
                                        style={{
                                          padding: "6px 10px",
                                          fontFamily:
                                            "'JetBrains Mono',monospace",
                                        }}
                                      >
                                        {kw.ctr
                                          ? (kw.ctr * 100).toFixed(1) + "%"
                                          : "—"}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                            <div style={{ marginTop: 10 }}>
                              <Btn
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectUrl(r.urlId);
                                }}
                              >
                                → Full article detail
                              </Btn>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
