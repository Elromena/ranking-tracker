import Badge from "@/app/component/badge";
import Btn from "@/app/component/btn";
import Loading from "@/app/component/loading";
import Pill from "@/app/component/pill";
import { api } from "@/lib/services";
import { sevCfg, statusCfg, stCfg } from "@/lib/utils";
import { useEffect, useState } from "react";
import RankingChart from "./keywords-graph";

export default function URLDetailView({
  urlId,
  onBack,
  onEdit,
  onDelete,
  onRefresh,
}) {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("overview");
  const [noteText, setNoteText] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState(null);
  const [viewMode, setViewMode] = useState("daily");
  const [graphData, setGraphData] = useState();

  function buildChartData(keywords, mode = "monthly") {
    const map = {};

    keywords.forEach((kw) => {
      kw.snapshots?.forEach((snap) => {
        const date = new Date(snap.weekStarting);

        let label;

        if (mode === "daily") {
          label = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          });
        }

        if (mode === "weekly") {
          const firstDayOfWeek = new Date(date);
          firstDayOfWeek.setUTCDate(date.getUTCDate() - date.getUTCDay());

          label = firstDayOfWeek.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          });
        }

        if (mode === "monthly") {
          label = date.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
            timeZone: "UTC",
          });
        }

        if (!map[label]) {
          map[label] = { month: label };
        }

        map[label][kw.keyword] = snap.serpPosition;
      });
    });

    return Object.values(map).sort(
      (a, b) => new Date(a.month) - new Date(b.month),
    );
  }

  useEffect(() => {
    setLoading(true);
    api(`/urls/${urlId}`).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [urlId]);

  // console.log(data);

  useEffect(() => {
    if (!data?.keywords) return;

    const chartData = buildChartData(data.keywords, viewMode);
    setGraphData(chartData);
  }, [data, viewMode]);

  if (loading || !data)
    return (
      <>
        <Btn variant="ghost" onClick={onBack}>
          ← Back
        </Btn>
        <Loading />
      </>
    );

  const sc = statusCfg[data.status] || statusCfg.active;
  const allAlerts =
    data.keywords?.flatMap((k) =>
      (k.alerts || []).map((a) => ({ ...a, keyword: k.keyword })),
    ) || [];

  // Build weekly data from snapshots for charts
  const snapshotsByKw = {};
  for (const kw of data.keywords || []) {
    snapshotsByKw[kw.keyword] = (kw.snapshots || []).sort(
      (a, b) => new Date(a.weekStarting) - new Date(b.weekStarting),
    );
  }

  // Latest week stats
  let latestClicks = 0,
    prevClicks = 0;
  for (const kw of data.keywords || []) {
    const snaps = kw.snapshots || [];
    if (snaps[0]) latestClicks += snaps[0].gscClicks || 0;
    if (snaps[1]) prevClicks += snaps[1].gscClicks || 0;
  }
  const clickChg =
    prevClicks > 0
      ? (((latestClicks - prevClicks) / prevClicks) * 100).toFixed(0)
      : 0;

  const addNote = async () => {
    if (!noteText.trim()) return;
    await api(`/urls/${urlId}/notes`, {
      method: "POST",
      body: JSON.stringify({ text: noteText.trim() }),
    });
    setNoteText("");
    const updated = await api(`/urls/${urlId}`);
    setData(updated);
  };

  const refreshRankings = async () => {
    setRefreshing(true);
    setRefreshResult(null);
    try {
      const result = await api("/admin/trigger-url", {
        method: "POST",
        body: JSON.stringify({ urlId: parseInt(urlId) }),
      });
      setRefreshResult(result);
      if (result.ok) {
        // Reload the data to show updated rankings
        const updated = await api(`/urls/${urlId}`);
        setData(updated);
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      setRefreshResult({ ok: false, error: e.message });
    }
    setRefreshing(false);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Btn variant="ghost" onClick={onBack}>
          ← Back to all URLs
        </Btn>
        <Btn
          variant={refreshing ? "secondary" : "primary"}
          size="sm"
          onClick={refreshRankings}
        >
          {refreshing ? "⏳ Refreshing..." : "🔄 Refresh Rankings"}
        </Btn>
      </div>
      {refreshResult && (
        <div
          style={{
            padding: 14,
            borderRadius: 8,
            background: refreshResult.ok ? "#ecfdf5" : "#fef2f2",
            fontSize: 12,
            marginBottom: 14,
          }}
        >
          {refreshResult.ok ? (
            <>
              <div style={{ fontWeight: 700, color: "#059669" }}>
                ✅ Rankings updated in {refreshResult.duration}
              </div>
              <div style={{ color: "#065f46", marginTop: 4 }}>
                Processed {refreshResult.stats?.keywordsProcessed || 0} keywords
                • GSC: {refreshResult.stats?.gscResults || 0} • DFS:{" "}
                {refreshResult.stats?.dfsResults || 0}
              </div>
              {refreshResult.alerts &&
                (refreshResult.alerts.critical > 0 ||
                  refreshResult.alerts.warning > 0 ||
                  refreshResult.alerts.positive > 0) && (
                  <div style={{ color: "#065f46", marginTop: 4 }}>
                    Alerts: {refreshResult.alerts.critical} critical,{" "}
                    {refreshResult.alerts.warning} warnings,{" "}
                    {refreshResult.alerts.positive} positive
                  </div>
                )}
            </>
          ) : (
            <div style={{ color: "#dc2626", fontWeight: 600 }}>
              ❌ Error: {refreshResult.error}
            </div>
          )}
        </div>
      )}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "20px 24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                {data.title}
              </h2>
              <Badge color={sc.c} bg={sc.b}>
                {sc.l}
              </Badge>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                {data.keywords?.length || 0} keywords
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
              {data.url}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ textAlign: "right", marginRight: 12 }}>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>This week</div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  fontFamily: "'JetBrains Mono',monospace",
                }}
              >
                {latestClicks}
                <span
                  style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}
                >
                  {" "}
                  clicks
                </span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: clickChg >= 0 ? "#059669" : "#dc2626",
                }}
              >
                {clickChg >= 0 ? "+" : ""}
                {clickChg}%
              </div>
            </div>
            <Btn variant="secondary" size="sm" onClick={() => onEdit(data)}>
              Edit
            </Btn>
            <Btn
              variant="danger"
              size="sm"
              onClick={() => {
                if (confirm("Delete this article?")) onDelete(urlId);
              }}
            >
              Delete
            </Btn>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
          {[
            ["overview", "Overview"],
            ["weekly", "Keyword Breakdown"],
            ["alerts", `Alerts (${allAlerts.length})`],
            ["notes", "Change Log"],
          ].map(([k, l]) => (
            <Pill key={k} active={tab === k} onClick={() => setTab(k)}>
              {l}
            </Pill>
          ))}
        </div>
      </div>

      {tab === "overview" && (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <div
              className="flex items-center justify-between"
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: 16,
              }}
            >
              Position Trends
              <div className="shadow-sm border rounded-md p-1">
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  className="font-normal text-xs  capitalize "
                >
                  {["daily", "weekly", "monthly"].map((item) => (
                    <option value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
            <div
              className="relative -top-3"
              style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}
            >
              Lower is better — position 1 = top of Google
            </div>

            {graphData && <RankingChart chartData={graphData} />}
          </div>
        </div>
      )}

      {tab === "weekly" && (
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
                  "Keyword",
                  "Position",
                  "Prev",
                  "Change",
                  "Clicks",
                  "Impr",
                  "CTR",
                  "Features",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 12px",
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
            <tbody>
              {(data.keywords || [])
                .filter((k) => k.tracked)
                .map((kw, i) => {
                  const latest = kw.snapshots?.[0];
                  if (!latest) return null;
                  const pos = latest.serpPosition;
                  const prev = latest.prevPosition;
                  const chg = latest.posChange || 0;
                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: "1px solid #f8fafc",
                        background: i % 2 === 0 ? "#fff" : "#fafbfc",
                      }}
                    >
                      <td style={{ padding: "8px 12px", fontWeight: 600 }}>
                        {kw.keyword}
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          fontFamily: "'JetBrains Mono',monospace",
                          fontWeight: 700,
                          color:
                            pos && pos <= 3
                              ? "#059669"
                              : pos && pos <= 10
                                ? "#0f172a"
                                : "#dc2626",
                        }}
                      >
                        {pos ? `#${pos}` : "—"}
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          fontFamily: "'JetBrains Mono',monospace",
                          color: "#94a3b8",
                        }}
                      >
                        {prev ? `#${prev}` : "—"}
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          fontFamily: "'JetBrains Mono',monospace",
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
                          padding: "8px 12px",
                          fontFamily: "'JetBrains Mono',monospace",
                        }}
                      >
                        {latest.gscClicks}
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          fontFamily: "'JetBrains Mono',monospace",
                          color: "#94a3b8",
                        }}
                      >
                        {latest.gscImpressions?.toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          fontFamily: "'JetBrains Mono',monospace",
                        }}
                      >
                        {latest.gscCtr
                          ? (latest.gscCtr * 100).toFixed(1) + "%"
                          : "—"}
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          fontSize: 10,
                          color: "#94a3b8",
                        }}
                      >
                        {latest.serpFeatures || "—"}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "alerts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {allAlerts.length === 0 && (
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: 40,
                textAlign: "center",
                color: "#94a3b8",
                fontSize: 13,
              }}
            >
              No alerts for this article 👍
            </div>
          )}
          {allAlerts.map((a) => {
            const sv = sevCfg[a.severity] || sevCfg.warning;
            const st = stCfg[a.status] || stCfg.open;
            return (
              <div
                key={a.id}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: "16px 22px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  borderLeft: `4px solid ${sv.b}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: 15 }}>{sv.i}</span>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>
                    {a.keyword}
                  </span>
                  <Badge color={sv.c} bg={sv.b}>
                    {a.type}
                  </Badge>
                  <Badge color={st.c} bg={st.b}>
                    {st.l}
                  </Badge>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 11,
                      color: "#94a3b8",
                    }}
                  >
                    {new Date(a.alertDate).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
                  {a.details}
                </div>
                {a.action && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#334155",
                      marginTop: 6,
                      padding: "6px 10px",
                      background: "#f8fafc",
                      borderRadius: 6,
                    }}
                  >
                    📝 {a.action}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "notes" && (
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 22,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
            Change Log
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note..."
              onKeyDown={(e) => e.key === "Enter" && addNote()}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 8,
                border: "1.5px solid #e2e8f0",
                fontSize: 13,
                fontFamily: "inherit",
              }}
            />
            <Btn size="sm" onClick={addNote}>
              Add Note
            </Btn>
          </div>
          <div style={{ position: "relative", paddingLeft: 20 }}>
            <div
              style={{
                position: "absolute",
                left: 5,
                top: 4,
                bottom: 4,
                width: 2,
                background: "#e2e8f0",
              }}
            />
            {(data.notes || []).map((n, i) => (
              <div
                key={n.id || i}
                style={{
                  position: "relative",
                  paddingBottom: 18,
                  paddingLeft: 20,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: -3,
                    top: 5,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background:
                      i === 0
                        ? "#2563eb"
                        : n.text.includes("ALERT") || n.text.includes("🚨")
                          ? "#dc2626"
                          : n.text.includes("🎉")
                            ? "#059669"
                            : "#cbd5e1",
                    border: "2px solid #fff",
                  }}
                />
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#94a3b8",
                    fontFamily: "'JetBrains Mono',monospace",
                  }}
                >
                  {new Date(n.createdAt).toLocaleDateString()}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#334155",
                    marginTop: 3,
                    lineHeight: 1.5,
                  }}
                >
                  {n.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
