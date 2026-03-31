"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/services";
import {
  Button,
  Badge,
  Card,
  Input,
  Spinner,
  Toggle,
  Table,
  Th,
  Td,
} from "@/components/ui";
import {
  Save,
  KeyRound,
  Globe,
  Tag,
  Bell,
  Wrench,
  Trash2,
  Plus,
  Play,
  CheckCircle,
  XCircle,
  FlaskConical,
  AlertTriangle,
  Search,
  Send,
} from "lucide-react";

export default function SettingsView() {
  // Config state
  const [cfg, setCfg] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Locales
  const [locales, setLocales] = useState([]);
  const [newLocale, setNewLocale] = useState({
    locale: "",
    displayName: "",
    urlPrefix: "",
    defaultCountries: "",
    languageCode: "",
  });
  const [localesSaving, setLocalesSaving] = useState(false);

  // Categories
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState("");
  const [catLoading, setCatLoading] = useState(false);
  const [catDeleting, setCatDeleting] = useState(null);

  // Action results
  const [dfsResult, setDfsResult] = useState(null);
  const [dfsTesting, setDfsTesting] = useState(false);
  const [cronRunning, setCronRunning] = useState(false);
  const [cronResult, setCronResult] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [clearResult, setClearResult] = useState(null);

  // GSC test
  const [gscTesting, setGscTesting] = useState(false);
  const [gscResult, setGscResult] = useState(null);

  // Telegram test
  const [telegramTesting, setTelegramTesting] = useState(false);
  const [telegramResult, setTelegramResult] = useState(null);

  // Helpers
  const u = (key, value) => {
    setCfg((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const fetchCategories = useCallback(() => {
    api("/admin/categories")
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const fetchLocales = useCallback(() => {
    api("/locale-configs")
      .then(setLocales)
      .catch(() => setLocales([]));
  }, []);

  // Load everything on mount
  useEffect(() => {
    Promise.all([
      api("/config").catch(() => ({})),
      api("/admin/categories").catch(() => []),
      api("/locale-configs").catch(() => []),
    ])
      .then(([config, cats, locs]) => {
        setCfg(config || {});
        setCategories(cats || []);
        setLocales(Array.isArray(locs) ? locs : []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Save all config
  const saveConfig = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api("/config", {
        method: "POST",
        body: JSON.stringify(cfg),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert(`Failed to save: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Test DataForSEO
  const testDfs = async () => {
    setDfsTesting(true);
    setDfsResult(null);
    try {
      const result = await api("/admin/test-dfs", {
        method: "POST",
        body: JSON.stringify({ keyword: "crypto affiliate programs" }),
      });
      setDfsResult(result);
    } catch (e) {
      setDfsResult({ ok: false, error: e.message });
    }
    setDfsTesting(false);
  };

  // Run Cron
  const runCron = async () => {
    setCronRunning(true);
    setCronResult(null);
    try {
      const result = await api("/admin/trigger-cron", { method: "POST" });
      setCronResult(result);
    } catch (e) {
      setCronResult({ ok: false, error: e.message });
    }
    setCronRunning(false);
  };

  // Clear snapshots
  const clearSnapshots = async () => {
    if (!confirm("This will delete ALL ranking snapshots and alerts. Are you sure?")) return;
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

  // Test GSC
  const testGsc = async () => {
    setGscTesting(true);
    setGscResult(null);
    try {
      const result = await api("/test-gsc");
      setGscResult(result);
    } catch (e) {
      setGscResult({ success: false, message: e.message });
    }
    setGscTesting(false);
  };

  // Test Telegram
  const testTelegram = async () => {
    setTelegramTesting(true);
    setTelegramResult(null);
    try {
      const result = await api("/admin/test-telegram", { method: "POST" });
      setTelegramResult(result);
    } catch (e) {
      setTelegramResult({ ok: false, error: e.message });
    }
    setTelegramTesting(false);
  };

  // Add category
  const addCategory = async () => {
    if (!newCatName.trim()) return;
    setCatLoading(true);
    try {
      await api("/admin/categories", {
        method: "POST",
        body: JSON.stringify({ name: newCatName }),
      });
      setNewCatName("");
      fetchCategories();
    } catch (e) {
      alert(`Failed to add category: ${e.message}`);
    }
    setCatLoading(false);
  };

  // Delete category
  const deleteCategory = async (id) => {
    setCatDeleting(id);
    try {
      await api(`/admin/categories/${id}`, { method: "DELETE" });
      fetchCategories();
    } catch (e) {
      alert(`Failed to delete: ${e.message}`);
    }
    setCatDeleting(null);
  };

  // Add locale
  const addLocale = async () => {
    if (!newLocale.locale.trim() || !newLocale.displayName.trim()) return;
    setLocalesSaving(true);
    try {
      await api("/locale-configs", {
        method: "POST",
        body: JSON.stringify({
          locale: newLocale.locale,
          displayName: newLocale.displayName,
          urlPrefix: newLocale.urlPrefix,
          defaultCountries: newLocale.defaultCountries
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
          languageCode: newLocale.languageCode,
        }),
      });
      setNewLocale({
        locale: "",
        displayName: "",
        urlPrefix: "",
        defaultCountries: "",
        languageCode: "",
      });
      fetchLocales();
    } catch (e) {
      alert(`Failed to add locale: ${e.message}`);
    }
    setLocalesSaving(false);
  };

  // Toggle locale enabled
  const toggleLocaleEnabled = async (locale) => {
    const updated = locales.map((l) =>
      l.locale === locale.locale ? { ...l, enabled: !l.enabled } : l,
    );
    setLocales(updated);
    try {
      await api("/locale-configs", {
        method: "POST",
        body: JSON.stringify({
          ...locale,
          enabled: !locale.enabled,
        }),
      });
    } catch (e) {
      fetchLocales();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={24} className="text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Save Button - Top */}
      <div className="flex items-center gap-3">
        <Button onClick={saveConfig} disabled={saving}>
          <span className="flex items-center gap-2">
            {saving ? (
              <Spinner size={14} />
            ) : (
              <Save size={14} />
            )}
            {saving ? "Saving..." : "Save Configuration"}
          </span>
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
            <CheckCircle size={14} />
            Saved
          </span>
        )}
      </div>

      {/* Section 1: API Credentials */}
      <Card className="p-6">
        <SectionHeader
          icon={KeyRound}
          title="API Credentials"
          description="DataForSEO and notification credentials"
        />
        <div className="space-y-4 mt-4">
          <Input
            label="DataForSEO Login"
            value={cfg.dfsLogin || ""}
            onChange={(e) => u("dfsLogin", typeof e === "string" ? e : e.target.value)}
            placeholder="your-login@email.com"
          />
          <Input
            label="DataForSEO Password"
            type="password"
            value={cfg.dfsPassword || ""}
            onChange={(e) => u("dfsPassword", typeof e === "string" ? e : e.target.value)}
            placeholder="your-api-password"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Telegram Bot Token"
              value={cfg.telegramBotToken || ""}
              onChange={(e) => u("telegramBotToken", typeof e === "string" ? e : e.target.value)}
              placeholder="123456:ABC-DEF..."
            />
            <Input
              label="Telegram Chat ID"
              value={cfg.telegramChatId || ""}
              onChange={(e) => u("telegramChatId", typeof e === "string" ? e : e.target.value)}
              placeholder="-1001234567890"
            />
          </div>
          <Input
            label="Target Domain"
            value={cfg.targetDomain || ""}
            onChange={(e) => u("targetDomain", typeof e === "string" ? e : e.target.value)}
            placeholder="example.com"
          />
          <p className="text-xs text-slate-400">
            Your domain without www or https -- used to find your articles in SERP results.
          </p>

          {/* Test DFS Button */}
          <div className="flex items-center gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={testDfs} disabled={dfsTesting}>
              <span className="flex items-center gap-1.5">
                {dfsTesting ? <Spinner size={12} /> : <FlaskConical size={14} />}
                {dfsTesting ? "Testing..." : "Test DataForSEO"}
              </span>
            </Button>
          </div>

          {dfsResult && (
            <ResultBox success={dfsResult.found || dfsResult.ok}>
              {dfsResult.found ? (
                <>
                  <p className="font-bold text-emerald-700">
                    Found! Position #{dfsResult.position}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    Keyword: {dfsResult.keyword}
                  </p>
                  <p className="text-xs text-emerald-600">
                    URL: {dfsResult.foundUrl}
                  </p>
                </>
              ) : (
                <p className="font-bold text-red-700">
                  {dfsResult.error || "Domain not found in top 100"}
                </p>
              )}
            </ResultBox>
          )}
        </div>
      </Card>

      {/* Section 2: Google Search Console */}
      <Card className="p-6">
        <SectionHeader
          icon={Search}
          title="Google Search Console"
          description="Connect GSC to get traffic data (clicks, impressions) for your articles"
        />
        <div className="mt-4 space-y-4">
          <div className="px-4 py-3 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-2">
            <p className="font-semibold text-slate-700">Setup Instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Create a service account in Google Cloud Console</li>
              <li>Download the JSON key file</li>
              <li>Set <code className="bg-slate-200 px-1 rounded">GSC_CREDENTIALS</code> env var to the JSON content</li>
              <li>Set <code className="bg-slate-200 px-1 rounded">GSC_PROPERTY</code> to your Search Console property URL (e.g. <code className="bg-slate-200 px-1 rounded">https://example.com</code>)</li>
              <li>Add the service account email as a user in Search Console → Settings → Users and permissions</li>
            </ol>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={testGsc} disabled={gscTesting}>
              <span className="flex items-center gap-1.5">
                {gscTesting ? <Spinner size={12} /> : <FlaskConical size={14} />}
                {gscTesting ? "Testing..." : "Test GSC Connection"}
              </span>
            </Button>
          </div>

          {gscResult && (
            <ResultBox success={gscResult.success}>
              {gscResult.success ? (
                <>
                  <p className="font-bold text-emerald-700">{gscResult.message}</p>
                  {gscResult.info?.serviceAccountEmail && (
                    <p className="text-xs text-emerald-600 mt-1">Account: {gscResult.info.serviceAccountEmail}</p>
                  )}
                  {gscResult.info?.rowCount > 0 && (
                    <p className="text-xs text-emerald-600">Received {gscResult.info.rowCount} rows of data</p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-bold text-red-700">{gscResult.message}</p>
                  {gscResult.errors?.map((err, i) => (
                    <p key={i} className="text-xs text-red-600 mt-1">{err}</p>
                  ))}
                </>
              )}
            </ResultBox>
          )}
        </div>
      </Card>

      {/* Section 3: Telegram Notifications */}
      <Card className="p-6">
        <SectionHeader
          icon={Send}
          title="Telegram Notifications"
          description="Get ranking movement alerts via Telegram"
        />
        <div className="mt-4 space-y-4">
          <div className="px-4 py-3 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-2">
            <p className="font-semibold text-slate-700">Setup Instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Message <code className="bg-slate-200 px-1 rounded">@BotFather</code> on Telegram to create a new bot</li>
              <li>Copy the bot token and paste it in the &ldquo;Telegram Bot Token&rdquo; field above</li>
              <li>Add your bot to a group chat (or use a direct chat)</li>
              <li>Get the chat ID (send a message, then check <code className="bg-slate-200 px-1 rounded">api.telegram.org/bot&lt;token&gt;/getUpdates</code>)</li>
              <li>Save the configuration, then test below</li>
            </ol>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={testTelegram} disabled={telegramTesting}>
              <span className="flex items-center gap-1.5">
                {telegramTesting ? <Spinner size={12} /> : <Send size={14} />}
                {telegramTesting ? "Sending..." : "Test Telegram"}
              </span>
            </Button>
          </div>

          {telegramResult && (
            <ResultBox success={telegramResult.ok}>
              {telegramResult.ok ? (
                <p className="font-bold text-emerald-700">Test message sent successfully!</p>
              ) : (
                <p className="font-bold text-red-700">{telegramResult.error || "Failed to send test message"}</p>
              )}
            </ResultBox>
          )}
        </div>
      </Card>

      {/* Section 4: Locale Management */}
      <Card className="p-6">
        <SectionHeader
          icon={Globe}
          title="Locale Management"
          description="Configure locales for multi-region tracking"
        />
        <div className="mt-4 space-y-4">
          {/* Existing Locales */}
          {locales.length > 0 && (
            <Table>
              <thead>
                <tr className="bg-slate-50/50">
                  <Th>Code</Th>
                  <Th>Display Name</Th>
                  <Th>Countries</Th>
                  <Th>Enabled</Th>
                </tr>
              </thead>
              <tbody>
                {locales.map((loc) => (
                  <tr key={loc.locale || loc.id}>
                    <Td className="font-mono font-semibold">
                      {(loc.locale || "").toUpperCase()}
                    </Td>
                    <Td>{loc.displayName}</Td>
                    <Td className="text-xs text-slate-500">
                      {Array.isArray(loc.defaultCountries)
                        ? loc.defaultCountries.join(", ")
                        : loc.defaultCountries || "--"}
                    </Td>
                    <Td>
                      <Toggle
                        checked={loc.enabled !== false}
                        onChange={() => toggleLocaleEnabled(loc)}
                      />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          {locales.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">
              No locales configured yet.
            </p>
          )}

          {/* Add New Locale */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Add New Locale
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Input
                label="Locale Code"
                value={newLocale.locale}
                onChange={(e) =>
                  setNewLocale((p) => ({
                    ...p,
                    locale: typeof e === "string" ? e : e.target.value,
                  }))
                }
                placeholder="en"
              />
              <Input
                label="Display Name"
                value={newLocale.displayName}
                onChange={(e) =>
                  setNewLocale((p) => ({
                    ...p,
                    displayName: typeof e === "string" ? e : e.target.value,
                  }))
                }
                placeholder="English"
              />
              <Input
                label="URL Prefix"
                value={newLocale.urlPrefix}
                onChange={(e) =>
                  setNewLocale((p) => ({
                    ...p,
                    urlPrefix: typeof e === "string" ? e : e.target.value,
                  }))
                }
                placeholder="/en"
              />
              <Input
                label="Default Countries"
                value={newLocale.defaultCountries}
                onChange={(e) =>
                  setNewLocale((p) => ({
                    ...p,
                    defaultCountries: typeof e === "string" ? e : e.target.value,
                  }))
                }
                placeholder="us, gb, ca"
              />
              <Input
                label="Language Code"
                value={newLocale.languageCode}
                onChange={(e) =>
                  setNewLocale((p) => ({
                    ...p,
                    languageCode: typeof e === "string" ? e : e.target.value,
                  }))
                }
                placeholder="en"
              />
              <div className="flex items-end">
                <Button
                  size="sm"
                  onClick={addLocale}
                  disabled={localesSaving}
                >
                  <span className="flex items-center gap-1.5">
                    {localesSaving ? <Spinner size={12} /> : <Plus size={14} />}
                    Add
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Section 3: Categories */}
      <Card className="p-6">
        <SectionHeader
          icon={Tag}
          title="Categories"
          description="Manage article categories"
        />
        <div className="mt-4 space-y-3">
          {/* Add New */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                value={newCatName}
                onChange={(e) => setNewCatName(typeof e === "string" ? e : e.target.value)}
                placeholder="New category name..."
                onKeyDown={(e) => e.key === "Enter" && addCategory()}
              />
            </div>
            <div className="flex items-end">
              <Button size="sm" onClick={addCategory} disabled={catLoading}>
                <span className="flex items-center gap-1.5">
                  {catLoading ? <Spinner size={12} /> : <Plus size={14} />}
                  Add
                </span>
              </Button>
            </div>
          </div>

          {/* Category List */}
          <div className="flex flex-col gap-1.5">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-100"
              >
                <span className="text-sm font-medium text-slate-700">
                  {cat.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteCategory(cat.id)}
                  disabled={catDeleting === cat.id}
                >
                  {catDeleting === cat.id ? (
                    <Spinner size={12} />
                  ) : (
                    <Trash2 size={14} className="text-red-500" />
                  )}
                </Button>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">
                No categories yet.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Section 4: Alert Thresholds */}
      <Card className="p-6">
        <SectionHeader
          icon={Bell}
          title="Alert Thresholds"
          description="Configure when to trigger ranking alerts"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Input
            label="Position Drop Threshold"
            type="number"
            value={cfg.alertThreshold || "3"}
            onChange={(e) => u("alertThreshold", typeof e === "string" ? e : e.target.value)}
            placeholder="3"
          />
          <Input
            label="Default Review Period (days)"
            type="number"
            value={cfg.reviewPeriodDays || "7"}
            onChange={(e) => u("reviewPeriodDays", typeof e === "string" ? e : e.target.value)}
            placeholder="7"
          />
        </div>
      </Card>

      {/* Section 5: Manual Actions */}
      <Card className="p-6">
        <SectionHeader
          icon={Wrench}
          title="Manual Actions"
          description="Trigger data collection or clear data"
        />
        <div className="mt-4 space-y-4">
          {/* Run Cron */}
          <div className="flex items-center gap-3">
            <Button onClick={runCron} disabled={cronRunning}>
              <span className="flex items-center gap-1.5">
                {cronRunning ? <Spinner size={14} /> : <Play size={14} />}
                {cronRunning ? "Running..." : "Run Data Collection Now"}
              </span>
            </Button>
            <span className="text-xs text-slate-400">
              Manually trigger the ranking data collection
            </span>
          </div>

          {cronResult && (
            <ResultBox success={cronResult.ok}>
              {cronResult.ok ? (
                <>
                  <p className="font-bold text-emerald-700">
                    Completed in {cronResult.duration}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    Alerts: {cronResult.alerts?.critical || 0} critical,{" "}
                    {cronResult.alerts?.warning || 0} warnings,{" "}
                    {cronResult.alerts?.positive || 0} positive
                  </p>
                  {cronResult.log && (
                    <pre className="mt-2 text-xs text-slate-500 font-mono whitespace-pre-wrap">
                      {cronResult.log.join("\n")}
                    </pre>
                  )}
                </>
              ) : (
                <p className="font-bold text-red-700">
                  Error: {cronResult.error}
                </p>
              )}
            </ResultBox>
          )}

          {/* Clear Data */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center gap-3">
              <Button variant="danger" onClick={clearSnapshots} disabled={clearing}>
                <span className="flex items-center gap-1.5">
                  {clearing ? (
                    <Spinner size={14} />
                  ) : (
                    <AlertTriangle size={14} />
                  )}
                  {clearing ? "Clearing..." : "Clear All Ranking Data"}
                </span>
              </Button>
              <span className="text-xs text-slate-400">
                Deletes all snapshots and alerts permanently
              </span>
            </div>

            {clearResult && (
              <ResultBox success={clearResult.ok}>
                {clearResult.ok ? (
                  <p className="font-bold text-emerald-700">
                    Cleared {clearResult.snapshotsDeleted} snapshots and{" "}
                    {clearResult.alertsDeleted} alerts.
                  </p>
                ) : (
                  <p className="font-bold text-red-700">
                    Error: {clearResult.error}
                  </p>
                )}
              </ResultBox>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Shared sub-components ────────────────────────────────────

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-slate-50">
        <Icon size={16} className="text-slate-500" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {description && (
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

function ResultBox({ success, children }) {
  return (
    <div
      className={`rounded-lg p-4 text-sm ${
        success
          ? "bg-emerald-50 border border-emerald-200"
          : "bg-red-50 border border-red-200"
      }`}
    >
      {children}
    </div>
  );
}
