"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

// Dynamic import recharts to avoid SSR issues
const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart), {
  ssr: false,
});
const Line = dynamic(() => import("recharts").then((m) => m.Line), {
  ssr: false,
});
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), {
  ssr: false,
});
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), {
  ssr: false,
});
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), {
  ssr: false,
});
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false },
);
const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), {
  ssr: false,
});
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), {
  ssr: false,
});
const CartesianGrid = dynamic(
  () => import("recharts").then((m) => m.CartesianGrid),
  { ssr: false },
);

// ── API helpers ────────────────────────────────────────────
async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  return res.json();
}

// ── Shared config ──────────────────────────────────────────
const statusCfg = {
  active: { l: "Active", c: "#64748b", b: "#f1f5f9" },
  growing: { l: "Growing", c: "#059669", b: "#ecfdf5" },
  declining: { l: "Declining", c: "#dc2626", b: "#fef2f2" },
  recovering: { l: "Recovering", c: "#2563eb", b: "#eff6ff" },
};
const sevCfg = {
  critical: { l: "Critical", c: "#fff", b: "#dc2626", i: "🔴" },
  warning: { l: "Warning", c: "#92400e", b: "#fef3c7", i: "🟡" },
  positive: { l: "Positive", c: "#065f46", b: "#d1fae5", i: "🟢" },
};
const stCfg = {
  open: { l: "Open", c: "#dc2626", b: "#fef2f2" },
  in_progress: { l: "In Progress", c: "#2563eb", b: "#dbeafe" },
  planned: { l: "Planned", c: "#7c3aed", b: "#ede9fe" },
  on_hold: { l: "On Hold", c: "#64748b", b: "#f1f5f9" },
  monitoring: { l: "Monitoring", c: "#059669", b: "#ecfdf5" },
  resolved: { l: "Resolved", c: "#065f46", b: "#d1fae5" },
};

// ── UI Components ──────────────────────────────────────────
function Badge({ children, color, bg }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        color,
        background: bg,
        letterSpacing: 0.3,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}
function Pill({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 16px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        border: "none",
        cursor: "pointer",
        background: active ? "#0f172a" : "#f1f5f9",
        color: active ? "#fff" : "#64748b",
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function Btn({
  children,
  onClick,
  variant = "primary",
  size = "md",
  style: sx,
}) {
  const base = {
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontFamily: "inherit",
    borderRadius: 8,
    transition: "all 0.15s",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  };
  const v = {
    primary: {
      ...base,
      background: "#0f172a",
      color: "#fff",
      padding: size === "sm" ? "6px 14px" : "10px 20px",
      fontSize: size === "sm" ? 11 : 13,
    },
    secondary: {
      ...base,
      background: "#f1f5f9",
      color: "#334155",
      padding: size === "sm" ? "6px 14px" : "10px 20px",
      fontSize: size === "sm" ? 11 : 13,
    },
    danger: {
      ...base,
      background: "#fef2f2",
      color: "#dc2626",
      padding: size === "sm" ? "6px 14px" : "10px 20px",
      fontSize: size === "sm" ? 11 : 13,
    },
    ghost: {
      ...base,
      background: "transparent",
      color: "#64748b",
      padding: size === "sm" ? "4px 8px" : "6px 12px",
      fontSize: size === "sm" ? 11 : 12,
    },
  };
  return (
    <button onClick={onClick} style={{ ...v[variant], ...sx }}>
      {children}
    </button>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && (
        <label
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          border: "1.5px solid #e2e8f0",
          fontSize: 13,
          fontFamily: "inherit",
          outline: "none",
          background: "#fff",
        }}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && (
        <label
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          border: "1.5px solid #e2e8f0",
          fontSize: 13,
          fontFamily: "inherit",
          background: "#fff",
          cursor: "pointer",
        }}
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        background: "#f8fafc",
        borderRadius: 8,
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
          {label}
        </div>
        {desc && (
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
            {desc}
          </div>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          border: "none",
          cursor: "pointer",
          background: checked ? "#059669" : "#cbd5e1",
          position: "relative",
          transition: "background 0.2s",
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            background: "#fff",
            position: "absolute",
            top: 3,
            left: checked ? 23 : 3,
            transition: "left 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          }}
        />
      </button>
    </div>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          width: 620,
          maxWidth: "90vw",
          maxHeight: "85vh",
          overflow: "auto",
          boxShadow: "0 24px 48px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700 }}>{title}</span>
          <button
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: "pointer",
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
        color: "#94a3b8",
        fontSize: 14,
      }}
    >
      Loading...
    </div>
  );
}

// ── Article Modal ──────────────────────────────────────────
function ArticleModal({ open, onClose, onSave, article }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCat] = useState("Advertising");
  const [priority, setPri] = useState("medium");
  const [keywords, setKws] = useState([]);
  const [newKw, setNewKw] = useState("");
  const [newIntent, setNewIntent] = useState("commercial");

  useEffect(() => {
    if (article) {
      setUrl(article.url || "");
      setTitle(article.title || "");
      setCat(article.category || "Advertising");
      setPri(article.priority || "medium");
      setKws(article.keywords || []);
    } else {
      setUrl("");
      setTitle("");
      setCat("Advertising");
      setPri("medium");
      setKws([]);
      setNewKw("");
    }
  }, [article, open]);

  const addKw = () => {
    if (!newKw.trim()) return;
    setKws([
      ...keywords,
      {
        keyword: newKw.trim().toLowerCase(),
        source: "manual",
        intent: newIntent,
        tracked: true,
      },
    ]);
    setNewKw("");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={article ? "Edit Article" : "Add New Article"}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Input
          label="Article URL"
          value={url}
          onChange={setUrl}
          placeholder="https://blockchain-ads.com/blog/..."
        />
        <Input
          label="Title"
          value={title}
          onChange={setTitle}
          placeholder="e.g. Web3 Advertising Guide"
        />
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <Select
            label="Category"
            value={category}
            onChange={setCat}
            options={[
              { v: "Advertising", l: "Advertising" },
              { v: "Gaming", l: "Gaming" },
              { v: "Fintech", l: "Fintech" },
              { v: "Mobile Apps", l: "Mobile Apps" },
            ]}
          />
          <Select
            label="Priority"
            value={priority}
            onChange={setPri}
            options={[
              { v: "high", l: "High" },
              { v: "medium", l: "Medium" },
              { v: "low", l: "Low" },
              { v: "urgent", l: "🔴 Urgent" },
            ]}
          />
        </div>
        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
            Keywords ({keywords.length})
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              value={newKw}
              onChange={(e) => setNewKw(e.target.value)}
              placeholder="Add keyword..."
              onKeyDown={(e) => e.key === "Enter" && addKw()}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 8,
                border: "1.5px solid #e2e8f0",
                fontSize: 13,
                fontFamily: "inherit",
              }}
            />
            <select
              value={newIntent}
              onChange={(e) => setNewIntent(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1.5px solid #e2e8f0",
                fontSize: 12,
                background: "#fff",
              }}
            >
              <option value="commercial">Commercial</option>
              <option value="informational">Informational</option>
              <option value="transactional">Transactional</option>
            </select>
            <Btn onClick={addKw} size="sm">
              Add
            </Btn>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              maxHeight: 220,
              overflowY: "auto",
            }}
          >
            {keywords.map((k, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "#f8fafc",
                  border: "1px solid #f1f5f9",
                }}
              >
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: 500,
                    color: k.tracked ? "#0f172a" : "#94a3b8",
                  }}
                >
                  {k.keyword}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: k.source === "manual" ? "#f1f5f9" : "#eff6ff",
                    color: k.source === "manual" ? "#64748b" : "#2563eb",
                    fontWeight: 600,
                  }}
                >
                  {k.source === "manual" ? "Manual" : "GSC"}
                </span>
                <button
                  onClick={() =>
                    setKws(
                      keywords.map((x, j) =>
                        j === i ? { ...x, tracked: !x.tracked } : x,
                      ),
                    )
                  }
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 14,
                    color: k.tracked ? "#059669" : "#94a3b8",
                  }}
                >
                  {k.tracked ? "✓" : "○"}
                </button>
                <button
                  onClick={() => setKws(keywords.filter((_, j) => j !== i))}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    color: "#dc2626",
                    fontWeight: 700,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
            {keywords.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: 20,
                  color: "#94a3b8",
                  fontSize: 12,
                }}
              >
                No keywords yet.
              </div>
            )}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            borderTop: "1px solid #f1f5f9",
            paddingTop: 16,
          }}
        >
          <Btn variant="secondary" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            onClick={() => {
              onSave({ url, title, category, priority, keywords });
              onClose();
            }}
          >
            {article ? "Save Changes" : "Add Article"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── Dashboard View ─────────────────────────────────────────
function DashboardView({ urls, alerts, onSelectUrl, onAddArticle, loading }) {
  const totalKw = urls.reduce(
    (s, u) =>
      s +
      (u.stats?.activeKeywords ||
        u.keywords?.filter((k) => k.tracked).length ||
        0),
    0,
  );
  const crit = alerts.filter((a) => a.severity === "critical").length;
  const warn = alerts.filter((a) => a.severity === "warning").length;
  const pos = alerts.filter((a) => a.severity === "positive").length;

  const cards = [
    {
      l: "URLs Tracked",
      v: urls.length,
      s: `${totalKw} keywords total`,
      a: "#0f172a",
    },
    { l: "Critical Alerts", v: crit, s: "Need immediate action", a: "#dc2626" },
    { l: "Warnings", v: warn, s: "Monitor closely", a: "#f59e0b" },
    { l: "Positive Signals", v: pos, s: "Things going well", a: "#059669" },
  ];

  if (loading) return <Loading />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 14,
        }}
      >
        {cards.map((c, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "18px 22px",
              borderLeft: `4px solid ${c.a}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "#94a3b8",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {c.l}
            </div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: c.a,
                marginTop: 2,
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              {c.v}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
              {c.s}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            padding: "14px 22px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 14 }}>All Articles</span>
          <Btn onClick={onAddArticle} size="sm">
            + Add Article
          </Btn>
        </div>
        {urls.map((u) => {
          const sc = statusCfg[u.status] || statusCfg.active;
          const s = u.stats || {};
          return (
            <div
              key={u.id}
              onClick={() => onSelectUrl(u.id)}
              style={{
                padding: "14px 22px",
                borderBottom: "1px solid #f8fafc",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 14,
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f8fafc")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  background:
                    u.status === "declining"
                      ? "#dc2626"
                      : u.status === "growing"
                        ? "#059669"
                        : u.status === "recovering"
                          ? "#2563eb"
                          : "#94a3b8",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {u.title}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                  {u.category} · {s.activeKeywords || 0} keywords
                </div>
              </div>
              {s.avgPosition && (
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>
                      Avg Pos
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        fontFamily: "'JetBrains Mono',monospace",
                        color:
                          parseFloat(s.avgPosition) <= 5
                            ? "#059669"
                            : parseFloat(s.avgPosition) <= 10
                              ? "#0f172a"
                              : "#dc2626",
                      }}
                    >
                      {s.avgPosition}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>Clicks</div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >
                      {s.totalClicks?.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
              {s.openAlerts > 0 && (
                <span
                  style={{
                    background: "#fef2f2",
                    color: "#dc2626",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 10,
                  }}
                >
                  {s.openAlerts}
                </span>
              )}
              <Badge color={sc.c} bg={sc.b}>
                {sc.l}
              </Badge>
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                style={{ flexShrink: 0, color: "#cbd5e1" }}
              >
                <path
                  d="M6 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          );
        })}
        {urls.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              No articles tracked yet
            </div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              Click "Add Article" to start tracking your first URL
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── URL Detail View ────────────────────────────────────────
function URLDetailView({ urlId, onBack, onEdit, onDelete, onRefresh }) {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("overview");
  const [noteText, setNoteText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api(`/urls/${urlId}`).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [urlId]);

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

  return (
    <div>
      <Btn variant="ghost" onClick={onBack} style={{ marginBottom: 12 }}>
        ← Back to all URLs
      </Btn>
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
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 22,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
            All Keywords
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
              gap: 8,
            }}
          >
            {(data.keywords || []).map((k, i) => {
              const latest = k.snapshots?.[0];
              const prev = k.snapshots?.[1];
              const pos = latest?.serpPosition;
              const prevPos = prev?.serpPosition;
              const chg = pos && prevPos ? prevPos - pos : 0;
              return (
                <div
                  key={i}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #f1f5f9",
                    opacity: k.tracked ? 1 : 0.5,
                  }}
                >
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                      {k.keyword}
                    </span>
                    {pos && (
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 13,
                          fontWeight: 800,
                          color:
                            pos <= 3
                              ? "#059669"
                              : pos <= 10
                                ? "#0f172a"
                                : "#dc2626",
                        }}
                      >
                        #{pos}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      marginTop: 5,
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        padding: "1px 5px",
                        borderRadius: 3,
                        background:
                          k.source === "manual" ? "#f1f5f9" : "#eff6ff",
                        color: k.source === "manual" ? "#64748b" : "#2563eb",
                        fontWeight: 600,
                      }}
                    >
                      {k.source === "manual" ? "Manual" : "GSC"}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        padding: "1px 5px",
                        borderRadius: 3,
                        background: "#f8fafc",
                        color: "#64748b",
                      }}
                    >
                      {k.intent}
                    </span>
                    {chg !== 0 && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: chg > 0 ? "#059669" : "#dc2626",
                        }}
                      >
                        {chg > 0 ? "↑" : "↓"}
                        {Math.abs(chg)} wk
                      </span>
                    )}
                    {latest?.gscClicks > 0 && (
                      <span style={{ fontSize: 9, color: "#94a3b8" }}>
                        {latest.gscClicks} clicks
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
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

// ── Weekly Report (aggregated) ─────────────────────────────
function WeeklyReportView({ onSelectUrl }) {
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
            <tbody>
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

// ── Alerts Inbox ───────────────────────────────────────────
function AlertsView({ onSelectUrl }) {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/alerts").then((d) => {
      setAlerts(d);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading />;

  const filtered =
    filter === "all" ? alerts : alerts.filter((a) => a.severity === filter);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[
          ["all", "All"],
          ["critical", "Critical"],
          ["warning", "Warning"],
          ["positive", "Positive"],
        ].map(([k, l]) => (
          <Pill key={k} active={filter === k} onClick={() => setFilter(k)}>
            {l} (
            {k === "all"
              ? alerts.length
              : alerts.filter((a) => a.severity === k).length}
            )
          </Pill>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.length === 0 && (
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 40,
              textAlign: "center",
              color: "#94a3b8",
            }}
          >
            No alerts
          </div>
        )}
        {filtered.map((a) => {
          const sv = sevCfg[a.severity] || sevCfg.warning;
          const st = stCfg[a.status] || stCfg.open;
          const urlTitle = a.keyword?.trackedUrl?.title || "";
          const urlId = a.keyword?.trackedUrl?.id;
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
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{sv.i}</span>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>
                      {a.keyword?.keyword}
                    </span>
                    <Badge color={sv.c} bg={sv.b}>
                      {a.type}
                    </Badge>
                    <Badge color={st.c} bg={st.b}>
                      {st.l}
                    </Badge>
                  </div>
                  {urlId && (
                    <div
                      onClick={() => onSelectUrl(urlId)}
                      style={{
                        fontSize: 11,
                        color: "#2563eb",
                        marginTop: 5,
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                    >
                      {urlTitle}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 5 }}>
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
                <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>
                  {new Date(a.alertDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Config Page ────────────────────────────────────────────
function ConfigPage() {
  const [cfg, setCfg] = useState({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cronRunning, setCronRunning] = useState(false);
  const [cronResult, setCronResult] = useState(null);

  useEffect(() => {
    api("/config").then((d) => {
      setCfg(d);
      setLoading(false);
    });
  }, []);

  const u = (k, v) => {
    setCfg({ ...cfg, [k]: v });
    setSaved(false);
  };

  const save = async () => {
    await api("/config", { method: "PUT", body: JSON.stringify(cfg) });
    setSaved(true);
  };

  const runCron = async () => {
    setCronRunning(true);
    setCronResult(null);
    try {
      const result = await api("/cron", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": "your-random-secret-here",
        },
      });
      setCronResult(result);
    } catch (e) {
      setCronResult({ ok: false, error: e.message });
    }
    setCronRunning(false);
  };

  if (loading) return <Loading />;

  const Section = ({ title, desc, children }) => (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
        {title}
      </div>
      {desc && (
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14 }}>
          {desc}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {children}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 680 }}>
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          marginBottom: 16,
        }}
      >
        <Section
          title="🔗 Data Sources"
          desc="Connect your GSC and DataForSEO accounts"
        >
          <Input
            label="GSC Property URL"
            value={cfg.gscProperty || ""}
            onChange={(v) => u("gscProperty", v)}
            placeholder="https://your-site.com"
          />
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Select
              label="Country"
              value={cfg.dfsCountry || "us"}
              onChange={(v) => u("dfsCountry", v)}
              options={[
                { v: "us", l: "United States" },
                { v: "gb", l: "United Kingdom" },
                { v: "ng", l: "Nigeria" },
                { v: "de", l: "Germany" },
                { v: "ca", l: "Canada" },
              ]}
            />
            <Select
              label="Language"
              value={cfg.dfsLanguage || "en"}
              onChange={(v) => u("dfsLanguage", v)}
              options={[
                { v: "en", l: "English" },
                { v: "de", l: "German" },
                { v: "fr", l: "French" },
              ]}
            />
          </div>
          <div
            style={{
              padding: 12,
              background: "#eff6ff",
              borderRadius: 8,
              fontSize: 12,
              color: "#2563eb",
            }}
          >
            💡 <strong>API keys are set via environment variables</strong> on
            Railway, not here. This keeps them secure. Set:{" "}
            <code>GSC_CREDENTIALS</code>, <code>DATAFORSEO_LOGIN</code>,{" "}
            <code>DATAFORSEO_PASSWORD</code>, <code>TELEGRAM_BOT_TOKEN</code>,{" "}
            <code>TELEGRAM_CHAT_ID</code>
          </div>
        </Section>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          marginBottom: 16,
        }}
      >
        <Section title="⚡ Alert Thresholds">
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Input
              label="Position drop threshold"
              value={cfg.alertThreshold || "3"}
              onChange={(v) => u("alertThreshold", v)}
              type="number"
            />
            <Input
              label="Click drop % threshold"
              value={cfg.clickDropPct || "20"}
              onChange={(v) => u("clickDropPct", v)}
              type="number"
            />
          </div>
          <Toggle
            label="Page 1 exit alert"
            desc="Alert when any keyword falls off top 10"
            checked={cfg.page1Alert !== "false"}
            onChange={(v) => u("page1Alert", String(v))}
          />
        </Section>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          marginBottom: 16,
        }}
      >
        <Section
          title="🤖 Auto-Discovery"
          desc="Let the script auto-discover keywords from GSC"
        >
          <Toggle
            label="Auto-add GSC keywords"
            desc="Track new keywords that surface in GSC top queries"
            checked={cfg.autoAddGsc !== "false"}
            onChange={(v) => u("autoAddGsc", String(v))}
          />
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Input
              label="Min impressions to auto-add"
              value={cfg.autoAddMinImpr || "100"}
              onChange={(v) => u("autoAddMinImpr", v)}
              type="number"
            />
            <Input
              label="Max keywords per URL"
              value={cfg.maxKwPerUrl || "10"}
              onChange={(v) => u("maxKwPerUrl", v)}
              type="number"
            />
          </div>
        </Section>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          marginBottom: 16,
        }}
      >
        <Section title="🕐 Data Management">
          <Input
            label="Archive data after (weeks)"
            value={cfg.archiveWeeks || "13"}
            onChange={(v) => u("archiveWeeks", v)}
            type="number"
          />
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: -8 }}>
            Weekly snapshots older than this get deleted. Monthly aggregates are
            kept forever.
          </div>
        </Section>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          marginBottom: 16,
        }}
      >
        <Section title="🛠 Manual Actions">
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Btn
              onClick={runCron}
              variant={cronRunning ? "secondary" : "primary"}
            >
              {cronRunning ? "⏳ Running..." : "▶ Run Data Collection Now"}
            </Btn>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              Manually trigger the weekly cron job
            </span>
          </div>
          {cronResult && (
            <div
              style={{
                padding: 14,
                borderRadius: 8,
                background: cronResult.ok ? "#ecfdf5" : "#fef2f2",
                fontSize: 12,
              }}
            >
              {cronResult.ok ? (
                <>
                  <div style={{ fontWeight: 700, color: "#059669" }}>
                    ✅ Completed in {cronResult.duration}
                  </div>
                  <div style={{ color: "#065f46", marginTop: 4 }}>
                    Alerts: {cronResult.alerts?.critical || 0} critical,{" "}
                    {cronResult.alerts?.warning || 0} warnings,{" "}
                    {cronResult.alerts?.positive || 0} positive
                  </div>
                  {cronResult.log && (
                    <pre
                      style={{
                        marginTop: 8,
                        fontSize: 10,
                        color: "#64748b",
                        whiteSpace: "pre-wrap",
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >
                      {cronResult.log.join("\n")}
                    </pre>
                  )}
                </>
              ) : (
                <div style={{ color: "#dc2626", fontWeight: 600 }}>
                  ❌ Error: {cronResult.error}
                </div>
              )}
            </div>
          )}
        </Section>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Btn onClick={save}>Save Configuration</Btn>
        {saved && (
          <span style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>
            ✓ Saved
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────
export default function Page() {
  const [view, setView] = useState("dashboard");
  const [selUrl, setSelUrl] = useState(null);
  const [urls, setUrls] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editArticle, setEditArticle] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [u, a] = await Promise.all([api("/urls"), api("/alerts?limit=20")]);
    setUrls(u);
    setAlerts(a);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const nav = [
    { id: "dashboard", l: "Dashboard", i: "◉" },
    { id: "weekly", l: "Weekly Report", i: "◫" },
    {
      id: "alerts",
      l: "Alerts",
      i: "⚠",
      badge: alerts.filter((a) => a.severity === "critical").length,
    },
    { id: "config", l: "Settings", i: "⚙" },
  ];

  const goUrl = (id) => {
    setSelUrl(id);
    setView("url_detail");
  };
  const goBack = () => {
    setSelUrl(null);
    setView("dashboard");
    loadData();
  };

  const handleAdd = async (data) => {
    await api("/urls", { method: "POST", body: JSON.stringify(data) });
    loadData();
  };

  const handleEdit = async (data) => {
    await api(`/urls/${editArticle.id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    setEditArticle(null);
    loadData();
  };

  const handleDelete = async (id) => {
    await api(`/urls/${id}`, { method: "DELETE" });
    goBack();
  };

  const titles = {
    dashboard: "Dashboard",
    url_detail: "Article Detail",
    weekly: "Weekly Report",
    alerts: "Alerts Inbox",
    config: "Settings",
  };
  const subs = {
    dashboard: "Monday morning overview — scan for red, action what matters",
    weekly: "Aggregated article performance — click to expand keywords",
    alerts: "Unresolved alerts across all articles",
    config: "Environment variables, thresholds, and notifications",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      {/* Sidebar */}
      <div
        style={{
          width: 210,
          background: "#0f172a",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "22px 18px 18px" }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: -0.5,
            }}
          >
            Ranking Tracker
          </div>
          <div
            style={{
              fontSize: 9,
              color: "#475569",
              marginTop: 2,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            blockchain-ads.com
          </div>
        </div>
        <div style={{ padding: "0 10px", flex: 1 }}>
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                setView(n.id);
                setSelUrl(null);
                if (n.id === "dashboard") loadData();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "9px 12px",
                marginBottom: 2,
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                textAlign: "left",
                background:
                  view === n.id ||
                  (n.id === "dashboard" && view === "url_detail")
                    ? "#1e293b"
                    : "transparent",
                color:
                  view === n.id ||
                  (n.id === "dashboard" && view === "url_detail")
                    ? "#fff"
                    : "#64748b",
                transition: "all 0.12s",
              }}
            >
              <span style={{ fontSize: 13, width: 18, textAlign: "center" }}>
                {n.i}
              </span>
              {n.l}
              {n.badge > 0 && (
                <span
                  style={{
                    marginLeft: "auto",
                    background: "#dc2626",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: 10,
                  }}
                >
                  {n.badge}
                </span>
              )}
            </button>
          ))}
        </div>
        <div style={{ padding: "14px 18px", borderTop: "1px solid #1e293b" }}>
          <div style={{ fontSize: 9, color: "#475569", fontWeight: 600 }}>
            Deployed on Railway
          </div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>
            GSC + DataForSEO + Telegram
          </div>
        </div>
      </div>

      {/* Main */}
      <div
        style={{
          flex: 1,
          padding: "22px 28px",
          maxWidth: 1100,
          overflowY: "auto",
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: -0.5,
            }}
          >
            {titles[view]}
          </h1>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94a3b8" }}>
            {subs[view]}
          </p>
        </div>

        {view === "dashboard" && (
          <DashboardView
            urls={urls}
            alerts={alerts}
            onSelectUrl={goUrl}
            onAddArticle={() => setShowAddModal(true)}
            loading={loading}
          />
        )}
        {view === "url_detail" && selUrl && (
          <URLDetailView
            urlId={selUrl}
            onBack={goBack}
            onEdit={setEditArticle}
            onDelete={handleDelete}
            onRefresh={loadData}
          />
        )}
        {view === "weekly" && <WeeklyReportView onSelectUrl={goUrl} />}
        {view === "alerts" && <AlertsView onSelectUrl={goUrl} />}
        {view === "config" && <ConfigPage />}
      </div>

      <ArticleModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAdd}
        article={null}
      />
      <ArticleModal
        open={!!editArticle}
        onClose={() => setEditArticle(null)}
        onSave={handleEdit}
        article={editArticle}
      />
    </div>
  );
}
