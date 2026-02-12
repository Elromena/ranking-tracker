"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardView from "./views/dashboard";
import URLDetailView from "./views/detail";
import WeeklyReportView from "./views/report";
import AlertsView from "./views/alert";
import ConfigPage from "./views/settings";
import { CategoriesAdmin } from "./views/categories";
import { api } from "../lib/services";
import ArticleModal from "./views/dashboard/article-modal";

export const Loader = () => (
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
