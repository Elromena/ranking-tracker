"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  Lightbulb,
  DollarSign,
  Settings,
  LayoutGrid,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/workbench", label: "Workbench", icon: LayoutGrid },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/cost", label: "Cost & Usage", icon: DollarSign },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/guide", label: "Guide", icon: BookOpen },
];

const STORAGE_KEY = "sidebar-collapsed";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      localStorage.setItem(STORAGE_KEY, String(!prev));
      return !prev;
    });
  };

  const isActive = (href) => {
    if (href === "/") return pathname === "/" || pathname.startsWith("/articles");
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`bg-sidebar flex-shrink-0 flex flex-col transition-all duration-200 ${
          collapsed ? "w-[52px]" : "w-[200px]"
        }`}
      >
        <div className={`pt-5 pb-4 ${collapsed ? "px-2" : "px-4"}`}>
          {collapsed ? (
            <div className="text-sm font-extrabold text-white tracking-tight text-center">R</div>
          ) : (
            <>
              <div className="text-sm font-extrabold text-white tracking-tight">Ranking Tracker</div>
              <div className="text-[9px] text-slate-500 mt-0.5 font-semibold uppercase tracking-widest">Multi-Locale</div>
            </>
          )}
        </div>
        <nav className={`flex-1 space-y-0.5 ${collapsed ? "px-1" : "px-2"}`}>
          {nav.map((n) => {
            const Icon = n.icon;
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                title={collapsed ? n.label : undefined}
                className={`${active ? "sidebar-item-active" : "sidebar-item-inactive"} ${
                  collapsed ? "!justify-center !px-0" : ""
                }`}
              >
                <Icon size={14} className="shrink-0" />
                {!collapsed && n.label}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={toggle}
          className={`flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors py-3 border-t border-slate-800 ${
            collapsed ? "justify-center px-2" : "px-4"
          }`}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          {!collapsed && <span className="text-[10px] font-semibold">Collapse</span>}
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 max-w-[1200px] overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
