"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/services";
import { Spinner } from "@/components/ui";
import WorkbenchView from "../../views/workbench";

export default function WorkbenchPage() {
  const router = useRouter();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/articles");
      setArticles(data);
    } catch (e) {
      console.error("Failed to load articles:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <>
        <div className="mb-5">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Workbench</h1>
          <p className="text-xs text-slate-400 mt-0.5">Active work pipeline — drag articles through stages</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Spinner size={24} className="text-slate-400" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Workbench</h1>
        <p className="text-xs text-slate-400 mt-0.5">Active work pipeline — drag articles through stages</p>
      </div>

      <WorkbenchView
        articles={articles}
        onSelectArticle={(id) => router.push(`/articles/${id}`)}
        onRefresh={loadData}
      />
    </>
  );
}
