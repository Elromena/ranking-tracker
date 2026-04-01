"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Rocket,
  BarChart3,
  Plus,
  FileText,
  LayoutGrid,
  Lightbulb,
  DollarSign,
  Settings,
  MessageSquare,
  BookOpen,
  Globe,
} from "lucide-react";

const GUIDE_PAGES = [
  { href: "/guide", label: "Getting Started", icon: Rocket },
  { href: "/guide/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/guide/adding-articles", label: "Adding Articles", icon: Plus },
  { href: "/guide/article-detail", label: "Article Detail", icon: FileText },
  { href: "/guide/serp-landscape", label: "SERP Landscape", icon: Globe },
  { href: "/guide/workbench", label: "Workbench", icon: LayoutGrid },
  { href: "/guide/insights", label: "Insights", icon: Lightbulb },
  { href: "/guide/cost", label: "Cost & Usage", icon: DollarSign },
  { href: "/guide/settings", label: "Settings", icon: Settings },
  { href: "/guide/notes", label: "Notes & Tracking", icon: MessageSquare },
  { href: "/guide/reference", label: "Key Concepts", icon: BookOpen },
];

export default function GuideLayout({ children }) {
  const pathname = usePathname();

  const activeIdx = GUIDE_PAGES.findIndex((p) => p.href === pathname);
  const prev = activeIdx > 0 ? GUIDE_PAGES[activeIdx - 1] : null;
  const next = activeIdx < GUIDE_PAGES.length - 1 ? GUIDE_PAGES[activeIdx + 1] : null;

  return (
    <div className="flex gap-8">
      {/* Sticky sidebar nav */}
      <nav className="hidden lg:block w-48 shrink-0 sticky top-6 self-start">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
          User Guide
        </div>
        <ul className="space-y-0.5">
          {GUIDE_PAGES.map((p) => {
            const isActive = pathname === p.href;
            const Icon = p.icon;
            return (
              <li key={p.href}>
                <Link
                  href={p.href}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  <Icon size={13} className="shrink-0" />
                  {p.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Content */}
      <div className="flex-1 min-w-0 max-w-3xl pb-20">
        <div className="mb-6">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
            User Guide
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Everything your team needs to know about using the Ranking Tracker
          </p>
        </div>

        {children}

        {/* Prev / Next navigation */}
        {(prev || next) && (
          <div className="flex items-center justify-between mt-12 pt-6 border-t border-slate-100">
            {prev ? (
              <Link
                href={prev.href}
                className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                <span>&larr;</span>
                <span>{prev.label}</span>
              </Link>
            ) : <span />}
            {next ? (
              <Link
                href={next.href}
                className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                <span>{next.label}</span>
                <span>&rarr;</span>
              </Link>
            ) : <span />}
          </div>
        )}
      </div>
    </div>
  );
}
