// ── Pipeline Stages ─────────────────────────────────────────
export const stageCfg = {
  backlog:     { l: "Backlog",      c: "#64748b", b: "#f1f5f9", dot: "#94a3b8" },
  in_progress: { l: "In Progress",  c: "#2563eb", b: "#dbeafe", dot: "#3b82f6" },
  in_review:   { l: "In Review",    c: "#d97706", b: "#fef3c7", dot: "#f59e0b" },
  monitoring:  { l: "Monitoring",   c: "#059669", b: "#ecfdf5", dot: "#10b981" },
  parked:      { l: "Parked",       c: "#64748b", b: "#e2e8f0", dot: "#94a3b8" },
};

export const STAGES = ["backlog", "in_progress", "in_review", "monitoring", "parked"];

// ── Note Types ──────────────────────────────────────────────
export const noteTypeCfg = {
  change:       { l: "Content Change", c: "#2563eb", b: "#dbeafe" },
  optimization: { l: "Optimization",   c: "#7c3aed", b: "#ede9fe" },
  technical:    { l: "Technical",      c: "#d97706", b: "#fef3c7" },
  algorithm:    { l: "Algorithm",      c: "#dc2626", b: "#fef2f2" },
  general:      { l: "General",        c: "#64748b", b: "#f1f5f9" },
};

// ── Locale flag emojis ──────────────────────────────────────
export const localeFlags = {
  en: "EN", ru: "RU", ko: "KO", ja: "JA", de: "DE",
  fr: "FR", es: "ES", zh: "ZH", pt: "PT", ar: "AR",
};
