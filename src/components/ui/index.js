"use client";

import { Loader2, X } from "lucide-react";

// ── Button ─────────────────────────────────────────────────
const btnVariants = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

export function Button({ children, variant = "primary", size, className = "", ...props }) {
  const cls = `${btnVariants[variant] || btnVariants.primary} ${size === "sm" ? "btn-sm" : ""} ${className}`;
  return <button className={cls} {...props}>{children}</button>;
}

// ── Badge ──────────────────────────────────────────────────
export function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
    info: "bg-blue-50 text-blue-700",
    purple: "bg-violet-50 text-violet-700",
  };
  return (
    <span className={`badge ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}

// ── Pill ───────────────────────────────────────────────────
export function Pill({ children, active, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`${active ? "pill-active" : "pill-inactive"} ${className}`}
    >
      {children}
    </button>
  );
}

// ── Input ──────────────────────────────────────────────────
export function Input({ label, className = "", ...props }) {
  return (
    <div>
      {label && <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>}
      <input className={`input ${className}`} {...props} />
    </div>
  );
}

// ── Select ─────────────────────────────────────────────────
export function Select({ label, options, children, className = "", ...props }) {
  return (
    <div>
      {label && <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>}
      <select className={`select ${className}`} {...props}>
        {children || (options || []).map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ── Toggle ─────────────────────────────────────────────────
export function Toggle({ label, description, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <div>
        {label && <div className="text-sm font-semibold text-slate-900">{label}</div>}
        {description && <div className="text-xs text-slate-400 mt-0.5">{description}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-slate-300"}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

// ── Card ───────────────────────────────────────────────────
export function Card({ children, className = "", ...props }) {
  return <div className={`card ${className}`} {...props}>{children}</div>;
}

// ── Modal ──────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-xl ${wide ? "max-w-2xl" : "max-w-lg"} w-full mx-4 max-h-[85vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Spinner ────────────────────────────────────────────────
export function Spinner({ size = 16, className = "" }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} />;
}

// ── EmptyState ─────────────────────────────────────────────
export function EmptyState({ message = "Nothing here yet", icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      {icon && <div className="mb-3 text-slate-300">{icon}</div>}
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ── StageDot ───────────────────────────────────────────────
const stageColors = {
  backlog: "bg-slate-400",
  in_progress: "bg-blue-500",
  in_review: "bg-amber-500",
  monitoring: "bg-emerald-500",
  parked: "bg-slate-300",
};

export function StageDot({ stage, size = "sm" }) {
  const s = size === "sm" ? "w-2 h-2" : "w-3 h-3";
  return <span className={`inline-block rounded-full ${s} ${stageColors[stage] || stageColors.monitoring}`} />;
}

// ── PositionText ───────────────────────────────────────────
export function PositionText({ position, className = "" }) {
  if (!position) return <span className={`font-mono text-slate-300 ${className}`}>—</span>;
  const color = position <= 3 ? "text-emerald-600" : position <= 10 ? "text-slate-900" : position <= 20 ? "text-amber-600" : "text-red-600";
  return <span className={`font-mono font-bold ${color} ${className}`}>#{position}</span>;
}

// ── ChangeIndicator ────────────────────────────────────────
export function ChangeIndicator({ change, className = "" }) {
  if (!change || change === 0) return null;
  // Positive change = positions improved (prevPos - currentPos > 0 means moved up)
  const improved = change > 0;
  const color = improved ? "text-emerald-600" : "text-red-600";
  return (
    <span className={`text-xs font-bold font-mono ${color} ${className}`}>
      {improved ? `+${change}` : change}
    </span>
  );
}

// ── LocalePill ─────────────────────────────────────────────
const stageBg = {
  backlog: "bg-slate-50 border-slate-200",
  in_progress: "bg-blue-50 border-blue-200",
  in_review: "bg-amber-50 border-amber-200",
  monitoring: "bg-emerald-50 border-emerald-200",
  parked: "bg-slate-50 border-slate-200",
};
const stageText = {
  backlog: "text-slate-500",
  in_progress: "text-blue-600",
  in_review: "text-amber-600",
  monitoring: "text-emerald-600",
  parked: "text-slate-400",
};

export function LocalePill({ locale, stage, avgPosition, change }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold border ${stageBg[stage] || stageBg.monitoring}`}>
      <StageDot stage={stage} />
      <span className={stageText[stage] || "text-slate-500"}>{(locale || "").toUpperCase()}</span>
      {avgPosition && <PositionText position={Math.round(avgPosition)} className="text-xs" />}
      <ChangeIndicator change={change} />
    </div>
  );
}

// ── Table helpers ──────────────────────────────────────────
export function Table({ children, className = "" }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className = "" }) {
  return <th className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-slate-200 ${className}`}>{children}</th>;
}

export function Td({ children, className = "" }) {
  return <td className={`px-4 py-3 border-b border-slate-50 ${className}`}>{children}</td>;
}
