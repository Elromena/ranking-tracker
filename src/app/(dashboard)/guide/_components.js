"use client";

import { Lightbulb } from "lucide-react";

export function Img({ src, alt, caption }) {
  return (
    <figure className="my-5">
      <img
        src={src}
        alt={alt}
        className="w-full rounded-lg border border-slate-200 shadow-sm"
        loading="lazy"
      />
      {caption && (
        <figcaption className="text-xs text-slate-400 mt-2 text-center italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export function SectionHeading({ children }) {
  return <h2 className="text-lg font-bold text-slate-900 mt-1 mb-3">{children}</h2>;
}

export function SubHeading({ children }) {
  return <h3 className="text-sm font-bold text-slate-700 mt-6 mb-2">{children}</h3>;
}

export function P({ children }) {
  return <p className="text-sm text-slate-600 leading-relaxed mb-3">{children}</p>;
}

export function Tip({ children }) {
  return (
    <div className="flex gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 my-4 text-sm text-blue-800">
      <Lightbulb size={16} className="shrink-0 mt-0.5 text-blue-500" />
      <div>{children}</div>
    </div>
  );
}

export function KeyBadge({ children }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-[11px] font-mono font-semibold text-slate-700 border border-slate-200">
      {children}
    </span>
  );
}

export function StageRow({ color, label, desc }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span
        className="mt-1 w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <div>
        <span className="text-sm font-semibold text-slate-800">{label}</span>
        <span className="text-sm text-slate-500 ml-2">{desc}</span>
      </div>
    </div>
  );
}
