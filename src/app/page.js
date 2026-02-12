"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

const Loader = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 50 50"
    xmlns="http://www.w3.org/2000/svg"
    className="animate-spin"
  >
    <circle
      cx="25"
      cy="25"
      r="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
      strokeDasharray="90 150"
      strokeDashoffset="0"
    />
  </svg>
);

// Dynamic import recharts to avoid SSR issues
const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart), {
  ssr: false,
});
const Line = dynamic(() => import("recharts").then((m) => m.Line), {
  ssr: false,
});
const Legend = dynamic(() => import("recharts").then((m) => m.Legend), {
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

  // Check if response is ok
  if (!res.ok) {
    // Try to get error message from JSON response
    try {
      const errorData = await res?.json();
      throw new Error(
        errorData.error ||
          errorData.message ||
          `HTTP ${res.status}: ${res.statusText}`,
      );
    } catch (e) {
      // If parsing JSON fails, throw generic error
      if (e.message.includes("Unexpected token")) {
        throw new Error(
          `Server error (${res.status}): The server returned an HTML error page instead of JSON. Check Railway logs for details.`,
        );
      }
      throw e;
    }
  }

  // Check content type
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `Expected JSON but got ${contentType}. Response: ${text.substring(0, 200)}`,
    );
  }

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
  const [category, setCat] = useState("");
  const [priority, setPri] = useState("medium");
  const [keywords, setKws] = useState([]);
  const [newKw, setNewKw] = useState("");
  const [newIntent, setNewIntent] = useState("commercial");
  const [categories, setCategories] = useState([]);

  const fetchCategories = async () => {
    api("/admin/categories").then((d) => {
      setCategories(d);
    });
  };

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
      setCat("");
      setPri("medium");
      setKws([]);
      setNewKw("");
    }
    if (open) {
      fetchCategories();
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
  const options = categories?.map((item) => ({ v: item.name, l: item.name }));

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
            options={options}
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

  const data = [
    {
      name: "Page A",
      uv: 4000,
      pv: 2400,
    },
    {
      name: "Page B",
      uv: 3000,
      pv: 1398,
    },
    {
      name: "Page C",
      uv: 2000,
      pv: 9800,
    },
    {
      name: "Page D",
      uv: 2780,
      pv: 3908,
    },
    {
      name: "Page E",
      uv: 1890,
      pv: 4800,
    },
    {
      name: "Page F",
      uv: 2390,
      pv: 3800,
    },
    {
      name: "Page G",
      uv: 3490,
      pv: 4300,
    },
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

      {/* <div
        style={{
          background: "#fff",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      > */}
      <BarChart
        style={{
          width: "100%",
          maxWidth: "700px",
          maxHeight: "70vh",
          aspectRatio: 1.618,
        }}
        responsive
        data={data}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis width="auto" />
        <Tooltip />
        <Legend />
        <Bar dataKey="pv" fill="#8884d8" isAnimationActive={true} />
        <Bar dataKey="uv" fill="#82ca9d" isAnimationActive={true} />
        {/* <RechartsDevtools /> */}
      </BarChart>
      {/* </div> */}
    </div>
  );
}

// ── URL Detail View ────────────────────────────────────────
function URLDetailView({ urlId, onBack, onEdit, onDelete, onRefresh }) {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("overview");
  const [noteText, setNoteText] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState(null);
  const [labels, setLabel] = useState();

  useEffect(() => {
    setLoading(true);
    api(`/urls/${urlId}`).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [urlId]);

  console.log(data);

  useEffect(() => {
    if (data) {
      const updt = data?.keywords?.map((item) => item.keyword);
      setLabel(updt);

      const updtIt = data?.keywords?.flatMap(
        (kw) =>
          kw?.snapshots?.map((snap) => ({
            month: snap?.serpPosition,
          })) || [],
      );

      console.log(updtIt);
    }
  }, [data]);

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
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: 16,
              }}
            >
              Position Trends (6 months)
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>
              Lower is better — position 1 = top of Google
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={[
                  {
                    name: "May",
                    exp: 4000,
                    rev: 1800,
                  },
                  {
                    name: "June",
                    exp: 6000,
                    rev: 2800,
                  },
                  {
                    name: "July",
                    exp: 2000,
                    rev: 2500,
                  },
                  {
                    name: "August",
                    exp: 2780,
                    rev: 3200,
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                />
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
                <Line type="monotone" dataKey="rev" stroke="#8884d8" />
                <Line type="monotone" dataKey="exp" stroke="#82ca9d" />
                {/* {Object.keys(monthlyData).map((kw, i) => (
                  <Line key={kw} type="monotone" dataKey={kw} stroke={colors[i%colors.length]} strokeWidth={2} dot={{ r:3 }} name={kw} />
                ))} */}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* <div style={{ background:"#fff", borderRadius:12, padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:16 }}>Weekly Clicks (Jan 2025)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize:10, fill:"#94a3b8" }} />
                <YAxis tick={{ fontSize:10, fill:"#94a3b8" }} />
                <Tooltip contentStyle={{ fontSize:12, borderRadius:8, border:"1px solid #e2e8f0" }} />
                {Object.keys(weeklyData).map((kw, i) => (
                  <Bar key={kw} dataKey={kw + "_clicks"} fill={colors[i%colors.length]} name={kw} radius={[2,2,0,0]} stackId="a" />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div> */}

          {/* <div style={{ background:"#fff", borderRadius:12, padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.06)", gridColumn:"1/-1" }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:16 }}>Keywords Tracked ({kws.length})</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:8 }}>
              {kws.map((k, i) => {
                const wk = weeklyData[k.keyword];
                const latestPos = wk ? wk[3].p : null;
                const prevPos = wk ? wk[2].p : null;
                const change = latestPos && prevPos ? prevPos - latestPos : 0;
                const mData = monthlyData[k.keyword];
                const firstPos = mData ? mData[0] : null;
                const lastPos = mData ? mData[mData.length-1] : null;
                const sixMonthChange = firstPos && lastPos ? firstPos - lastPos : null;
                return (
                  <div key={i} style={{ padding:"12px 16px", borderRadius:8, border:"1px solid #f1f5f9", background: !k.tracked ? "#fafafa" : "#fff" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:13, fontWeight:600, color: k.tracked ? "#0f172a" : "#94a3b8" }}>{k.keyword}</span>
                      {latestPos && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:800, color: latestPos <= 3 ? "#059669" : latestPos <= 10 ? "#0f172a" : "#dc2626" }}>#{latestPos}</span>}
                    </div>
                    <div style={{ display:"flex", gap:8, marginTop:6, alignItems:"center" }}>
                      <span style={{ fontSize:10, padding:"2px 6px", borderRadius:4, background: k.source==="manual"?"#f1f5f9":"#eff6ff", color: k.source==="manual"?"#64748b":"#2563eb", fontWeight:600 }}>{k.source==="manual"?"Manual":"GSC Auto"}</span>
                      <span style={{ fontSize:10, padding:"2px 6px", borderRadius:4, background:"#f8fafc", color:"#64748b", fontWeight:500 }}>{k.intent}</span>
                      {change !== 0 && <span style={{ fontSize:11, fontWeight:700, color: change > 0 ? "#059669" : "#dc2626" }}>{change > 0 ? "↑" : "↓"}{Math.abs(change)} this week</span>}
                      {sixMonthChange !== null && <span style={{ fontSize:10, color:"#94a3b8" }}>6mo: {sixMonthChange > 0 ? "+" : ""}{sixMonthChange.toFixed(1)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div> */}
        </div>
      )}

      {/* {tab === "overview" && (
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
      )} */}

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
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cronRunning, setCronRunning] = useState(false);
  const [cronResult, setCronResult] = useState(null);
  const [gscTesting, setGscTesting] = useState(false);
  const [gscTestResult, setGscTestResult] = useState(null);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState(null);
  const [listingSites, setListingSites] = useState(false);
  const [sitesResult, setSitesResult] = useState(null);
  const [useHistoricalSerp, setUseHistoricalSerp] = useState(true);
  const [dfsTesting, setDfsTesting] = useState(false);
  const [dfsTestResult, setDfsTestResult] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [clearResult, setClearResult] = useState(null);

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
    setSaving(true);
    setSaved(false);
    try {
      await api("/config", { method: "POST", body: JSON.stringify(cfg) });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000); // Hide after 3 seconds
    } catch (e) {
      alert(`Failed to save configuration: ${e.message}`);
      console.error("Save error:", e);
    } finally {
      setSaving(false);
    }
  };

  const runCron = async () => {
    setCronRunning(true);
    setCronResult(null);
    try {
      const result = await api("/admin/trigger-cron", {
        method: "POST",
      });
      setCronResult(result);
    } catch (e) {
      setCronResult({ ok: false, error: e.message });
    }
    setCronRunning(false);
  };

  const testGSC = async () => {
    setGscTesting(true);
    setGscTestResult(null);
    try {
      const result = await fetch("/api/test-gsc");
      const data = await result.json();
      setGscTestResult(data);
    } catch (e) {
      setGscTestResult({ success: false, errors: [e.message] });
    }
    setGscTesting(false);
  };

  const runBackfill = async (weeks = 4) => {
    setBackfilling(true);
    setBackfillResult(null);
    try {
      const result = await api("/admin/backfill", {
        method: "POST",
        body: JSON.stringify({
          weeksBack: weeks,
          useHistoricalSerp: useHistoricalSerp,
        }),
      });
      setBackfillResult(result);
    } catch (e) {
      setBackfillResult({ ok: false, error: e.message });
    }
    setBackfilling(false);
  };

  const testDFS = async () => {
    setDfsTesting(true);
    setDfsTestResult(null);
    try {
      // Use first keyword from first tracked URL, or a default
      const result = await api("/admin/test-dfs", {
        method: "POST",
        body: JSON.stringify({ keyword: "crypto affiliate programs" }),
      });
      setDfsTestResult(result);
    } catch (e) {
      setDfsTestResult({ ok: false, error: e.message });
    }
    setDfsTesting(false);
  };

  const clearSnapshots = async () => {
    if (
      !confirm(
        "This will delete ALL ranking snapshots and alerts. Are you sure?",
      )
    )
      return;
    setClearing(true);
    setClearResult(null);
    try {
      const result = await api("/admin/clear-snapshots", { method: "POST" });
      setClearResult(result);
    } catch (e) {
      setClearResult({ ok: false, error: e.message });
    }
    setClearing(false);
  };

  const listGSCSites = async () => {
    setListingSites(true);
    setSitesResult(null);
    try {
      const result = await fetch("/api/gsc/list-sites");
      const data = await result.json();
      setSitesResult(data);
    } catch (e) {
      setSitesResult({ success: false, error: e.message });
    }
    setListingSites(false);
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
          desc="DataForSEO for rankings (required) • GSC for traffic data (optional)"
        >
          <div>
            <Input
              label="Target Domain"
              value={cfg.targetDomain || ""}
              onChange={(v) => u("targetDomain", v)}
              placeholder="blockchain-ads.com"
            />
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: -8 }}>
            Your domain name without www or https — used to find your articles
            in SERP results
          </div>
          <div>
            <Input
              label="GSC Property URL (Optional - For Traffic Data)"
              value={cfg.gscProperty || ""}
              onChange={(v) => u("gscProperty", v)}
              placeholder="Leave empty if not using GSC"
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Btn
              onClick={listGSCSites}
              variant={listingSites ? "secondary" : "secondary"}
              size="sm"
            >
              {listingSites ? "⏳ Loading..." : "📋 List My GSC Sites"}
            </Btn>
            <Btn
              onClick={testGSC}
              variant={gscTesting ? "secondary" : "secondary"}
              size="sm"
            >
              {gscTesting ? "⏳ Testing..." : "🔍 Test GSC Connection"}
            </Btn>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              List available sites or test connection
            </span>
          </div>

          {sitesResult && (
            <div
              style={{
                padding: 14,
                borderRadius: 8,
                background: sitesResult.success ? "#ecfdf5" : "#fef2f2",
                fontSize: 12,
              }}
            >
              {sitesResult.success ? (
                <>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#059669",
                      marginBottom: 8,
                    }}
                  >
                    ✅ Found {sitesResult.count} GSC{" "}
                    {sitesResult.count === 1 ? "property" : "properties"}
                  </div>
                  {sitesResult.serviceAccountEmail && (
                    <div
                      style={{
                        color: "#065f46",
                        marginBottom: 8,
                        fontSize: 11,
                      }}
                    >
                      Service Account: {sitesResult.serviceAccountEmail}
                    </div>
                  )}
                  {sitesResult.sites && sitesResult.sites.length > 0 ? (
                    <>
                      <div
                        style={{
                          color: "#065f46",
                          marginBottom: 6,
                          fontWeight: 600,
                        }}
                      >
                        Available properties:
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        {sitesResult.sites.map((site, i) => (
                          <div
                            key={i}
                            style={{
                              padding: 10,
                              background: "#fff",
                              borderRadius: 6,
                              border: "1px solid #d1fae5",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontFamily: "'JetBrains Mono',monospace",
                                  fontSize: 11,
                                  color: "#059669",
                                  fontWeight: 600,
                                }}
                              >
                                {site.siteUrl}
                              </div>
                              <div
                                style={{
                                  fontSize: 10,
                                  color: "#94a3b8",
                                  marginTop: 2,
                                }}
                              >
                                Permission: {site.permissionLevel}
                              </div>
                            </div>
                            <Btn
                              size="sm"
                              onClick={() => {
                                u("gscProperty", site.siteUrl);
                                setSitesResult(null);
                              }}
                            >
                              Use This
                            </Btn>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ color: "#065f46", marginTop: 4 }}>
                      {sitesResult.hint}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#dc2626",
                      marginBottom: 6,
                    }}
                  >
                    ❌ {sitesResult.error || "Failed to list sites"}
                  </div>
                  {sitesResult.hint && (
                    <div
                      style={{ color: "#991b1b", marginTop: 4, fontSize: 11 }}
                    >
                      💡 {sitesResult.hint}
                    </div>
                  )}
                  {sitesResult.details && (
                    <div
                      style={{
                        color: "#991b1b",
                        marginTop: 6,
                        fontSize: 10,
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >
                      {sitesResult.details}
                    </div>
                  )}
                  {sitesResult.serviceAccountEmail && (
                    <div
                      style={{ color: "#991b1b", marginTop: 6, fontSize: 11 }}
                    >
                      Add this email to GSC: {sitesResult.serviceAccountEmail}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {gscTestResult && (
            <div
              style={{
                padding: 14,
                borderRadius: 8,
                background: gscTestResult.success ? "#ecfdf5" : "#fef2f2",
                fontSize: 12,
              }}
            >
              {gscTestResult.success ? (
                <>
                  <div style={{ fontWeight: 700, color: "#059669" }}>
                    ✅ GSC Connection Working!
                  </div>
                  {gscTestResult.info?.serviceAccountEmail && (
                    <div
                      style={{ color: "#065f46", marginTop: 4, fontSize: 11 }}
                    >
                      Service Account: {gscTestResult.info.serviceAccountEmail}
                    </div>
                  )}
                  {gscTestResult.info?.rowCount !== undefined && (
                    <div style={{ color: "#065f46", marginTop: 4 }}>
                      Retrieved {gscTestResult.info.rowCount} keywords from GSC
                    </div>
                  )}
                  {gscTestResult.info?.sampleKeywords &&
                    gscTestResult.info.sampleKeywords.length > 0 && (
                      <div
                        style={{ marginTop: 8, fontSize: 11, color: "#064e3b" }}
                      >
                        <strong>Sample keywords:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 18 }}>
                          {gscTestResult.info.sampleKeywords.map((kw, i) => (
                            <li key={i}>
                              {kw.keyword} - Pos: {kw.position}, Clicks:{" "}
                              {kw.clicks}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 700, color: "#dc2626" }}>
                    ❌ GSC Connection Failed
                  </div>
                  {gscTestResult.errors &&
                    gscTestResult.errors.map((err, i) => (
                      <div
                        key={i}
                        style={{ color: "#991b1b", marginTop: 4, fontSize: 11 }}
                      >
                        • {err}
                      </div>
                    ))}
                </>
              )}
            </div>
          )}

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
            Railway, not here. This keeps them secure.
            <br />
            <br />
            <strong>Required:</strong> <code>DATAFORSEO_LOGIN</code>,{" "}
            <code>DATAFORSEO_PASSWORD</code>
            <br />
            <strong>Optional:</strong> <code>GSC_CREDENTIALS</code> (only for
            traffic data), <code>TELEGRAM_BOT_TOKEN</code>,{" "}
            <code>TELEGRAM_CHAT_ID</code> (for alerts)
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
          title="🤖 Auto-Discovery (Optional - Requires GSC)"
          desc="Auto-discover keywords from GSC traffic data"
        >
          <div
            style={{
              padding: 10,
              background: "#fef3c7",
              borderRadius: 6,
              fontSize: 11,
              color: "#92400e",
              marginBottom: 10,
            }}
          >
            ⚠️ This feature requires GSC configuration. Manually add keywords if
            GSC not set up.
          </div>
          <Toggle
            label="Auto-add GSC keywords"
            desc="Track new keywords that surface in GSC top queries (needs GSC)"
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
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Btn
              onClick={testDFS}
              variant={dfsTesting ? "secondary" : "secondary"}
              size="sm"
            >
              {dfsTesting ? "⏳ Testing..." : "🔍 Test DataForSEO"}
            </Btn>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              Check if DataForSEO can find your domain in SERP results
            </span>
          </div>
          {dfsTestResult && (
            <div
              style={{
                padding: 14,
                borderRadius: 8,
                background: dfsTestResult.found ? "#ecfdf5" : "#fef2f2",
                fontSize: 12,
              }}
            >
              {dfsTestResult.found ? (
                <>
                  <div style={{ fontWeight: 700, color: "#059669" }}>
                    ✅ Found! Position #{dfsTestResult.position}
                  </div>
                  <div style={{ color: "#065f46", marginTop: 4, fontSize: 11 }}>
                    Keyword: {dfsTestResult.keyword}
                  </div>
                  <div style={{ color: "#065f46", marginTop: 2, fontSize: 11 }}>
                    Target Domain: {dfsTestResult.targetDomain}
                  </div>
                  <div style={{ color: "#065f46", marginTop: 2, fontSize: 11 }}>
                    Found URL: {dfsTestResult.foundUrl}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 700, color: "#dc2626" }}>
                    {dfsTestResult.ok
                      ? `❌ Domain "${dfsTestResult.targetDomain}" not found in top 100 for "${dfsTestResult.keyword}"`
                      : `❌ Error: ${dfsTestResult.error}`}
                  </div>
                  {dfsTestResult.ok && (
                    <div
                      style={{ color: "#991b1b", marginTop: 4, fontSize: 11 }}
                    >
                      Check that Target Domain in Data Sources matches your
                      actual domain.
                      <br />
                      Raw config: {dfsTestResult.rawDomain} → Cleaned:{" "}
                      {dfsTestResult.targetDomain}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div
            style={{
              borderTop: "1px solid #e2e8f0",
              marginTop: 12,
              paddingTop: 12,
            }}
          >
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

          <div
            style={{
              borderTop: "1px solid #e2e8f0",
              marginTop: 20,
              paddingTop: 20,
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={useHistoricalSerp}
                  onChange={(e) => setUseHistoricalSerp(e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
                <span
                  style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}
                >
                  Use DataForSEO Historical SERP (Real rankings from past weeks)
                </span>
              </label>
              <div
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  marginLeft: 28,
                  marginTop: 4,
                }}
              >
                ✅ Checked: Real SERP positions from past (costs DataForSEO
                credits)
                <br />❌ Unchecked: GSC average position (free but less
                accurate)
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Btn
                onClick={() => runBackfill(4)}
                variant={backfilling ? "secondary" : "secondary"}
              >
                {backfilling
                  ? "⏳ Backfilling..."
                  : "⏮ Backfill Historical Data"}
              </Btn>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                Pull last 4 weeks of{" "}
                {useHistoricalSerp ? "real SERP positions" : "GSC averages"}
              </span>
            </div>
            {backfillResult && (
              <div
                style={{
                  padding: 14,
                  borderRadius: 8,
                  background: backfillResult.ok ? "#ecfdf5" : "#fef2f2",
                  fontSize: 12,
                  marginTop: 12,
                }}
              >
                {backfillResult.ok ? (
                  <>
                    <div style={{ fontWeight: 700, color: "#059669" }}>
                      ✅ Backfill completed in {backfillResult.duration}
                    </div>
                    <div style={{ color: "#065f46", marginTop: 4 }}>
                      Created {backfillResult.snapshotsCreated} snapshots,
                      skipped {backfillResult.snapshotsSkipped} existing
                    </div>
                    <div style={{ color: "#065f46", marginTop: 2 }}>
                      Processed {backfillResult.weeksProcessed} weeks
                    </div>
                    {backfillResult.log && (
                      <pre
                        style={{
                          marginTop: 8,
                          fontSize: 10,
                          color: "#64748b",
                          whiteSpace: "pre-wrap",
                          fontFamily: "'JetBrains Mono',monospace",
                        }}
                      >
                        {backfillResult.log.join("\n")}
                      </pre>
                    )}
                  </>
                ) : (
                  <div style={{ color: "#dc2626", fontWeight: 600 }}>
                    ❌ Error: {backfillResult.error}
                  </div>
                )}
              </div>
            )}
          </div>
        </Section>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Btn onClick={save} variant={saving ? "secondary" : "primary"}>
          {saving ? "⏳ Saving..." : "💾 Save Configuration"}
        </Btn>
        {saved && (
          <span style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>
            ✅ Saved successfully!
          </span>
        )}
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          marginTop: 16,
          borderLeft: "4px solid #dc2626",
        }}
      >
        <Section title="⚠️ Danger Zone">
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Btn onClick={clearSnapshots} variant="danger" size="sm">
              {clearing ? "⏳ Clearing..." : "🗑 Clear All Ranking Data"}
            </Btn>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              Delete all snapshots and alerts, then re-run backfill
            </span>
          </div>
          {clearResult && (
            <div
              style={{
                padding: 10,
                borderRadius: 8,
                background: clearResult.ok ? "#ecfdf5" : "#fef2f2",
                fontSize: 12,
                marginTop: 8,
              }}
            >
              {clearResult.ok ? (
                <div style={{ color: "#059669" }}>
                  ✅ Cleared {clearResult.snapshotsDeleted} snapshots and{" "}
                  {clearResult.alertsDeleted} alerts. Ready for fresh backfill!
                </div>
              ) : (
                <div style={{ color: "#dc2626" }}>
                  ❌ Error: {clearResult.error}
                </div>
              )}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

const CategoriesAdmin = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [delLoading, setDelLoading] = useState(false);

  const fetchCategories = async () => {
    api("/admin/categories").then((d) => {
      setCategories(d);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const addCategory = async () => {
    if (!name.trim()) return;

    setLoading(true);
    await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    setName("");
    setLoading(false);
    fetchCategories();
  };

  const deleteCategory = async (id) => {
    setSelected(id);
    setDelLoading(true);
    await fetch(`/api/admin/categories/${id}`, {
      method: "DELETE",
    });
    setDelLoading(false);

    fetchCategories();
  };

  return (
    <div className="max-w-md space-y-4">
      <div className="flex gap-2">
        <input
          className="border px-3 py-2 flex-1"
          placeholder="New category"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          onClick={addCategory}
          disabled={loading}
          className={`${loading ? "disbled:bg-black/40" : "bg-black"}  text-white px-4`}
        >
          {loading ? "Please wait" : "Add"}
        </button>
      </div>

      <ul className="space-y-2">
        {categories.map((cat) => (
          <li
            key={cat.id}
            className="flex justify-between items-center rounded-lg shadow-sm border px-3 py-2"
          >
            <span>{cat.name}</span>
            <button
              onClick={() => deleteCategory(cat.id)}
              className="text-red-500"
            >
              {delLoading && selected === cat.id ? <Loader /> : "Delete"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

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
    { id: "categories", l: "All Categoies", i: "ø" },
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
    categories: "Categories",
  };
  const subs = {
    dashboard: "Monday morning overview — scan for red, action what matters",
    weekly: "Aggregated article performance — click to expand keywords",
    alerts: "Unresolved alerts across all articles",
    config: "Environment variables, thresholds, and notifications",
    categories: "Manage categories",
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
        {view === "categories" && <CategoriesAdmin />}
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

// import { useState, useMemo } from "react";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   AreaChart,
//   Area,
//   BarChart,
//   Bar,
//   CartesianGrid,
// } from "recharts";

// // ── Mock Data ──────────────────────────────────────────────
// const URLS_DATA = [
//   {
//     id: 1,
//     url: "https://blockchain-ads.com/blog/what-is-web3-advertising",
//     slug: "what-is-web3-advertising",
//     title: "What is Web3 Advertising",
//     category: "Advertising",
//     status: "active",
//     priority: "high",
//     dateAdded: "2024-06-15",
//     keywordCount: 6,
//     notes: [
//       {
//         date: "2025-01-28",
//         text: "Added 2025 stats, refreshed intro paragraph",
//       },
//       {
//         date: "2025-01-05",
//         text: "Noticed gradual decline #3→#8, investigating",
//       },
//       { date: "2024-11-10", text: "Added FAQ schema markup" },
//       { date: "2024-08-20", text: "Updated H1 + added 3 internal links" },
//       { date: "2024-06-15", text: "Published" },
//     ],
//   },
//   {
//     id: 2,
//     url: "https://blockchain-ads.com/blog/crypto-gaming-ads-guide",
//     slug: "crypto-gaming-ads-guide",
//     title: "Crypto Gaming Ads Guide",
//     category: "Gaming",
//     status: "active",
//     priority: "high",
//     dateAdded: "2024-07-01",
//     keywordCount: 5,
//     notes: [
//       { date: "2025-01-20", text: "Stable — no action needed" },
//       { date: "2024-12-01", text: "Refreshed stats section" },
//       { date: "2024-09-15", text: "Added video embed" },
//       { date: "2024-07-01", text: "Published" },
//     ],
//   },
//   {
//     id: 3,
//     url: "https://blockchain-ads.com/blog/telegram-advertising-crypto",
//     slug: "telegram-advertising-crypto",
//     title: "Telegram Advertising Crypto",
//     category: "Advertising",
//     status: "growing",
//     priority: "high",
//     dateAdded: "2024-09-20",
//     keywordCount: 5,
//     notes: [
//       { date: "2025-01-25", text: "Hit #2 for main keyword! 🎉" },
//       { date: "2025-01-10", text: "Trending — pushing more internal links" },
//       { date: "2024-11-01", text: "Added Telegram Mini Apps section" },
//       { date: "2024-09-20", text: "Published" },
//     ],
//   },
//   {
//     id: 4,
//     url: "https://blockchain-ads.com/blog/defi-marketing-guide",
//     slug: "defi-marketing-guide",
//     title: "DeFi Marketing Guide",
//     category: "Fintech",
//     status: "declining",
//     priority: "urgent",
//     dateAdded: "2024-10-05",
//     keywordCount: 5,
//     notes: [
//       {
//         date: "2025-01-28",
//         text: "Rewrite 60% done — adding yield comparison section",
//       },
//       { date: "2025-01-15", text: "Content refresh in progress" },
//       {
//         date: "2025-01-09",
//         text: "Competitor analysis done — they added comparison tables",
//       },
//       { date: "2025-01-08", text: "🚨 ALERT — dropped from #4→#12 in 2 weeks" },
//       { date: "2024-10-05", text: "Published" },
//     ],
//   },
//   {
//     id: 5,
//     url: "https://blockchain-ads.com/blog/programmatic-crypto-advertising",
//     slug: "programmatic-crypto-advertising",
//     title: "Programmatic Crypto Advertising",
//     category: "Advertising",
//     status: "recovering",
//     priority: "medium",
//     dateAdded: "2024-09-01",
//     keywordCount: 5,
//     notes: [
//       { date: "2025-01-20", text: "Recovery confirmed — #9→#4 since rewrite" },
//       { date: "2024-12-15", text: "Major rewrite — updated for 2025 trends" },
//       { date: "2024-09-01", text: "Published" },
//     ],
//   },
//   {
//     id: 6,
//     url: "https://blockchain-ads.com/blog/fintech-advertising-strategies",
//     slug: "fintech-advertising-strategies",
//     title: "Fintech Advertising Strategies",
//     category: "Fintech",
//     status: "active",
//     priority: "medium",
//     dateAdded: "2024-07-20",
//     keywordCount: 5,
//     notes: [
//       {
//         date: "2025-01-15",
//         text: "Competitor published similar piece — monitor",
//       },
//       { date: "2024-10-05", text: "Updated CTA section" },
//       { date: "2024-07-20", text: "Published" },
//     ],
//   },
//   {
//     id: 7,
//     url: "https://blockchain-ads.com/blog/nft-advertising-platforms",
//     slug: "nft-advertising-platforms",
//     title: "NFT Advertising Platforms",
//     category: "Advertising",
//     status: "declining",
//     priority: "low",
//     dateAdded: "2024-08-25",
//     keywordCount: 4,
//     notes: [
//       { date: "2025-01-20", text: "Deprioritized — NFT market cooling" },
//       { date: "2024-12-20", text: "Consider pivoting angle" },
//       { date: "2024-08-25", text: "Published" },
//     ],
//   },
//   {
//     id: 8,
//     url: "https://blockchain-ads.com/blog/mobile-app-advertising-blockchain",
//     slug: "mobile-app-advertising-blockchain",
//     title: "Mobile App Advertising Blockchain",
//     category: "Mobile Apps",
//     status: "active",
//     priority: "medium",
//     dateAdded: "2024-08-10",
//     keywordCount: 4,
//     notes: [
//       { date: "2025-01-10", text: "Holding steady around #6-7" },
//       { date: "2024-11-20", text: "Added comparison table" },
//       { date: "2024-08-10", text: "Published" },
//     ],
//   },
// ];

// const KEYWORDS_MAP = [
//   {
//     urlId: 1,
//     keyword: "web3 advertising",
//     source: "manual",
//     intent: "informational",
//     tracked: true,
//   },
//   {
//     urlId: 1,
//     keyword: "blockchain advertising",
//     source: "gsc",
//     intent: "informational",
//     tracked: true,
//   },
//   {
//     urlId: 1,
//     keyword: "web3 ads",
//     source: "gsc",
//     intent: "commercial",
//     tracked: true,
//   },
//   {
//     urlId: 1,
//     keyword: "crypto advertising platform",
//     source: "gsc",
//     intent: "commercial",
//     tracked: true,
//   },
//   {
//     urlId: 1,
//     keyword: "decentralized advertising",
//     source: "manual",
//     intent: "informational",
//     tracked: true,
//   },
//   {
//     urlId: 1,
//     keyword: "web3 digital marketing",
//     source: "gsc",
//     intent: "informational",
//     tracked: true,
//   },
//   {
//     urlId: 2,
//     keyword: "crypto gaming ads",
//     source: "manual",
//     intent: "commercial",
//     tracked: true,
//   },
//   {
//     urlId: 2,
//     keyword: "blockchain gaming marketing",
//     source: "manual",
//     intent: "informational",
//     tracked: true,
//   },
//   {
//     urlId: 2,
//     keyword: "web3 gaming advertising",
//     source: "gsc",
//     intent: "commercial",
//     tracked: true,
//   },
//   {
//     urlId: 2,
//     keyword: "play to earn advertising",
//     source: "gsc",
//     intent: "commercial",
//     tracked: true,
//   },
//   {
//     urlId: 2,
//     keyword: "gamefi marketing",
//     source: "gsc",
//     intent: "informational",
//     tracked: true,
//   },
//   {
//     urlId: 3,
//     keyword: "telegram advertising crypto",
//     source: "manual",
//     intent: "commercial",
//     tracked: true,
//   },
//   {
//     urlId: 3,
//     keyword: "telegram crypto ads",
//     source: "manual",
//     intent: "commercial",
//     tracked: true,
//   },
//   {
//     urlId: 3,
//     keyword: "telegram marketing crypto",
//     source: "gsc",
//     intent: "informational",
//     tracked: true,
//   },
//   {
//     urlId: 3,
//     keyword: "telegram mini apps advertising",
//     source: "gsc",
//     intent: "commercial",
//     tracked: true,
//   },
//   {
//     urlId: 3,
//     keyword: "crypto community advertising",
//     source: "gsc",
//     intent: "informational",
//     tracked: true,
//   },
//   {
//     urlId: 4,
//     keyword: "defi marketing",
//     source: "manual",
//     intent: "informational",
//     tracked: true,
//   },
//   {
//     urlId: 4,
//     keyword: "defi advertising",
//     source: "manual",
//     intent: "commercial",
//     tracked: true,
//   },
//   {
//     urlId: 4,
//     keyword: "decentralized finance marketing",
//     source: "gsc",
//     intent: "informational",
//     tracked: true,
//   },
//   {
//     urlId: 4,
//     keyword: "defi user acquisition",
//     source: "gsc",
//     intent: "commercial",
//     tracked: true,
//   },
//   {
//     urlId: 4,
//     keyword: "defi growth strategy",
//     source: "gsc",
//     intent: "informational",
//     tracked: true,
//   },
//   {
//     urlId: 5,
//     keyword: "programmatic crypto advertising",
//     source: "manual",
//     intent: "commercial",
//     tracked: true,
//   },
//   {
//     urlId: 5,
//     keyword: "crypto programmatic ads",
//     source: "manual",
//     intent: "commercial",
//     tracked: true,
//   },
//   {
//     urlId: 5,
//     keyword: "blockchain ad exchange",
//     source: "gsc",
//     intent: "commercial",
//     tracked: true,
//   },
//   {
//     urlId: 5,
//     keyword: "crypto dsp",
//     source: "gsc",
//     intent: "commercial",
//     tracked: true,
//   },
//   {
//     urlId: 5,
//     keyword: "web3 programmatic",
//     source: "gsc",
//     intent: "informational",
//     tracked: true,
//   },
//   {
//     urlId: 6,
//     keyword: "fintech advertising",
//     source: "manual",
//     intent: "commercial",
//     tracked: true,
//   },
//   {
//     urlId: 6,
//     keyword: "fintech marketing strategies",
//     source: "manual",
//     intent: "informational",
//     tracked: true,
//   },
//   {
//     urlId: 6,
//     keyword: "financial services ads",
//     source: "gsc",
//     intent: "commercial",
//     tracked: true,
//   },
//   {
//     urlId: 6,
//     keyword: "neobank advertising",
//     source: "gsc",
//     intent: "commercial",
//     tracked: true,
//   },
//   {
//     urlId: 6,
//     keyword: "fintech growth marketing",
//     source: "gsc",
//     intent: "informational",
//     tracked: true,
//   },
//   {
//     urlId: 7,
//     keyword: "nft advertising",
//     source: "manual",
//     intent: "commercial",
//     tracked: true,
//   },
//   {
//     urlId: 7,
//     keyword: "nft marketing platform",
//     source: "manual",
//     intent: "commercial",
//     tracked: true,
//   },
//   {
//     urlId: 7,
//     keyword: "nft promotion",
//     source: "gsc",
//     intent: "commercial",
//     tracked: true,
//   },
//   {
//     urlId: 7,
//     keyword: "nft drop marketing",
//     source: "gsc",
//     intent: "commercial",
//     tracked: false,
//   },
//   {
//     urlId: 8,
//     keyword: "blockchain mobile app ads",
//     source: "manual",
//     intent: "commercial",
//     tracked: true,
//   },
//   {
//     urlId: 8,
//     keyword: "crypto app advertising",
//     source: "manual",
//     intent: "commercial",
//     tracked: true,
//   },
//   {
//     urlId: 8,
//     keyword: "web3 app install ads",
//     source: "gsc",
//     intent: "commercial",
//     tracked: true,
//   },
//   {
//     urlId: 8,
//     keyword: "dapp advertising",
//     source: "gsc",
//     intent: "commercial",
//     tracked: true,
//   },
// ];

// const months = [
//   "Aug 2024",
//   "Sep 2024",
//   "Oct 2024",
//   "Nov 2024",
//   "Dec 2024",
//   "Jan 2025",
// ];
// const weeks = ["Jan 6", "Jan 13", "Jan 20", "Jan 27"];

// const MONTHLY_TRENDS = {
//   1: {
//     "web3 advertising": [2.4, 2.2, 2.8, 3.1, 3.5, 5.2],
//     "blockchain advertising": [4.8, 4.5, 5.2, 5.5, 6.0, 7.2],
//     "web3 ads": [4.0, 3.8, 4.5, 5.0, 5.5, 6.5],
//   },
//   2: {
//     "crypto gaming ads": [2.5, 2.3, 2.4, 2.6, 2.5, 2.8],
//     "blockchain gaming marketing": [4.8, 4.5, 4.8, 5.0, 4.8, 5.1],
//   },
//   3: {
//     "telegram advertising crypto": [7.2, 5.8, 4.5, 3.8, 3.2, 2.8],
//     "telegram mini apps advertising": [12.5, 11.0, 9.5, 8.2, 7.0, 6.2],
//     "telegram crypto ads": [8.5, 7.2, 5.8, 5.0, 4.2, 3.5],
//   },
//   4: {
//     "defi marketing": [3.0, 3.5, 3.8, 4.2, 5.8, 9.5],
//     "defi advertising": [5.5, 6.0, 6.5, 7.2, 9.5, 13.5],
//     "defi user acquisition": [4.8, 5.2, 5.5, 6.0, 8.0, 11.8],
//   },
//   5: {
//     "programmatic crypto advertising": [11.2, 10.5, 9.8, 9.2, 7.5, 5.2],
//     "crypto programmatic ads": [12.5, 11.8, 10.5, 9.8, 8.2, 5.5],
//     "blockchain ad exchange": [14.0, 13.2, 12.0, 11.0, 9.5, 6.8],
//   },
//   6: {
//     "fintech advertising": [5.8, 5.5, 6.0, 6.2, 6.5, 6.8],
//     "fintech marketing strategies": [7.2, 6.8, 7.5, 7.8, 8.0, 8.2],
//   },
//   7: {
//     "nft advertising": [6.5, 7.5, 8.8, 9.5, 11.8, 13.5],
//     "nft marketing platform": [7.8, 8.8, 9.5, 10.5, 12.2, 14.8],
//   },
//   8: {
//     "blockchain mobile app ads": [6.0, 6.2, 6.5, 6.5, 6.8, 6.5],
//     "crypto app advertising": [7.2, 7.5, 7.2, 7.5, 7.8, 7.5],
//   },
// };

// const WEEKLY_DATA = {
//   1: {
//     "web3 advertising": [
//       { p: 5, c: 145, i: 4200 },
//       { p: 6, c: 120, i: 4100 },
//       { p: 8, c: 85, i: 3900 },
//       { p: 8, c: 52, i: 3600 },
//     ],
//     "blockchain advertising": [
//       { p: 6, c: 89, i: 2800 },
//       { p: 6, c: 82, i: 2750 },
//       { p: 7, c: 68, i: 2600 },
//       { p: 8, c: 45, i: 2400 },
//     ],
//     "web3 ads": [
//       { p: 5, c: 95, i: 3100 },
//       { p: 5, c: 88, i: 3000 },
//       { p: 6, c: 72, i: 2900 },
//       { p: 7, c: 58, i: 2750 },
//     ],
//     "crypto advertising platform": [
//       { p: 8, c: 42, i: 1800 },
//       { p: 8, c: 38, i: 1750 },
//       { p: 9, c: 30, i: 1650 },
//       { p: 10, c: 20, i: 1500 },
//     ],
//     "decentralized advertising": [
//       { p: 7, c: 35, i: 1200 },
//       { p: 7, c: 30, i: 1150 },
//       { p: 8, c: 25, i: 1100 },
//       { p: 9, c: 18, i: 1000 },
//     ],
//     "web3 digital marketing": [
//       { p: 9, c: 28, i: 1500 },
//       { p: 8, c: 30, i: 1550 },
//       { p: 9, c: 25, i: 1400 },
//       { p: 10, c: 20, i: 1350 },
//     ],
//   },
//   3: {
//     "telegram advertising crypto": [
//       { p: 4, c: 160, i: 3800 },
//       { p: 3, c: 175, i: 3900 },
//       { p: 3, c: 190, i: 4100 },
//       { p: 2, c: 210, i: 4300 },
//     ],
//     "telegram crypto ads": [
//       { p: 5, c: 65, i: 1600 },
//       { p: 4, c: 72, i: 1700 },
//       { p: 4, c: 82, i: 1800 },
//       { p: 3, c: 90, i: 1900 },
//     ],
//     "telegram marketing crypto": [
//       { p: 6, c: 45, i: 1300 },
//       { p: 5, c: 52, i: 1400 },
//       { p: 5, c: 60, i: 1500 },
//       { p: 4, c: 65, i: 1550 },
//     ],
//     "telegram mini apps advertising": [
//       { p: 9, c: 18, i: 800 },
//       { p: 8, c: 25, i: 900 },
//       { p: 7, c: 32, i: 1000 },
//       { p: 6, c: 38, i: 1100 },
//     ],
//     "crypto community advertising": [
//       { p: 8, c: 22, i: 950 },
//       { p: 7, c: 28, i: 1000 },
//       { p: 7, c: 35, i: 1100 },
//       { p: 6, c: 40, i: 1150 },
//     ],
//   },
//   4: {
//     "defi marketing": [
//       { p: 4, c: 180, i: 5500 },
//       { p: 7, c: 110, i: 5200 },
//       { p: 10, c: 45, i: 4800 },
//       { p: 12, c: 22, i: 4500 },
//     ],
//     "defi advertising": [
//       { p: 6, c: 75, i: 2100 },
//       { p: 9, c: 40, i: 1900 },
//       { p: 12, c: 18, i: 1700 },
//       { p: 15, c: 8, i: 1500 },
//     ],
//     "decentralized finance marketing": [
//       { p: 7, c: 50, i: 1800 },
//       { p: 8, c: 32, i: 1600 },
//       { p: 11, c: 15, i: 1400 },
//       { p: 13, c: 6, i: 1200 },
//     ],
//     "defi user acquisition": [
//       { p: 5, c: 62, i: 1500 },
//       { p: 7, c: 35, i: 1350 },
//       { p: 10, c: 18, i: 1200 },
//       { p: 12, c: 8, i: 1050 },
//     ],
//     "defi growth strategy": [
//       { p: 7, c: 38, i: 1200 },
//       { p: 9, c: 25, i: 1100 },
//       { p: 11, c: 12, i: 950 },
//       { p: 14, c: 5, i: 850 },
//     ],
//   },
//   5: {
//     "programmatic crypto advertising": [
//       { p: 9, c: 30, i: 1200 },
//       { p: 7, c: 48, i: 1400 },
//       { p: 5, c: 65, i: 1600 },
//       { p: 4, c: 82, i: 1800 },
//     ],
//     "crypto programmatic ads": [
//       { p: 10, c: 20, i: 900 },
//       { p: 8, c: 32, i: 1050 },
//       { p: 6, c: 45, i: 1200 },
//       { p: 5, c: 55, i: 1350 },
//     ],
//     "blockchain ad exchange": [
//       { p: 12, c: 12, i: 700 },
//       { p: 10, c: 20, i: 850 },
//       { p: 8, c: 28, i: 1000 },
//       { p: 7, c: 38, i: 1150 },
//     ],
//     "crypto dsp": [
//       { p: 11, c: 8, i: 500 },
//       { p: 9, c: 14, i: 600 },
//       { p: 8, c: 22, i: 750 },
//       { p: 7, c: 30, i: 900 },
//     ],
//     "web3 programmatic": [
//       { p: 13, c: 5, i: 400 },
//       { p: 10, c: 10, i: 550 },
//       { p: 9, c: 18, i: 700 },
//       { p: 7, c: 25, i: 850 },
//     ],
//   },
// };

// const ALERTS = [
//   {
//     id: 1,
//     date: "2025-01-27",
//     urlId: 4,
//     keyword: "defi marketing",
//     type: "Position Drop",
//     severity: "critical",
//     details: "#4 → #12 in 4 weeks. Lost 158 clicks/week.",
//     action: "Content refresh in progress. Adding yield comparison.",
//     status: "in_progress",
//   },
//   {
//     id: 2,
//     date: "2025-01-27",
//     urlId: 4,
//     keyword: "defi advertising",
//     type: "Left Page 1",
//     severity: "critical",
//     details: "#6 → #15. Lost page 1 entirely.",
//     action: "Tied to defi marketing refresh.",
//     status: "in_progress",
//   },
//   {
//     id: 3,
//     date: "2025-01-27",
//     urlId: 4,
//     keyword: "defi user acquisition",
//     type: "Position Drop",
//     severity: "warning",
//     details: "#5 → #12. Same downward trend.",
//     action: "Will improve with main content refresh.",
//     status: "in_progress",
//   },
//   {
//     id: 4,
//     date: "2025-01-27",
//     urlId: 1,
//     keyword: "web3 advertising",
//     type: "Gradual Decline",
//     severity: "warning",
//     details: "#3 → #8 over 3 months. Still page 1.",
//     action: "Scheduled: update intro, add 2025 data.",
//     status: "planned",
//   },
//   {
//     id: 5,
//     date: "2025-01-27",
//     urlId: 1,
//     keyword: "crypto advertising platform",
//     type: "Page 1 Risk",
//     severity: "warning",
//     details: "Position 10 — one spot from page 2.",
//     action: "Add crypto ad platforms section.",
//     status: "planned",
//   },
//   {
//     id: 6,
//     date: "2025-01-20",
//     urlId: 7,
//     keyword: "nft advertising",
//     type: "Steady Decline",
//     severity: "warning",
//     details: "#8 → #14 over 4 months.",
//     action: "Deprioritized — reassess Q2.",
//     status: "on_hold",
//   },
//   {
//     id: 7,
//     date: "2025-01-13",
//     urlId: 5,
//     keyword: "programmatic crypto advertising",
//     type: "Recovery",
//     severity: "positive",
//     details: "#9 → #4 since Dec rewrite. +173% clicks.",
//     action: "Continue monitoring.",
//     status: "monitoring",
//   },
//   {
//     id: 8,
//     date: "2025-01-13",
//     urlId: 3,
//     keyword: "telegram advertising crypto",
//     type: "New Top 3",
//     severity: "positive",
//     details: "Hit #2. Clicks +330% since July.",
//     action: "Build topic cluster.",
//     status: "monitoring",
//   },
//   {
//     id: 9,
//     date: "2025-01-13",
//     urlId: 3,
//     keyword: "telegram mini apps advertising",
//     type: "Strong Climb",
//     severity: "positive",
//     details: "#18 → #6 in 5 months.",
//     action: "Consider dedicated article.",
//     status: "monitoring",
//   },
// ];

// // ── Helpers ─────────────────────────────────────────────────
// const statusConfig = {
//   active: { label: "Active", color: "#64748b", bg: "#f1f5f9" },
//   growing: { label: "Growing", color: "#059669", bg: "#ecfdf5" },
//   declining: { label: "Declining", color: "#dc2626", bg: "#fef2f2" },
//   recovering: { label: "Recovering", color: "#2563eb", bg: "#eff6ff" },
// };

// const severityConfig = {
//   critical: { label: "Critical", color: "#fff", bg: "#dc2626", icon: "🔴" },
//   warning: { label: "Warning", color: "#92400e", bg: "#fef3c7", icon: "🟡" },
//   positive: { label: "Positive", color: "#065f46", bg: "#d1fae5", icon: "🟢" },
// };

// const statusLabels = {
//   in_progress: { label: "In Progress", color: "#2563eb", bg: "#dbeafe" },
//   planned: { label: "Planned", color: "#7c3aed", bg: "#ede9fe" },
//   on_hold: { label: "On Hold", color: "#64748b", bg: "#f1f5f9" },
//   monitoring: { label: "Monitoring", color: "#059669", bg: "#ecfdf5" },
//   resolved: { label: "Resolved", color: "#065f46", bg: "#d1fae5" },
// };

// function Badge({ children, color, bg }) {
//   return (
//     <span
//       style={{
//         display: "inline-block",
//         padding: "3px 10px",
//         borderRadius: 20,
//         fontSize: 11,
//         fontWeight: 600,
//         color,
//         background: bg,
//         letterSpacing: 0.3,
//       }}
//     >
//       {children}
//     </span>
//   );
// }

// function Pill({ children, active, onClick }) {
//   return (
//     <button
//       onClick={onClick}
//       style={{
//         padding: "6px 16px",
//         borderRadius: 20,
//         fontSize: 12,
//         fontWeight: 600,
//         border: "none",
//         cursor: "pointer",
//         background: active ? "#0f172a" : "#f1f5f9",
//         color: active ? "#fff" : "#64748b",
//         transition: "all 0.2s",
//       }}
//     >
//       {children}
//     </button>
//   );
// }

// // ── Summary Cards ──────────────────────────────────────────
// function SummaryCards() {
//   const critAlerts = ALERTS.filter((a) => a.severity === "critical").length;
//   const warnAlerts = ALERTS.filter((a) => a.severity === "warning").length;
//   const posAlerts = ALERTS.filter((a) => a.severity === "positive").length;
//   const totalKw = KEYWORDS_MAP.filter((k) => k.tracked).length;

//   const cards = [
//     {
//       label: "URLs Tracked",
//       value: URLS_DATA.length,
//       sub: `${totalKw} keywords total`,
//       accent: "#0f172a",
//     },
//     {
//       label: "Critical Alerts",
//       value: critAlerts,
//       sub: "Need immediate action",
//       accent: "#dc2626",
//     },
//     {
//       label: "Warnings",
//       value: warnAlerts,
//       sub: "Monitor closely",
//       accent: "#f59e0b",
//     },
//     {
//       label: "Positive Signals",
//       value: posAlerts,
//       sub: "Things going well",
//       accent: "#059669",
//     },
//   ];

//   return (
//     <div
//       style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}
//     >
//       {cards.map((c, i) => (
//         <div
//           key={i}
//           style={{
//             background: "#fff",
//             borderRadius: 12,
//             padding: "20px 24px",
//             borderLeft: `4px solid ${c.accent}`,
//             boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
//           }}
//         >
//           <div
//             style={{
//               fontSize: 12,
//               color: "#94a3b8",
//               fontWeight: 600,
//               textTransform: "uppercase",
//               letterSpacing: 1,
//             }}
//           >
//             {c.label}
//           </div>
//           <div
//             style={{
//               fontSize: 32,
//               fontWeight: 800,
//               color: c.accent,
//               marginTop: 4,
//               fontFamily: "'JetBrains Mono',monospace",
//             }}
//           >
//             {c.value}
//           </div>
//           <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
//             {c.sub}
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }

// // ── URL List View ──────────────────────────────────────────
// function URLListView({ onSelectUrl }) {
//   return (
//     <div
//       style={{
//         background: "#fff",
//         borderRadius: 12,
//         overflow: "hidden",
//         boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
//       }}
//     >
//       <div
//         style={{
//           padding: "16px 24px",
//           borderBottom: "1px solid #f1f5f9",
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//         }}
//       >
//         <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
//           All URLs
//         </div>
//         <div style={{ fontSize: 12, color: "#94a3b8" }}>
//           {URLS_DATA.length} articles tracked
//         </div>
//       </div>
//       {URLS_DATA.map((u) => {
//         const sc = statusConfig[u.status];
//         const kwData = KEYWORDS_MAP.filter(
//           (k) => k.urlId === u.id && k.tracked,
//         );
//         const alerts = ALERTS.filter(
//           (a) =>
//             a.urlId === u.id &&
//             (a.severity === "critical" || a.severity === "warning"),
//         );
//         return (
//           <div
//             key={u.id}
//             onClick={() => onSelectUrl(u.id)}
//             style={{
//               padding: "16px 24px",
//               borderBottom: "1px solid #f8fafc",
//               cursor: "pointer",
//               display: "flex",
//               alignItems: "center",
//               gap: 16,
//               transition: "background 0.15s",
//             }}
//             onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
//             onMouseLeave={(e) =>
//               (e.currentTarget.style.background = "transparent")
//             }
//           >
//             <div
//               style={{
//                 width: 6,
//                 height: 6,
//                 borderRadius: 3,
//                 background:
//                   u.status === "declining"
//                     ? "#dc2626"
//                     : u.status === "growing"
//                       ? "#059669"
//                       : "#94a3b8",
//                 flexShrink: 0,
//               }}
//             />
//             <div style={{ flex: 1, minWidth: 0 }}>
//               <div
//                 style={{
//                   fontSize: 13,
//                   fontWeight: 600,
//                   color: "#0f172a",
//                   whiteSpace: "nowrap",
//                   overflow: "hidden",
//                   textOverflow: "ellipsis",
//                 }}
//               >
//                 {u.title}
//               </div>
//               <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
//                 {u.category} · {kwData.length} keywords
//               </div>
//             </div>
//             <div
//               style={{
//                 display: "flex",
//                 gap: 6,
//                 alignItems: "center",
//                 flexShrink: 0,
//               }}
//             >
//               {alerts.length > 0 && (
//                 <span
//                   style={{
//                     background: "#fef2f2",
//                     color: "#dc2626",
//                     fontSize: 10,
//                     fontWeight: 700,
//                     padding: "2px 8px",
//                     borderRadius: 10,
//                   }}
//                 >
//                   {alerts.length} alert{alerts.length > 1 ? "s" : ""}
//                 </span>
//               )}
//               <Badge color={sc.color} bg={sc.bg}>
//                 {sc.label}
//               </Badge>
//             </div>
//             <svg
//               width="16"
//               height="16"
//               viewBox="0 0 16 16"
//               fill="none"
//               style={{ flexShrink: 0, color: "#cbd5e1" }}
//             >
//               <path
//                 d="M6 4l4 4-4 4"
//                 stroke="currentColor"
//                 strokeWidth="2"
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//               />
//             </svg>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// // ── URL Detail View ────────────────────────────────────────
// function URLDetailView({ urlId, onBack }) {
//   const [tab, setTab] = useState("overview");
//   const u = URLS_DATA.find((x) => x.id === urlId);
//   const kws = KEYWORDS_MAP.filter((k) => k.urlId === urlId);
//   const alerts = ALERTS.filter((a) => a.urlId === urlId);
//   const monthlyData = MONTHLY_TRENDS[urlId] || {};
//   const weeklyData = WEEKLY_DATA[urlId] || {};
//   const sc = statusConfig[u.status];

//   const chartData = months.map((m, i) => {
//     const row = { month: m };
//     Object.entries(monthlyData).forEach(([kw, vals]) => {
//       row[kw] = vals[i];
//     });
//     return row;
//   });

//   console.log(chartData);

//   const weeklyChartData = weeks.map((w, i) => {
//     const row = { week: w, totalClicks: 0 };
//     Object.entries(weeklyData).forEach(([kw, vals]) => {
//       row[kw + "_pos"] = vals[i].p;
//       row[kw + "_clicks"] = vals[i].c;
//       row.totalClicks += vals[i].c;
//     });
//     return row;
//   });

//   console.log(weeklyChartData);

//   const colors = [
//     "#2563eb",
//     "#dc2626",
//     "#059669",
//     "#f59e0b",
//     "#8b5cf6",
//     "#ec4899",
//   ];

//   const latestWeekClicks = Object.entries(weeklyData).reduce(
//     (sum, [, vals]) => sum + vals[3].c,
//     0,
//   );
//   const prevWeekClicks = Object.entries(weeklyData).reduce(
//     (sum, [, vals]) => sum + vals[2].c,
//     0,
//   );
//   const clickChange = prevWeekClicks
//     ? Math.round(((latestWeekClicks - prevWeekClicks) / prevWeekClicks) * 100)
//     : 0;

//   return (
//     <div>
//       <button
//         onClick={onBack}
//         style={{
//           background: "none",
//           border: "none",
//           cursor: "pointer",
//           color: "#64748b",
//           fontSize: 13,
//           fontWeight: 600,
//           display: "flex",
//           alignItems: "center",
//           gap: 6,
//           padding: 0,
//           marginBottom: 16,
//         }}
//       >
//         <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
//           <path
//             d="M10 12L6 8l4-4"
//             stroke="currentColor"
//             strokeWidth="2"
//             strokeLinecap="round"
//             strokeLinejoin="round"
//           />
//         </svg>{" "}
//         Back to all URLs
//       </button>

//       <div
//         style={{
//           background: "#fff",
//           borderRadius: 12,
//           padding: 24,
//           boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
//           marginBottom: 16,
//         }}
//       >
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "flex-start",
//           }}
//         >
//           <div>
//             <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//               <h2
//                 style={{
//                   margin: 0,
//                   fontSize: 20,
//                   fontWeight: 800,
//                   color: "#0f172a",
//                 }}
//               >
//                 {u.title}
//               </h2>
//               <Badge color={sc.color} bg={sc.bg}>
//                 {sc.label}
//               </Badge>
//             </div>
//             <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
//               {u.url}
//             </div>
//           </div>
//           <div style={{ textAlign: "right" }}>
//             <div style={{ fontSize: 12, color: "#94a3b8" }}>
//               This week's clicks
//             </div>
//             <div
//               style={{
//                 fontSize: 28,
//                 fontWeight: 800,
//                 color: "#0f172a",
//                 fontFamily: "'JetBrains Mono',monospace",
//               }}
//             >
//               {latestWeekClicks.toLocaleString()}
//             </div>
//             <div
//               style={{
//                 fontSize: 12,
//                 fontWeight: 700,
//                 color: clickChange >= 0 ? "#059669" : "#dc2626",
//               }}
//             >
//               {clickChange >= 0 ? "+" : ""}
//               {clickChange}% vs last week
//             </div>
//           </div>
//         </div>

//         <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
//           {["overview", "weekly", "alerts", "notes"].map((t) => (
//             <Pill key={t} active={tab === t} onClick={() => setTab(t)}>
//               {t === "overview"
//                 ? "Position Trends"
//                 : t === "weekly"
//                   ? "Weekly Detail"
//                   : t === "alerts"
//                     ? `Alerts (${alerts.length})`
//                     : "Change Log"}
//             </Pill>
//           ))}
//         </div>
//       </div>

//       {tab === "overview" && (
//         <div
//           style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
//         >
//           <div
//             style={{
//               background: "#fff",
//               borderRadius: 12,
//               padding: 24,
//               boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
//             }}
//           >
//             <div
//               style={{
//                 fontSize: 14,
//                 fontWeight: 700,
//                 color: "#0f172a",
//                 marginBottom: 16,
//               }}
//             >
//               Position Trends (6 months)
//             </div>
//             <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>
//               Lower is better — position 1 = top of Google
//             </div>
//             <ResponsiveContainer width="100%" height={260}>
//               <LineChart data={chartData}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
//                 <XAxis
//                   dataKey="month"
//                   tick={{ fontSize: 10, fill: "#94a3b8" }}
//                 />
//                 <YAxis
//                   reversed
//                   domain={[1, "auto"]}
//                   tick={{ fontSize: 10, fill: "#94a3b8" }}
//                 />
//                 <Tooltip
//                   contentStyle={{
//                     fontSize: 12,
//                     borderRadius: 8,
//                     border: "1px solid #e2e8f0",
//                   }}
//                 />
//                 {Object.keys(monthlyData).map((kw, i) => (
//                   <Line
//                     key={kw}
//                     type="monotone"
//                     dataKey={kw}
//                     stroke={colors[i % colors.length]}
//                     strokeWidth={2}
//                     dot={{ r: 3 }}
//                     name={kw}
//                   />
//                 ))}
//               </LineChart>
//             </ResponsiveContainer>
//           </div>

//           <div
//             style={{
//               background: "#fff",
//               borderRadius: 12,
//               padding: 24,
//               boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
//             }}
//           >
//             <div
//               style={{
//                 fontSize: 14,
//                 fontWeight: 700,
//                 color: "#0f172a",
//                 marginBottom: 16,
//               }}
//             >
//               Weekly Clicks (Jan 2025)
//             </div>
//             <ResponsiveContainer width="100%" height={260}>
//               <BarChart data={weeklyChartData}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
//                 <XAxis
//                   dataKey="week"
//                   tick={{ fontSize: 10, fill: "#94a3b8" }}
//                 />
//                 <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
//                 <Tooltip
//                   contentStyle={{
//                     fontSize: 12,
//                     borderRadius: 8,
//                     border: "1px solid #e2e8f0",
//                   }}
//                 />
//                 {Object.keys(weeklyData).map((kw, i) => (
//                   <Bar
//                     key={kw}
//                     dataKey={kw + "_clicks"}
//                     fill={colors[i % colors.length]}
//                     name={kw}
//                     radius={[2, 2, 0, 0]}
//                     stackId="a"
//                   />
//                 ))}
//               </BarChart>
//             </ResponsiveContainer>
//           </div>

//           <div
//             style={{
//               background: "#fff",
//               borderRadius: 12,
//               padding: 24,
//               boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
//               gridColumn: "1/-1",
//             }}
//           >
//             <div
//               style={{
//                 fontSize: 14,
//                 fontWeight: 700,
//                 color: "#0f172a",
//                 marginBottom: 16,
//               }}
//             >
//               Keywords Tracked ({kws.length})
//             </div>
//             <div
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
//                 gap: 8,
//               }}
//             >
//               {kws.map((k, i) => {
//                 const wk = weeklyData[k.keyword];
//                 const latestPos = wk ? wk[3].p : null;
//                 const prevPos = wk ? wk[2].p : null;
//                 const change = latestPos && prevPos ? prevPos - latestPos : 0;
//                 const mData = monthlyData[k.keyword];
//                 const firstPos = mData ? mData[0] : null;
//                 const lastPos = mData ? mData[mData.length - 1] : null;
//                 const sixMonthChange =
//                   firstPos && lastPos ? firstPos - lastPos : null;
//                 return (
//                   <div
//                     key={i}
//                     style={{
//                       padding: "12px 16px",
//                       borderRadius: 8,
//                       border: "1px solid #f1f5f9",
//                       background: !k.tracked ? "#fafafa" : "#fff",
//                     }}
//                   >
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                         alignItems: "center",
//                       }}
//                     >
//                       <span
//                         style={{
//                           fontSize: 13,
//                           fontWeight: 600,
//                           color: k.tracked ? "#0f172a" : "#94a3b8",
//                         }}
//                       >
//                         {k.keyword}
//                       </span>
//                       {latestPos && (
//                         <span
//                           style={{
//                             fontFamily: "'JetBrains Mono',monospace",
//                             fontSize: 14,
//                             fontWeight: 800,
//                             color:
//                               latestPos <= 3
//                                 ? "#059669"
//                                 : latestPos <= 10
//                                   ? "#0f172a"
//                                   : "#dc2626",
//                           }}
//                         >
//                           #{latestPos}
//                         </span>
//                       )}
//                     </div>
//                     <div
//                       style={{
//                         display: "flex",
//                         gap: 8,
//                         marginTop: 6,
//                         alignItems: "center",
//                       }}
//                     >
//                       <span
//                         style={{
//                           fontSize: 10,
//                           padding: "2px 6px",
//                           borderRadius: 4,
//                           background:
//                             k.source === "manual" ? "#f1f5f9" : "#eff6ff",
//                           color: k.source === "manual" ? "#64748b" : "#2563eb",
//                           fontWeight: 600,
//                         }}
//                       >
//                         {k.source === "manual" ? "Manual" : "GSC Auto"}
//                       </span>
//                       <span
//                         style={{
//                           fontSize: 10,
//                           padding: "2px 6px",
//                           borderRadius: 4,
//                           background: "#f8fafc",
//                           color: "#64748b",
//                           fontWeight: 500,
//                         }}
//                       >
//                         {k.intent}
//                       </span>
//                       {change !== 0 && (
//                         <span
//                           style={{
//                             fontSize: 11,
//                             fontWeight: 700,
//                             color: change > 0 ? "#059669" : "#dc2626",
//                           }}
//                         >
//                           {change > 0 ? "↑" : "↓"}
//                           {Math.abs(change)} this week
//                         </span>
//                       )}
//                       {sixMonthChange !== null && (
//                         <span style={{ fontSize: 10, color: "#94a3b8" }}>
//                           6mo: {sixMonthChange > 0 ? "+" : ""}
//                           {sixMonthChange.toFixed(1)}
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         </div>
//       )}

//       {tab === "weekly" && (
//         <div
//           style={{
//             background: "#fff",
//             borderRadius: 12,
//             overflow: "hidden",
//             boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
//           }}
//         >
//           <div style={{ overflowX: "auto" }}>
//             <table
//               style={{
//                 width: "100%",
//                 borderCollapse: "collapse",
//                 fontSize: 12,
//               }}
//             >
//               <thead>
//                 <tr style={{ background: "#f8fafc" }}>
//                   {[
//                     "Week",
//                     "Keyword",
//                     "SERP Pos",
//                     "Prev",
//                     "Change",
//                     "Clicks",
//                     "Impressions",
//                     "CTR",
//                     "Page",
//                     "Alert",
//                   ].map((h) => (
//                     <th
//                       key={h}
//                       style={{
//                         padding: "12px 14px",
//                         textAlign: "left",
//                         fontWeight: 700,
//                         color: "#64748b",
//                         fontSize: 11,
//                         textTransform: "uppercase",
//                         letterSpacing: 0.5,
//                         borderBottom: "2px solid #e2e8f0",
//                       }}
//                     >
//                       {h}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {weeks.map((w, wi) =>
//                   Object.entries(weeklyData).map(([kw, vals], ki) => {
//                     const d = vals[wi];
//                     const prev = wi > 0 ? vals[wi - 1].p : d.p;
//                     const change = prev - d.p;
//                     const ctr =
//                       d.i > 0 ? ((d.c / d.i) * 100).toFixed(1) : "0.0";
//                     const page = Math.ceil(d.p / 10);
//                     let alert = "";
//                     if (wi > 0) {
//                       const drop = d.p - vals[wi - 1].p;
//                       if (vals[wi - 1].p <= 10 && d.p > 10)
//                         alert = "🔴 LEFT PAGE 1";
//                       else if (drop >= 3) alert = `🔴 -${drop} pos`;
//                       else if (drop >= 2) alert = `🟡 -${drop} pos`;
//                       else if (drop <= -3) alert = `🟢 +${Math.abs(drop)} pos`;
//                       else if (drop <= -2) alert = `🟢 +${Math.abs(drop)} pos`;
//                     }
//                     return (
//                       <tr
//                         key={`${wi}-${ki}`}
//                         style={{
//                           borderBottom: "1px solid #f8fafc",
//                           background: wi % 2 === 0 ? "#fff" : "#fafbfc",
//                         }}
//                       >
//                         <td
//                           style={{
//                             padding: "10px 14px",
//                             fontWeight: 600,
//                             color: "#0f172a",
//                           }}
//                         >
//                           {w}
//                         </td>
//                         <td
//                           style={{
//                             padding: "10px 14px",
//                             color: "#334155",
//                             fontWeight: 500,
//                           }}
//                         >
//                           {kw}
//                         </td>
//                         <td
//                           style={{
//                             padding: "10px 14px",
//                             fontFamily: "'JetBrains Mono',monospace",
//                             fontWeight: 700,
//                             color:
//                               d.p <= 3
//                                 ? "#059669"
//                                 : d.p <= 10
//                                   ? "#0f172a"
//                                   : "#dc2626",
//                           }}
//                         >
//                           #{d.p}
//                         </td>
//                         <td
//                           style={{
//                             padding: "10px 14px",
//                             fontFamily: "'JetBrains Mono',monospace",
//                             color: "#94a3b8",
//                           }}
//                         >
//                           #{prev}
//                         </td>
//                         <td
//                           style={{
//                             padding: "10px 14px",
//                             fontWeight: 700,
//                             fontFamily: "'JetBrains Mono',monospace",
//                             color:
//                               change > 0
//                                 ? "#059669"
//                                 : change < 0
//                                   ? "#dc2626"
//                                   : "#94a3b8",
//                           }}
//                         >
//                           {change > 0 ? "+" : ""}
//                           {change}
//                         </td>
//                         <td
//                           style={{
//                             padding: "10px 14px",
//                             fontFamily: "'JetBrains Mono',monospace",
//                           }}
//                         >
//                           {d.c}
//                         </td>
//                         <td
//                           style={{
//                             padding: "10px 14px",
//                             fontFamily: "'JetBrains Mono',monospace",
//                             color: "#94a3b8",
//                           }}
//                         >
//                           {d.i.toLocaleString()}
//                         </td>
//                         <td
//                           style={{
//                             padding: "10px 14px",
//                             fontFamily: "'JetBrains Mono',monospace",
//                           }}
//                         >
//                           {ctr}%
//                         </td>
//                         <td style={{ padding: "10px 14px" }}>{page}</td>
//                         <td
//                           style={{
//                             padding: "10px 14px",
//                             fontSize: 11,
//                             fontWeight: 600,
//                             color: alert.includes("🔴")
//                               ? "#dc2626"
//                               : alert.includes("🟡")
//                                 ? "#d97706"
//                                 : alert.includes("🟢")
//                                   ? "#059669"
//                                   : "#94a3b8",
//                           }}
//                         >
//                           {alert || "—"}
//                         </td>
//                       </tr>
//                     );
//                   }),
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}

//       {tab === "alerts" && (
//         <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
//           {alerts.length === 0 && (
//             <div
//               style={{
//                 background: "#fff",
//                 borderRadius: 12,
//                 padding: 40,
//                 textAlign: "center",
//                 color: "#94a3b8",
//               }}
//             >
//               No alerts for this URL
//             </div>
//           )}
//           {alerts.map((a) => {
//             const sev = severityConfig[a.severity];
//             const st = statusLabels[a.status];
//             return (
//               <div
//                 key={a.id}
//                 style={{
//                   background: "#fff",
//                   borderRadius: 12,
//                   padding: "18px 24px",
//                   boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
//                   borderLeft: `4px solid ${sev.bg}`,
//                   display: "flex",
//                   gap: 16,
//                   alignItems: "flex-start",
//                 }}
//               >
//                 <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>
//                   {sev.icon}
//                 </span>
//                 <div style={{ flex: 1 }}>
//                   <div
//                     style={{
//                       display: "flex",
//                       gap: 8,
//                       alignItems: "center",
//                       flexWrap: "wrap",
//                     }}
//                   >
//                     <span
//                       style={{
//                         fontWeight: 700,
//                         fontSize: 13,
//                         color: "#0f172a",
//                       }}
//                     >
//                       {a.keyword}
//                     </span>
//                     <Badge color={sev.color} bg={sev.bg}>
//                       {a.type}
//                     </Badge>
//                     <Badge color={st.color} bg={st.bg}>
//                       {st.label}
//                     </Badge>
//                   </div>
//                   <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
//                     {a.details}
//                   </div>
//                   {a.action && (
//                     <div
//                       style={{
//                         fontSize: 12,
//                         color: "#334155",
//                         marginTop: 6,
//                         padding: "8px 12px",
//                         background: "#f8fafc",
//                         borderRadius: 6,
//                       }}
//                     >
//                       📝 {a.action}
//                     </div>
//                   )}
//                 </div>
//                 <div style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>
//                   {a.date}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}

//       {tab === "notes" && (
//         <div
//           style={{
//             background: "#fff",
//             borderRadius: 12,
//             padding: 24,
//             boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
//           }}
//         >
//           <div
//             style={{
//               fontSize: 14,
//               fontWeight: 700,
//               color: "#0f172a",
//               marginBottom: 16,
//             }}
//           >
//             Change Log
//           </div>
//           <div style={{ position: "relative", paddingLeft: 20 }}>
//             <div
//               style={{
//                 position: "absolute",
//                 left: 5,
//                 top: 4,
//                 bottom: 4,
//                 width: 2,
//                 background: "#e2e8f0",
//               }}
//             />
//             {u.notes.map((n, i) => (
//               <div
//                 key={i}
//                 style={{
//                   position: "relative",
//                   paddingBottom: 20,
//                   paddingLeft: 20,
//                 }}
//               >
//                 <div
//                   style={{
//                     position: "absolute",
//                     left: -3,
//                     top: 6,
//                     width: 8,
//                     height: 8,
//                     borderRadius: 4,
//                     background:
//                       i === 0
//                         ? "#2563eb"
//                         : n.text.includes("ALERT") || n.text.includes("🚨")
//                           ? "#dc2626"
//                           : n.text.includes("🎉")
//                             ? "#059669"
//                             : "#cbd5e1",
//                     border: "2px solid #fff",
//                   }}
//                 />
//                 <div
//                   style={{
//                     fontSize: 11,
//                     fontWeight: 700,
//                     color: "#94a3b8",
//                     fontFamily: "'JetBrains Mono',monospace",
//                   }}
//                 >
//                   {n.date}
//                 </div>
//                 <div
//                   style={{
//                     fontSize: 13,
//                     color: "#334155",
//                     marginTop: 4,
//                     lineHeight: 1.5,
//                   }}
//                 >
//                   {n.text}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // ── Alerts Inbox View ──────────────────────────────────────
// function AlertsView({ onSelectUrl }) {
//   const [filter, setFilter] = useState("all");
//   const filtered =
//     filter === "all" ? ALERTS : ALERTS.filter((a) => a.severity === filter);

//   return (
//     <div>
//       <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
//         {[
//           ["all", "All"],
//           ["critical", "Critical"],
//           ["warning", "Warning"],
//           ["positive", "Positive"],
//         ].map(([k, l]) => (
//           <Pill key={k} active={filter === k} onClick={() => setFilter(k)}>
//             {l} (
//             {k === "all"
//               ? ALERTS.length
//               : ALERTS.filter((a) => a.severity === k).length}
//             )
//           </Pill>
//         ))}
//       </div>
//       <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
//         {filtered.map((a) => {
//           const sev = severityConfig[a.severity];
//           const st = statusLabels[a.status];
//           const u = URLS_DATA.find((x) => x.id === a.urlId);
//           return (
//             <div
//               key={a.id}
//               style={{
//                 background: "#fff",
//                 borderRadius: 12,
//                 padding: "18px 24px",
//                 boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
//                 borderLeft: `4px solid ${sev.bg}`,
//               }}
//             >
//               <div
//                 style={{
//                   display: "flex",
//                   justifyContent: "space-between",
//                   alignItems: "flex-start",
//                 }}
//               >
//                 <div>
//                   <div
//                     style={{
//                       display: "flex",
//                       gap: 8,
//                       alignItems: "center",
//                       flexWrap: "wrap",
//                     }}
//                   >
//                     <span style={{ fontSize: 16 }}>{sev.icon}</span>
//                     <span
//                       style={{
//                         fontWeight: 700,
//                         fontSize: 13,
//                         color: "#0f172a",
//                       }}
//                     >
//                       {a.keyword}
//                     </span>
//                     <Badge color={sev.color} bg={sev.bg}>
//                       {a.type}
//                     </Badge>
//                     <Badge color={st.color} bg={st.bg}>
//                       {st.label}
//                     </Badge>
//                   </div>
//                   <div
//                     onClick={() => onSelectUrl(a.urlId)}
//                     style={{
//                       fontSize: 11,
//                       color: "#2563eb",
//                       marginTop: 6,
//                       cursor: "pointer",
//                       fontWeight: 500,
//                     }}
//                   >
//                     {u?.title}
//                   </div>
//                   <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
//                     {a.details}
//                   </div>
//                   {a.action && (
//                     <div
//                       style={{
//                         fontSize: 12,
//                         color: "#334155",
//                         marginTop: 8,
//                         padding: "8px 12px",
//                         background: "#f8fafc",
//                         borderRadius: 6,
//                       }}
//                     >
//                       📝 {a.action}
//                     </div>
//                   )}
//                 </div>
//                 <div style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>
//                   {a.date}
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// // ── Weekly Report View ─────────────────────────────────────
// function WeeklyReportView({ onSelectUrl }) {
//   const [selectedWeek, setSelectedWeek] = useState(3);

//   const rows = [];
//   Object.entries(WEEKLY_DATA).forEach(([urlIdStr, kwData]) => {
//     const urlId = parseInt(urlIdStr);
//     const u = URLS_DATA.find((x) => x.id === urlId);
//     Object.entries(kwData).forEach(([kw, vals]) => {
//       const d = vals[selectedWeek];
//       const prev = selectedWeek > 0 ? vals[selectedWeek - 1].p : d.p;
//       const change = prev - d.p;
//       rows.push({
//         urlId,
//         url: u.title,
//         keyword: kw,
//         pos: d.p,
//         prev,
//         change,
//         clicks: d.c,
//         impr: d.i,
//         ctr: d.i > 0 ? (d.c / d.i) * 100 : 0,
//       });
//     });
//   });

//   rows.sort((a, b) =>
//     b.change === a.change ? a.pos - b.pos : a.change - b.change,
//   );

//   return (
//     <div>
//       <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
//         {weeks.map((w, i) => (
//           <Pill
//             key={i}
//             active={selectedWeek === i}
//             onClick={() => setSelectedWeek(i)}
//           >
//             Week of {w}
//           </Pill>
//         ))}
//       </div>
//       <div
//         style={{
//           background: "#fff",
//           borderRadius: 12,
//           overflow: "hidden",
//           boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
//         }}
//       >
//         <div style={{ overflowX: "auto" }}>
//           <table
//             style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
//           >
//             <thead>
//               <tr style={{ background: "#f8fafc" }}>
//                 {[
//                   "Article",
//                   "Keyword",
//                   "Position",
//                   "Change",
//                   "Clicks",
//                   "Impressions",
//                   "CTR",
//                   "Alert",
//                 ].map((h) => (
//                   <th
//                     key={h}
//                     style={{
//                       padding: "12px 14px",
//                       textAlign: "left",
//                       fontWeight: 700,
//                       color: "#64748b",
//                       fontSize: 11,
//                       textTransform: "uppercase",
//                       letterSpacing: 0.5,
//                       borderBottom: "2px solid #e2e8f0",
//                     }}
//                   >
//                     {h}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {rows.map((r, i) => {
//                 let alert = "";
//                 if (selectedWeek > 0) {
//                   if (r.prev <= 10 && r.pos > 10) alert = "🔴 LEFT PAGE 1";
//                   else if (r.change <= -3)
//                     alert = `🔴 Dropped ${Math.abs(r.change)}`;
//                   else if (r.change <= -2) alert = `🟡 Slipping`;
//                   else if (r.change >= 3) alert = `🟢 +${r.change} pos`;
//                   else if (r.change >= 2) alert = `🟢 Climbing`;
//                 }
//                 return (
//                   <tr
//                     key={i}
//                     style={{
//                       borderBottom: "1px solid #f8fafc",
//                       background: i % 2 === 0 ? "#fff" : "#fafbfc",
//                     }}
//                   >
//                     <td
//                       style={{
//                         padding: "10px 14px",
//                         cursor: "pointer",
//                         color: "#2563eb",
//                         fontWeight: 500,
//                       }}
//                       onClick={() => onSelectUrl(r.urlId)}
//                     >
//                       {r.url}
//                     </td>
//                     <td
//                       style={{
//                         padding: "10px 14px",
//                         fontWeight: 600,
//                         color: "#334155",
//                       }}
//                     >
//                       {r.keyword}
//                     </td>
//                     <td
//                       style={{
//                         padding: "10px 14px",
//                         fontFamily: "'JetBrains Mono',monospace",
//                         fontWeight: 700,
//                         color:
//                           r.pos <= 3
//                             ? "#059669"
//                             : r.pos <= 10
//                               ? "#0f172a"
//                               : "#dc2626",
//                       }}
//                     >
//                       #{r.pos}
//                     </td>
//                     <td
//                       style={{
//                         padding: "10px 14px",
//                         fontFamily: "'JetBrains Mono',monospace",
//                         fontWeight: 700,
//                         color:
//                           r.change > 0
//                             ? "#059669"
//                             : r.change < 0
//                               ? "#dc2626"
//                               : "#94a3b8",
//                       }}
//                     >
//                       {r.change > 0 ? "↑" : r.change < 0 ? "↓" : "→"}
//                       {Math.abs(r.change)}
//                     </td>
//                     <td
//                       style={{
//                         padding: "10px 14px",
//                         fontFamily: "'JetBrains Mono',monospace",
//                       }}
//                     >
//                       {r.clicks}
//                     </td>
//                     <td
//                       style={{
//                         padding: "10px 14px",
//                         fontFamily: "'JetBrains Mono',monospace",
//                         color: "#94a3b8",
//                       }}
//                     >
//                       {r.impr.toLocaleString()}
//                     </td>
//                     <td
//                       style={{
//                         padding: "10px 14px",
//                         fontFamily: "'JetBrains Mono',monospace",
//                       }}
//                     >
//                       {r.ctr.toFixed(1)}%
//                     </td>
//                     <td
//                       style={{
//                         padding: "10px 14px",
//                         fontSize: 11,
//                         fontWeight: 600,
//                         color: alert.includes("🔴")
//                           ? "#dc2626"
//                           : alert.includes("🟡")
//                             ? "#d97706"
//                             : alert.includes("🟢")
//                               ? "#059669"
//                               : "#94a3b8",
//                       }}
//                     >
//                       {alert || "—"}
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ── Keywords Management View ───────────────────────────────
// function KeywordsView() {
//   const [filterUrl, setFilterUrl] = useState("all");
//   const filtered =
//     filterUrl === "all"
//       ? KEYWORDS_MAP
//       : KEYWORDS_MAP.filter((k) => k.urlId === parseInt(filterUrl));

//   return (
//     <div>
//       <div
//         style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}
//       >
//         <Pill active={filterUrl === "all"} onClick={() => setFilterUrl("all")}>
//           All ({KEYWORDS_MAP.length})
//         </Pill>
//         {URLS_DATA.map((u) => {
//           const count = KEYWORDS_MAP.filter((k) => k.urlId === u.id).length;
//           return (
//             <Pill
//               key={u.id}
//               active={filterUrl === String(u.id)}
//               onClick={() => setFilterUrl(String(u.id))}
//             >
//               {u.title.split(" ").slice(0, 3).join(" ")}... ({count})
//             </Pill>
//           );
//         })}
//       </div>
//       <div
//         style={{
//           background: "#fff",
//           borderRadius: 12,
//           overflow: "hidden",
//           boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
//         }}
//       >
//         <table
//           style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
//         >
//           <thead>
//             <tr style={{ background: "#f8fafc" }}>
//               {[
//                 "Keyword",
//                 "Article",
//                 "Source",
//                 "Intent",
//                 "Tracked",
//                 "Current Pos",
//               ].map((h) => (
//                 <th
//                   key={h}
//                   style={{
//                     padding: "12px 14px",
//                     textAlign: "left",
//                     fontWeight: 700,
//                     color: "#64748b",
//                     fontSize: 11,
//                     textTransform: "uppercase",
//                     letterSpacing: 0.5,
//                     borderBottom: "2px solid #e2e8f0",
//                   }}
//                 >
//                   {h}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {filtered.map((k, i) => {
//               const u = URLS_DATA.find((x) => x.id === k.urlId);
//               const wk = WEEKLY_DATA[k.urlId]?.[k.keyword];
//               const pos = wk ? wk[3].p : null;
//               return (
//                 <tr
//                   key={i}
//                   style={{
//                     borderBottom: "1px solid #f8fafc",
//                     background: i % 2 === 0 ? "#fff" : "#fafbfc",
//                     opacity: k.tracked ? 1 : 0.5,
//                   }}
//                 >
//                   <td
//                     style={{
//                       padding: "10px 14px",
//                       fontWeight: 600,
//                       color: "#0f172a",
//                     }}
//                   >
//                     {k.keyword}
//                   </td>
//                   <td
//                     style={{
//                       padding: "10px 14px",
//                       color: "#64748b",
//                       fontSize: 11,
//                     }}
//                   >
//                     {u?.title}
//                   </td>
//                   <td style={{ padding: "10px 14px" }}>
//                     <span
//                       style={{
//                         fontSize: 10,
//                         padding: "2px 8px",
//                         borderRadius: 4,
//                         background:
//                           k.source === "manual" ? "#f1f5f9" : "#eff6ff",
//                         color: k.source === "manual" ? "#64748b" : "#2563eb",
//                         fontWeight: 600,
//                       }}
//                     >
//                       {k.source === "manual" ? "Manual" : "GSC Auto"}
//                     </span>
//                   </td>
//                   <td style={{ padding: "10px 14px" }}>
//                     <span
//                       style={{
//                         fontSize: 10,
//                         padding: "2px 8px",
//                         borderRadius: 4,
//                         background: "#f8fafc",
//                         color: "#64748b",
//                         fontWeight: 500,
//                       }}
//                     >
//                       {k.intent}
//                     </span>
//                   </td>
//                   <td style={{ padding: "10px 14px" }}>
//                     {k.tracked ? (
//                       <span style={{ color: "#059669", fontWeight: 700 }}>
//                         ✓ Active
//                       </span>
//                     ) : (
//                       <span style={{ color: "#94a3b8" }}>Paused</span>
//                     )}
//                   </td>
//                   <td
//                     style={{
//                       padding: "10px 14px",
//                       fontFamily: "'JetBrains Mono',monospace",
//                       fontWeight: 700,
//                       color: pos
//                         ? pos <= 3
//                           ? "#059669"
//                           : pos <= 10
//                             ? "#0f172a"
//                             : "#dc2626"
//                         : "#94a3b8",
//                     }}
//                   >
//                     {pos ? `#${pos}` : "—"}
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// // ── Main App ───────────────────────────────────────────────
// export default function App() {
//   const [view, setView] = useState("dashboard");
//   const [selectedUrl, setSelectedUrl] = useState(null);

//   const navItems = [
//     { id: "dashboard", label: "Dashboard", icon: "◉" },
//     { id: "weekly", label: "Weekly Report", icon: "◫" },
//     {
//       id: "alerts",
//       label: "Alerts",
//       icon: "⚠",
//       badge: ALERTS.filter((a) => a.severity === "critical").length,
//     },
//     { id: "keywords", label: "Keywords", icon: "⌗" },
//   ];

//   const handleSelectUrl = (id) => {
//     setSelectedUrl(id);
//     setView("url_detail");
//   };
//   const handleBack = () => {
//     setSelectedUrl(null);
//     setView("dashboard");
//   };

//   return (
//     <div
//       style={{
//         display: "flex",
//         minHeight: "100vh",
//         background: "#f8fafc",
//         fontFamily:
//           "'Instrument Sans','SF Pro Display',-apple-system,sans-serif",
//       }}
//     >
//       {/* Sidebar */}
//       <div
//         style={{
//           width: 220,
//           background: "#0f172a",
//           padding: "0",
//           flexShrink: 0,
//           display: "flex",
//           flexDirection: "column",
//         }}
//       >
//         <div style={{ padding: "24px 20px 20px" }}>
//           <div
//             style={{
//               fontSize: 15,
//               fontWeight: 800,
//               color: "#fff",
//               letterSpacing: -0.5,
//             }}
//           >
//             Ranking Tracker
//           </div>
//           <div
//             style={{
//               fontSize: 10,
//               color: "#475569",
//               marginTop: 2,
//               fontWeight: 600,
//               textTransform: "uppercase",
//               letterSpacing: 1,
//             }}
//           >
//             blockchain-ads.com
//           </div>
//         </div>
//         <div style={{ padding: "0 12px", flex: 1 }}>
//           {navItems.map((n) => (
//             <button
//               key={n.id}
//               onClick={() => {
//                 setView(n.id);
//                 setSelectedUrl(null);
//               }}
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: 10,
//                 width: "100%",
//                 padding: "10px 12px",
//                 marginBottom: 2,
//                 borderRadius: 8,
//                 border: "none",
//                 cursor: "pointer",
//                 fontSize: 13,
//                 fontWeight: 600,
//                 textAlign: "left",
//                 background:
//                   view === n.id ||
//                   (n.id === "dashboard" && view === "url_detail")
//                     ? "#1e293b"
//                     : "transparent",
//                 color:
//                   view === n.id ||
//                   (n.id === "dashboard" && view === "url_detail")
//                     ? "#fff"
//                     : "#64748b",
//                 transition: "all 0.15s",
//               }}
//             >
//               <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>
//                 {n.icon}
//               </span>
//               {n.label}
//               {n.badge > 0 && (
//                 <span
//                   style={{
//                     marginLeft: "auto",
//                     background: "#dc2626",
//                     color: "#fff",
//                     fontSize: 10,
//                     fontWeight: 700,
//                     padding: "1px 7px",
//                     borderRadius: 10,
//                   }}
//                 >
//                   {n.badge}
//                 </span>
//               )}
//             </button>
//           ))}
//         </div>
//         <div style={{ padding: "16px 20px", borderTop: "1px solid #1e293b" }}>
//           <div style={{ fontSize: 10, color: "#475569", fontWeight: 600 }}>
//             Last sync
//           </div>
//           <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
//             Mon Jan 27, 6:00 AM
//           </div>
//           <div
//             style={{
//               fontSize: 10,
//               color: "#059669",
//               marginTop: 4,
//               fontWeight: 600,
//             }}
//           >
//             ● Script healthy
//           </div>
//         </div>
//       </div>

//       {/* Main content */}
//       <div
//         style={{
//           flex: 1,
//           padding: "24px 32px",
//           maxWidth: 1100,
//           overflowY: "auto",
//         }}
//       >
//         <div style={{ marginBottom: 24 }}>
//           <h1
//             style={{
//               margin: 0,
//               fontSize: 22,
//               fontWeight: 800,
//               color: "#0f172a",
//               letterSpacing: -0.5,
//             }}
//           >
//             {view === "dashboard" || view === "url_detail"
//               ? "Dashboard"
//               : view === "weekly"
//                 ? "Weekly Report"
//                 : view === "alerts"
//                   ? "Alerts Inbox"
//                   : "Keywords Map"}
//           </h1>
//           <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>
//             {view === "dashboard"
//               ? "Monday morning overview — scan for red, action what matters"
//               : view === "url_detail"
//                 ? "Deep dive into article performance"
//                 : view === "weekly"
//                   ? "Compare keyword positions week by week"
//                   : view === "alerts"
//                     ? "Unresolved alerts across all articles"
//                     : "Manage which keywords you're tracking per URL"}
//           </p>
//         </div>

//         {view === "dashboard" && !selectedUrl && (
//           <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
//             <SummaryCards />
//             <div
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: "1fr 1fr",
//                 gap: 16,
//               }}
//             >
//               <div style={{ gridColumn: "1/-1" }}>
//                 <URLListView onSelectUrl={handleSelectUrl} />
//               </div>
//             </div>
//           </div>
//         )}

//         {view === "url_detail" && selectedUrl && (
//           <URLDetailView urlId={selectedUrl} onBack={handleBack} />
//         )}

//         {view === "weekly" && (
//           <WeeklyReportView onSelectUrl={handleSelectUrl} />
//         )}
//         {view === "alerts" && <AlertsView onSelectUrl={handleSelectUrl} />}
//         {view === "keywords" && <KeywordsView />}
//       </div>
//     </div>
//   );
// }
