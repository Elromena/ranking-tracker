import { useEffect, useState } from "react";
import Badge from "../../../component/badge";
import Loading from "../../../component/loading";
import Pill from "../../../component/pill";
import { api } from "../../../lib/services";
import { sevCfg, stCfg } from "../../../lib/utils";

export default function AlertsView({ onSelectUrl }) {
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
                      {a.type?.replaceAll("_", " ")}
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
