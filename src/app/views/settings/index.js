import Btn from "@/component/btn";
import Input from "@/component/input";
import Loading from "@/component/loading";
import Select from "@/component/select";
import Toggle from "@/component/toggle";
import { api } from "@/lib/services";
import { useEffect, useState } from "react";

export default function ConfigPage() {
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
