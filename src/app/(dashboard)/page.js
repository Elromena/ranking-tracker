"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/services";
import { Spinner } from "@/components/ui";
import DashboardView from "../views/dashboard";
import ArticleModal from "../views/dashboard/article-modal";

export default function DashboardPage() {
  const router = useRouter();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editArticle, setEditArticle] = useState(null);

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

  const handleAdd = async (data) => {
    await api("/articles", { method: "POST", body: JSON.stringify(data) });
    loadData();
  };

  const handleEdit = async (data) => {
    await api(`/articles/${editArticle.id}`, { method: "PUT", body: JSON.stringify(data) });
    setEditArticle(null);
    loadData();
  };

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-xs text-slate-400 mt-0.5">All tracked articles and their locale performance</p>
      </div>

      <DashboardView
        articles={articles}
        onSelectArticle={(id) => router.push(`/articles/${id}`)}
        onAddArticle={() => setShowAddModal(true)}
        loading={loading}
        onRefresh={loadData}
      />

      <ArticleModal open={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleAdd} />
      <ArticleModal open={!!editArticle} onClose={() => setEditArticle(null)} onSave={handleEdit} article={editArticle} />
    </>
  );
}
