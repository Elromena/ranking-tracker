"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, Plus, Clock, GripVertical, MessageSquare, X, ChevronDown } from "lucide-react";
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { stageCfg, STAGES, localeFlags, noteTypeCfg } from "@/lib/utils";
import { api } from "@/lib/services";
import {
  Card, Badge, StageDot, PositionText, Button, Input, Select, Spinner,
} from "@/components/ui";

function WorkbenchCard({ article, locale, onSelect, onStageChange, changingStage, onQuickNote, isDragging }) {
  const reviewDaysLeft = locale.reviewStartedAt
    ? Math.max(0, (locale.reviewDays || 14) - Math.floor((Date.now() - new Date(locale.reviewStartedAt).getTime()) / 86400000))
    : null;
  const isChanging = changingStage === locale.id;

  return (
    <Card
      className={`px-3 py-3 transition-all ${isDragging ? "opacity-50 shadow-lg border-blue-300" : "hover:border-slate-300 hover:shadow-sm"}`}
    >
      {/* Drag handle + title */}
      <div className="flex items-start gap-2 mb-2">
        <GripVertical size={14} className="text-slate-300 mt-0.5 cursor-grab shrink-0" />
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => onSelect(article.id)}
        >
          <div className="text-xs font-semibold text-slate-900 truncate">
            {article.title}
          </div>
        </div>
      </div>

      {/* Locale badge + position */}
      <div className="flex items-center gap-2 mb-2">
        <Badge variant={locale.stage === "in_progress" ? "info" : locale.stage === "in_review" ? "warning" : locale.stage === "monitoring" ? "success" : "default"}>
          {localeFlags[locale.locale] || (locale.locale || "").toUpperCase()}
        </Badge>
        <PositionText position={locale.avgPosition ? Math.round(locale.avgPosition) : null} className="text-sm" />
      </div>

      {/* Review countdown */}
      {locale.stage === "in_review" && reviewDaysLeft !== null && (
        <div className="flex items-center gap-1 mb-2">
          <Clock size={10} className="text-amber-500" />
          <span className="text-[10px] font-semibold text-amber-600">
            {reviewDaysLeft}d remaining
          </span>
        </div>
      )}

      {/* Keywords */}
      <div className="text-[10px] text-slate-400 mb-2">
        {locale.keywordCount || 0} keywords
      </div>

      {/* Actions row */}
      <div
        className="flex items-center gap-1.5 pt-2 border-t border-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Quick note */}
        <button
          onClick={() => onQuickNote(locale.id, article.title)}
          title="Add quick note"
          className="p-1 text-slate-300 hover:text-blue-500 transition-colors"
        >
          <MessageSquare size={12} />
        </button>

        {/* Stage dots */}
        <span className="text-[9px] text-slate-300 mr-1 ml-auto">Move:</span>
        {STAGES.filter(s => s !== locale.stage).map(s => (
          <button
            key={s}
            onClick={() => onStageChange(locale.id, s)}
            disabled={isChanging}
            title={`Move to ${stageCfg[s].l}`}
            className={`w-3.5 h-3.5 rounded-full border-[1.5px] transition-colors ${
              s === "backlog" ? "border-slate-400 hover:bg-slate-400" :
              s === "in_progress" ? "border-blue-500 hover:bg-blue-500" :
              s === "in_review" ? "border-amber-500 hover:bg-amber-500" :
              s === "monitoring" ? "border-emerald-500 hover:bg-emerald-500" :
              "border-slate-300 hover:bg-slate-300"
            } ${isChanging ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
          />
        ))}
      </div>
    </Card>
  );
}

// Quick note inline form
function QuickNoteForm({ localeId, articleTitle, onClose, onSave }) {
  const [text, setText] = useState("");
  const [type, setType] = useState("change");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await onSave(localeId, text.trim(), type);
      onClose();
    } catch (e) {
      console.error("Note save failed:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">Quick Note — {articleTitle}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
        <div className="flex gap-2 mb-3">
          <Select value={type} onChange={e => setType(e.target.value)} className="w-40">
            {Object.entries(noteTypeCfg).map(([k, v]) => (
              <option key={k} value={k}>{v.l}</option>
            ))}
          </Select>
        </div>
        <Input
          value={text}
          onChange={e => setText(typeof e === "string" ? e : e.target.value)}
          placeholder="What changed?"
          className="mb-3"
          onKeyDown={e => { if (e.key === "Enter") handleSave(); }}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !text.trim()}>
            {saving ? "Saving..." : "Add Note"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function WorkbenchView({ articles, onSelectArticle, onRefresh }) {
  const [changingStage, setChangingStage] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterLocale, setFilterLocale] = useState("all");
  const [quickNote, setQuickNote] = useState(null); // { localeId, articleTitle }
  const [activeId, setActiveId] = useState(null);

  // Sensors for drag
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Filters
  const categories = useMemo(() => {
    const cats = new Set(articles.map(a => a.category).filter(Boolean));
    return [...cats].sort();
  }, [articles]);

  const allLocales = useMemo(() => {
    const locs = new Set();
    articles.forEach(a => a.locales?.forEach(l => locs.add(l.locale)));
    return [...locs].sort();
  }, [articles]);

  // Build columns with filtering
  const columns = useMemo(() => {
    const cols = {};
    for (const s of STAGES) cols[s] = [];

    for (const article of articles) {
      // Category filter
      if (filterCategory !== "all" && article.category !== filterCategory) continue;
      // Search filter
      if (search) {
        const q = search.toLowerCase();
        if (!article.title.toLowerCase().includes(q) && !article.slug?.toLowerCase().includes(q)) continue;
      }

      for (const loc of article.locales || []) {
        // Locale filter
        if (filterLocale !== "all" && loc.locale !== filterLocale) continue;
        if (cols[loc.stage]) {
          cols[loc.stage].push({ article, locale: loc });
        }
      }
    }
    return cols;
  }, [articles, search, filterCategory, filterLocale]);

  // Pipeline metrics
  const metrics = useMemo(() => {
    const total = STAGES.reduce((sum, s) => sum + columns[s].length, 0);
    const dailyCrawls = columns.in_progress.length + columns.in_review.length;
    const expiringSoon = columns.in_review.filter(({ locale }) => {
      if (!locale.reviewStartedAt) return false;
      const daysLeft = (locale.reviewDays || 14) - Math.floor((Date.now() - new Date(locale.reviewStartedAt).getTime()) / 86400000);
      return daysLeft <= 3;
    }).length;
    return { total, dailyCrawls, expiringSoon };
  }, [columns]);

  // Stage change
  const changeStage = async (localeId, newStage) => {
    setChangingStage(localeId);
    try {
      await api(`/articles/0/locales/${localeId}/stage`, {
        method: "PUT",
        body: JSON.stringify({ stage: newStage }),
      });
      onRefresh();
    } catch (e) {
      console.error("Failed to change stage:", e);
    } finally {
      setChangingStage(null);
    }
  };

  // Quick note save
  const saveQuickNote = async (localeId, text, type) => {
    await api(`/urls/${localeId}/notes`, {
      method: "POST",
      body: JSON.stringify({
        text,
        type,
        createdAt: new Date().toISOString(),
        reviewDays: 21,
      }),
    });
    onRefresh();
  };

  // Drag and drop
  const findCardData = (id) => {
    for (const stage of STAGES) {
      const item = columns[stage].find(({ locale }) => locale.id === id);
      if (item) return { ...item, stage };
    }
    return null;
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeCard = findCardData(active.id);
    const overStage = over.id; // droppable id = stage name

    if (activeCard && overStage && STAGES.includes(overStage) && activeCard.stage !== overStage) {
      changeStage(active.id, overStage);
    }
  };

  // Column header config
  const headerBg = {
    backlog: "bg-slate-50", in_progress: "bg-blue-50", in_review: "bg-amber-50",
    monitoring: "bg-emerald-50", parked: "bg-slate-50",
  };
  const headerText = {
    backlog: "text-slate-600", in_progress: "text-blue-700", in_review: "text-amber-700",
    monitoring: "text-emerald-700", parked: "text-slate-500",
  };
  const countBg = {
    backlog: "bg-slate-200 text-slate-600", in_progress: "bg-blue-200 text-blue-700",
    in_review: "bg-amber-200 text-amber-700", monitoring: "bg-emerald-200 text-emerald-700",
    parked: "bg-slate-200 text-slate-500",
  };
  const crawlFrequency = {
    backlog: "Checked monthly",
    in_progress: "Checked daily",
    in_review: "Checked daily · auto-expires",
    monitoring: "Checked weekly",
    parked: "Not checked",
  };

  const activeCard = activeId ? findCardData(activeId) : null;

  return (
    <div className="space-y-4">
      {/* Pipeline metrics */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Total:</span>
          <span className="font-bold text-slate-700">{metrics.total} items</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Daily crawls:</span>
          <span className="font-bold text-blue-600">{metrics.dailyCrawls}</span>
        </div>
        {metrics.expiringSoon > 0 && (
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-amber-500" />
            <span className="font-bold text-amber-600">{metrics.expiringSoon} expiring soon</span>
          </div>
        )}
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search articles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9 w-48"
          />
        </div>
        <Select
          options={[{ value: "all", label: "All Categories" }, ...categories.map(c => ({ value: c, label: c }))]}
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
        />
        <Select
          options={[{ value: "all", label: "All Locales" }, ...allLocales.map(l => ({ value: l, label: localeFlags[l] || l.toUpperCase() }))]}
          value={filterLocale}
          onChange={e => setFilterLocale(e.target.value)}
        />
      </div>

      {/* Kanban columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4 min-h-[60vh]">
          {STAGES.map(stage => (
            <DroppableColumn key={stage} id={stage}>
              <div className="flex-1 min-w-[220px] max-w-[280px] flex flex-col">
                {/* Column header */}
                <div className={`px-3 py-2.5 rounded-lg mb-3 ${headerBg[stage]}`}>
                  <div className="flex items-center gap-2">
                    <StageDot stage={stage} size="md" />
                    <span className={`text-xs font-bold uppercase tracking-wide ${headerText[stage]}`}>
                      {stageCfg[stage].l}
                    </span>
                    <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${countBg[stage]}`}>
                      {columns[stage].length}
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1 pl-5">
                    {crawlFrequency[stage]}
                  </div>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 flex-1">
                  {columns[stage].map(({ article, locale }) => (
                    <DraggableCard key={`${article.id}-${locale.locale}`} id={locale.id}>
                      <WorkbenchCard
                        article={article}
                        locale={locale}
                        onSelect={onSelectArticle}
                        onStageChange={changeStage}
                        changingStage={changingStage}
                        onQuickNote={(localeId, title) => setQuickNote({ localeId, articleTitle: title })}
                      />
                    </DraggableCard>
                  ))}

                  {columns[stage].length === 0 && (
                    <div className="flex-1 flex items-center justify-center rounded-lg border border-dashed border-slate-200 min-h-[100px]">
                      <span className="text-[11px] text-slate-300">Drop here</span>
                    </div>
                  )}
                </div>
              </div>
            </DroppableColumn>
          ))}
        </div>

        <DragOverlay>
          {activeCard && (
            <div className="w-[260px]">
              <WorkbenchCard
                article={activeCard.article}
                locale={activeCard.locale}
                onSelect={() => {}}
                onStageChange={() => {}}
                changingStage={null}
                onQuickNote={() => {}}
                isDragging
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Quick note modal */}
      {quickNote && (
        <QuickNoteForm
          localeId={quickNote.localeId}
          articleTitle={quickNote.articleTitle}
          onClose={() => setQuickNote(null)}
          onSave={saveQuickNote}
        />
      )}
    </div>
  );
}

// Droppable column wrapper
function DroppableColumn({ id, children }) {
  const { useDroppable } = require("@dnd-kit/core");
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`transition-colors ${isOver ? "bg-blue-50/50 rounded-lg" : ""}`}
    >
      {children}
    </div>
  );
}

// Draggable card wrapper
function DraggableCard({ id, children }) {
  const { useDraggable } = require("@dnd-kit/core");
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });

  const style = transform ? {
    transform: `translate(${transform.x}px, ${transform.y}px)`,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}
