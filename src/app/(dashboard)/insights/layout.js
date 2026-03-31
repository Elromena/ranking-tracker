"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Target, Activity, TrendingDown } from "lucide-react";

const TABS = [
  { id: "status", label: "Status", icon: Target, href: "/insights" },
  { id: "movements", label: "Movements", icon: Activity, href: "/insights/movements" },
  { id: "trends", label: "Trends", icon: TrendingDown, href: "/insights/trends" },
];

export default function InsightsLayout({ children }) {
  const pathname = usePathname();

  const activeTab = pathname.endsWith("/movements")
    ? "movements"
    : pathname.endsWith("/trends")
      ? "trends"
      : "status";

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Insights</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Track keyword positions, detect movements, and spot gradual declines
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        {TABS.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <Link
              key={t.id}
              href={t.href}
              className={isActive ? "pill-active" : "pill-inactive"}
            >
              <span className="flex items-center gap-1.5">
                <t.icon size={14} />
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>

      {children}
    </>
  );
}
