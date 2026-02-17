import { Loader } from "@/app/page";
import Badge from "@/component/badge";
import Btn from "@/component/btn";
import { DeleteIcon, EditIcon } from "@/component/icon";
import Loading from "@/component/loading";
import Pill from "@/component/pill";
import { api } from "@/lib/services";
import { sevCfg, statusCfg, stCfg } from "@/lib/utils";
import { useEffect, useState } from "react";
import SERPRankingChart from "./graph-rep";
import SERPDataTable from "./keywords-graph";

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
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState(null);
  const [viewMode, setViewMode] = useState("daily");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = (note) => {
    setEditingId(note.id);
    setEditingText(note.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  const saveEdit = async () => {
    if (!editingText.trim()) return;

    setSaving(true);

    await api(`/urls/${urlId}/notes/${editingId}`, {
      method: "PATCH",
      body: JSON.stringify({ text: editingText }),
    });

    const updated = await api(`/urls/${urlId}?period=${viewMode}`);
    setData(updated);

    setEditingId(null);
    setEditingText("");
    setSaving(false);
  };

  const fetchNotes = () => {
    setLoading(true);
    api(`/urls/${urlId}?period=${viewMode}`).then((d) => {
      setData(d);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchNotes();
  }, [urlId, viewMode]);

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
    setActionLoading(true);
    await api(`/urls/${urlId}/notes`, {
      method: "POST",
      body: JSON.stringify({ text: noteText.trim() }),
    });
    setActionLoading(false);
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

  const deleteNote = async (id) => {
    if (!id) return;
    setActionLoading(true);
    await api(`/urls/${urlId}/notes/${id}`, {
      method: "DELETE",
    });
    const updated = await api(`/urls/${urlId}`);
    setData(updated);
    setActionLoading(false);
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
        <div>
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
                  {["daily", "weekly"].map((item) => (
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

            {data ? (
              <SERPRankingChart viewMode={viewMode} data={data} />
            ) : (
              <p className="text-sm text-gray-400 text-center py-5 ">
                No result
              </p>
            )}
          </div>
        </div>
      )}

      {tab === "weekly" &&
        (data ? (
          <SERPDataTable data={data} timeRange={viewMode} />
        ) : (
          <p>Data Not Available</p>
        ))}

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
            <Btn size="sm" disabled={actionLoading} onClick={addNote}>
              Add Note
            </Btn>
          </div>
          {actionLoading && (
            <div className="w-full flex items-center justify-center">
              <Loader />
            </div>
          )}
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
                  className="flex items-start justify-between gap-3"
                  style={{
                    fontSize: 12,
                    color: "#334155",
                    marginTop: 3,
                    lineHeight: 1.5,
                  }}
                >
                  {editingId === n.id ? (
                    <div className="flex-1">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full border rounded-md p-2 text-sm outline-none focus:ring-[0.4px] focus:ring-blue-500"
                        rows={3}
                      />

                      <div className="flex gap-2 mt-2">
                        <Btn
                          onClick={saveEdit}
                          disabled={saving}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          {saving ? "Saving..." : "Save"}
                        </Btn>

                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 text-xs bg-gray-200 rounded-md hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">{n.text}</div>

                      <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition">
                        <button
                          disabled={loading}
                          onClick={() => startEdit(n)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          <EditIcon />
                        </button>

                        <button
                          disabled={loading}
                          onClick={() => deleteNote(n.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <DeleteIcon />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* <div
                  className="flex items-center justify-between"
                  style={{
                    fontSize: 12,
                    color: "#334155",
                    marginTop: 3,
                    lineHeight: 1.5,
                  }}
                >
                  {n.text}

                  <div>
                    <button
                      className="bg-none border-none outline-none"
                      disabled={loading}
                      onClick={() => deleteNote(n.id)}
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </div> */}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
