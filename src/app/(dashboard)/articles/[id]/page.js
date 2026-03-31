"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/services";
import ArticleDetailView from "../../../views/detail";
import ArticleModal from "../../../views/dashboard/article-modal";

export default function ArticleDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [editArticle, setEditArticle] = useState(null);

  const handleEdit = async (data) => {
    await api(`/articles/${editArticle.id}`, { method: "PUT", body: JSON.stringify(data) });
    setEditArticle(null);
  };

  const handleDelete = async (articleId) => {
    await api(`/articles/${articleId}`, { method: "DELETE" });
    router.push("/");
  };

  return (
    <>
      <ArticleDetailView
        articleId={parseInt(id)}
        onBack={() => router.push("/")}
        onEdit={setEditArticle}
        onDelete={handleDelete}
      />

      <ArticleModal
        open={!!editArticle}
        onClose={() => setEditArticle(null)}
        onSave={handleEdit}
        article={editArticle}
      />
    </>
  );
}
