import Badge from "@/app/component/badge";
import Btn from "@/app/component/btn";
import Loading from "@/app/component/loading";
import { statusCfg } from "@/lib/utils";

// ── Dashboard View ─────────────────────────────────────────
export default function DashboardView({
  urls,
  alerts,
  onSelectUrl,
  onAddArticle,
  loading,
}) {
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
