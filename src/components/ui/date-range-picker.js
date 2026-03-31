"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { format, subDays, startOfDay, endOfDay, differenceInDays } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, ArrowLeftRight, X, Check } from "lucide-react";

const PRESETS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "60d", days: 60 },
  { label: "90d", days: 90 },
];

function MiniCalendar({ selected, onSelect, label, highlightFrom, highlightTo }) {
  const [viewDate, setViewDate] = useState(selected || new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const isInRange = (date) => {
    if (!highlightFrom || !highlightTo) return false;
    return date >= startOfDay(highlightFrom) && date <= endOfDay(highlightTo);
  };

  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const isSelected = selected && date.toDateString() === selected.toDateString();
    const isToday = date.toDateString() === new Date().toDateString();
    const inRange = isInRange(date);

    days.push(
      <button
        key={d}
        type="button"
        onClick={() => onSelect(date)}
        className={`w-7 h-7 rounded-md text-[11px] font-medium transition-colors ${
          isSelected
            ? "bg-slate-900 text-white"
            : inRange
              ? "bg-blue-50 text-blue-700"
              : isToday
                ? "ring-1 ring-blue-300 text-blue-600 font-bold"
                : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        {d}
      </button>
    );
  }

  return (
    <div className="w-[224px]">
      {label && (
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
          {label}
        </div>
      )}
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prevMonth} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs font-semibold text-slate-700">
          {format(viewDate, "MMMM yyyy")}
        </span>
        <button type="button" onClick={nextMonth} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-[9px] font-semibold text-slate-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">{days}</div>
    </div>
  );
}

export default function DateRangePicker({
  startDate,
  endDate,
  onChange,
  compareStartDate,
  compareEndDate,
  onCompareChange,
  comparing,
  onComparingToggle,
}) {
  const [open, setOpen] = useState(false);
  // Buffer dates internally so we don't trigger parent re-render mid-pick
  const [draftStart, setDraftStart] = useState(startDate);
  const [draftEnd, setDraftEnd] = useState(endDate);
  const [step, setStep] = useState("start"); // start | end
  const ref = useRef(null);

  // Sync drafts when parent changes (e.g. from presets)
  useEffect(() => { if (!open) setDraftStart(startDate); }, [startDate, open]);
  useEffect(() => { if (!open) setDraftEnd(endDate); }, [endDate, open]);

  // Store latest drafts in ref so outside-click handler sees current values
  const draftsRef = useRef({ draftStart, draftEnd });
  useEffect(() => { draftsRef.current = { draftStart, draftEnd }; }, [draftStart, draftEnd]);

  // Apply buffered dates to parent
  const applyDraft = useCallback(() => {
    const { draftStart: ds, draftEnd: de } = draftsRef.current;
    if (ds && de) {
      const s = ds < de ? ds : de;
      const e = ds < de ? de : ds;
      onChange(startOfDay(s), endOfDay(e));
    }
  }, [onChange]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [open]);

  const applyPreset = (days) => {
    const end = new Date();
    const start = subDays(end, days);
    onChange(startOfDay(start), endOfDay(end));

    if (comparing) {
      const compEnd = subDays(start, 1);
      const compStart = subDays(compEnd, days);
      onCompareChange(startOfDay(compStart), endOfDay(compEnd));
    }
    setOpen(false);
  };

  const handleDatePick = (date) => {
    if (step === "start") {
      setDraftStart(date);
      setDraftEnd(null);
      setStep("end");
    } else {
      setDraftEnd(date);
      setStep("start");
    }
  };

  const handleApplyAndClose = () => {
    applyDraft();
    setOpen(false);
  };

  const dayCount = startDate && endDate ? differenceInDays(endDate, startDate) + 1 : 0;

  return (
    <div className="relative" ref={ref}>
      <div className="flex flex-wrap items-center gap-2">
        {/* Presets */}
        {PRESETS.map((p) => (
          <button
            type="button"
            key={p.days}
            onClick={() => applyPreset(p.days)}
            className={dayCount === p.days ? "pill-active" : "pill-inactive"}
          >
            {p.label}
          </button>
        ))}

        {/* Custom date display / trigger */}
        <button
          type="button"
          onClick={() => {
            setOpen(!open);
            setStep("start");
            setDraftStart(startDate);
            setDraftEnd(endDate);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            open
              ? "border-blue-300 bg-blue-50 text-blue-700"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Calendar size={12} />
          {startDate && endDate
            ? `${format(startDate, "d MMM")} – ${format(endDate, "d MMM")}`
            : "Custom range"}
        </button>

        {/* Compare toggle */}
        <button
          type="button"
          onClick={() => {
            const newComparing = !comparing;
            onComparingToggle(newComparing);
            if (newComparing && startDate && endDate) {
              const days = differenceInDays(endDate, startDate);
              const compEnd = subDays(startDate, 1);
              const compStart = subDays(compEnd, days);
              onCompareChange(startOfDay(compStart), endOfDay(compEnd));
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            comparing
              ? "bg-violet-100 text-violet-700 border border-violet-200"
              : "border border-slate-200 text-slate-400 hover:text-slate-600"
          }`}
        >
          <ArrowLeftRight size={12} />
          Compare
        </button>

        {/* Compare period display */}
        {comparing && compareStartDate && compareEndDate && (
          <span className="text-xs text-violet-500 font-medium">
            vs {format(compareStartDate, "d MMM")} – {format(compareEndDate, "d MMM")}
          </span>
        )}
      </div>

      {/* Calendar dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-4">
          <div className="flex gap-4">
            <MiniCalendar
              selected={step === "start" ? draftStart : draftEnd}
              onSelect={handleDatePick}
              label={step === "start" ? "Select start date" : "Select end date"}
              highlightFrom={draftStart}
              highlightTo={draftEnd}
            />

            <div className="flex flex-col justify-between text-xs min-w-[120px]">
              {/* Selection state */}
              <div>
                <div className="font-semibold text-slate-600 mb-2">Date Range</div>
                <div className="space-y-1.5">
                  <div
                    className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                      step === "start" ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-500"
                    }`}
                    onClick={() => setStep("start")}
                  >
                    Start: {draftStart ? format(draftStart, "d MMM yyyy") : "—"}
                  </div>
                  <div
                    className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                      step === "end" ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-500"
                    }`}
                    onClick={() => setStep("end")}
                  >
                    End: {draftEnd ? format(draftEnd, "d MMM yyyy") : "—"}
                  </div>
                </div>

                {draftStart && draftEnd && (
                  <div className="mt-3 px-2 text-[10px] text-slate-400">
                    {Math.abs(differenceInDays(draftEnd, draftStart)) + 1} days selected
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => { setOpen(false); setDraftStart(startDate); setDraftEnd(endDate); }}
                  className="flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyAndClose}
                  disabled={!draftStart || !draftEnd}
                  className="flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors disabled:opacity-40"
                >
                  <span className="flex items-center justify-center gap-1">
                    <Check size={12} /> Apply
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
