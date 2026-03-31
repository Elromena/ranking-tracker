"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, X } from "lucide-react";
import { Modal, Button, Input, Select, Badge } from "@/components/ui";
import api from "@/lib/services";
import { localeFlags } from "@/lib/utils";

const INTENTS = [
  { value: "commercial", label: "Commercial" },
  { value: "informational", label: "Informational" },
  { value: "transactional", label: "Transactional" },
  { value: "navigational", label: "Navigational" },
];

function LocaleSection({ locale, index, onUpdate, onRemove, canRemove, localeConfigs }) {
  const [expanded, setExpanded] = useState(true);
  const [newKw, setNewKw] = useState("");
  const [newIntent, setNewIntent] = useState("commercial");

  const update = (field, value) => {
    onUpdate(index, { ...locale, [field]: value });
  };

  const addKeyword = () => {
    const trimmed = newKw.trim().toLowerCase();
    if (!trimmed) return;
    const next = [
      ...(locale.keywords || []),
      { keyword: trimmed, source: "manual", intent: newIntent, tracked: true },
    ];
    onUpdate(index, { ...locale, keywords: next });
    setNewKw("");
    setNewIntent("commercial");
  };

  const removeKeyword = (ki) => {
    const next = locale.keywords.filter((_, i) => i !== ki);
    onUpdate(index, { ...locale, keywords: next });
  };

  const localeLabel = locale.locale
    ? localeFlags[locale.locale] || locale.locale.toUpperCase()
    : `Locale ${index + 1}`;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="flex w-full items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-slate-700">
            {localeLabel}
          </span>
          {locale.url && (
            <span className="text-xs text-slate-400 truncate max-w-[200px] hidden sm:inline">
              {locale.url}
            </span>
          )}
          <span className="text-xs text-slate-400">
            {locale.keywords?.length || 0} keyword{(locale.keywords?.length || 0) !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canRemove && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(index);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation();
                  onRemove(index);
                }
              }}
              className="text-red-400 hover:text-red-600 p-1 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Locale
              </label>
              <Select
                value={locale.locale || ""}
                onChange={(e) => update("locale", e.target.value)}
                className="w-full"
              >
                <option value="">Select locale</option>
                {localeConfigs.map((lc) => (
                  <option key={lc.locale || lc.id} value={lc.locale || lc.id}>
                    {lc.displayName
                      ? `${lc.displayName} (${(lc.locale || lc.id).toUpperCase()})`
                      : (localeFlags[lc.locale || lc.id] || (lc.locale || lc.id).toUpperCase())}
                  </option>
                ))}
                {locale.locale &&
                  !localeConfigs.find((lc) => (lc.locale || lc.id) === locale.locale) && (
                    <option value={locale.locale}>
                      {localeFlags[locale.locale] || locale.locale.toUpperCase()}
                    </option>
                  )}
              </Select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                URL
              </label>
              <Input
                value={locale.url || ""}
                onChange={(e) => update("url", typeof e === "string" ? e : e.target.value)}
                placeholder="https://example.com/page"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Page Title
            </label>
            <Input
              value={locale.title || ""}
              onChange={(e) => update("title", typeof e === "string" ? e : e.target.value)}
              placeholder="Locale-specific title"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">
              Keywords ({locale.keywords?.length || 0})
            </label>
            <div className="flex gap-2 mb-3">
              <Input
                value={newKw}
                onChange={(e) => setNewKw(typeof e === "string" ? e : e.target.value)}
                placeholder="Add keyword..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
              />
              <Select
                value={newIntent}
                onChange={(e) => setNewIntent(e.target.value)}
                className="w-36"
              >
                {INTENTS.map((i) => (
                  <option key={i.value} value={i.value}>
                    {i.label}
                  </option>
                ))}
              </Select>
              <Button onClick={addKeyword} variant="secondary" className="shrink-0">
                Add
              </Button>
            </div>

            {locale.keywords && locale.keywords.length > 0 ? (
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                {locale.keywords.map((kw, ki) => (
                  <div
                    key={ki}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-100"
                  >
                    <span className="flex-1 text-sm font-medium text-slate-700 truncate">
                      {kw.keyword}
                    </span>
                    <Badge className="text-xs shrink-0">{kw.intent}</Badge>
                    <button
                      type="button"
                      onClick={() => removeKeyword(ki)}
                      className="text-red-400 hover:text-red-600 transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No keywords added yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ArticleModal({ open, onClose, onSave, article }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [locales, setLocales] = useState([
    { locale: "en", url: "", title: "", keywords: [] },
  ]);
  const [categories, setCategories] = useState([]);
  const [localeConfigs, setLocaleConfigs] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    api("/admin/categories")
      .then((data) => setCategories(Array.isArray(data) ? data : data?.categories || []))
      .catch(() => setCategories([]));

    api("/locale-configs")
      .then((data) => setLocaleConfigs(Array.isArray(data) ? data : data?.locales || []))
      .catch(() => setLocaleConfigs([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (article) {
      setTitle(article.title || "");
      setCategory(article.category || "");
      if (article.locales?.length > 0) {
        setLocales(
          article.locales.map((l) => ({
            locale: l.locale,
            url: l.url || "",
            title: l.title || "",
            keywords: l.keywords || [],
          }))
        );
      } else {
        setLocales([{ locale: "en", url: "", title: "", keywords: [] }]);
      }
    } else {
      setTitle("");
      setCategory("");
      setLocales([{ locale: "en", url: "", title: "", keywords: [] }]);
    }
  }, [article, open]);

  const updateLocale = useCallback((index, data) => {
    setLocales((prev) => prev.map((l, i) => (i === index ? data : l)));
  }, []);

  const removeLocale = useCallback((index) => {
    setLocales((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const addLocale = () => {
    const used = new Set(locales.map((l) => l.locale));
    const next = localeConfigs.find((lc) => !used.has(lc.locale));
    setLocales((prev) => [
      ...prev,
      { locale: next?.locale || "", url: "", title: "", keywords: [] },
    ]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        title,
        category,
        locales: locales.map((l) => ({
          locale: l.locale,
          url: l.url,
          title: l.title || title,
          keywords: l.keywords,
        })),
      });
      onClose();
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const catOptions = categories?.map((item) => ({
    value: item.name || item.slug || item.id || item,
    label: item.name || item.label || item,
  })) || [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={article ? "Edit Article" : "Add New Article"}
    >
      <div className="flex flex-col max-h-[80vh]">
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Article Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(typeof e === "string" ? e : e.target.value)}
                placeholder="e.g. Web3 Advertising Guide"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Category
              </label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full"
              >
                <option value="">Select category</option>
                {catOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Locale Variants */}
          <div className="border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Locale Variants ({locales.length})
              </h3>
              <Button
                onClick={addLocale}
                variant="secondary"
                size="sm"
                className="gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Locale
              </Button>
            </div>

            <div className="space-y-3">
              {locales.map((locale, idx) => (
                <LocaleSection
                  key={idx}
                  locale={locale}
                  index={idx}
                  onUpdate={updateLocale}
                  onRemove={removeLocale}
                  canRemove={locales.length > 1}
                  localeConfigs={localeConfigs}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? "Saving..." : article ? "Save Changes" : "Add Article"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
