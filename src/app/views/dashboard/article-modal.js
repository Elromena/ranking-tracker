import Btn from "@/component/btn";
import Input from "@/component/input";
import Modal from "@/component/modal";
import Select from "@/component/select";
import { api } from "@/lib/services";
import { useEffect, useState } from "react";

// ── Article Modal ──────────────────────────────────────────
export default function ArticleModal({ open, onClose, onSave, article }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCat] = useState("");
  const [priority, setPri] = useState("medium");
  const [keywords, setKws] = useState([]);
  const [newKw, setNewKw] = useState("");
  const [newIntent, setNewIntent] = useState("commercial");
  const [categories, setCategories] = useState([]);

  const fetchCategories = async () => {
    api("/admin/categories").then((d) => {
      setCategories(d);
    });
  };

  useEffect(() => {
    if (article) {
      setUrl(article.url || "");
      setTitle(article.title || "");
      setCat(article.category || "Advertising");
      setPri(article.priority || "medium");
      setKws(article.keywords || []);
    } else {
      setUrl("");
      setTitle("");
      setCat("");
      setPri("medium");
      setKws([]);
      setNewKw("");
    }
    if (open) {
      fetchCategories();
    }
  }, [article, open]);

  const addKw = () => {
    if (!newKw.trim()) return;
    setKws([
      ...keywords,
      {
        keyword: newKw.trim().toLowerCase(),
        source: "manual",
        intent: newIntent,
        tracked: true,
      },
    ]);
    setNewKw("");
  };
  const options = categories?.map((item) => ({ v: item.name, l: item.name }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={article ? "Edit Article" : "Add New Article"}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Input
          label="Article URL"
          value={url}
          onChange={setUrl}
          placeholder="https://blockchain-ads.com/blog/..."
        />
        <Input
          label="Title"
          value={title}
          onChange={setTitle}
          placeholder="e.g. Web3 Advertising Guide"
        />
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <Select
            label="Category"
            value={category}
            onChange={setCat}
            options={options}
          />
          <Select
            label="Priority"
            value={priority}
            onChange={setPri}
            options={[
              { v: "high", l: "High" },
              { v: "medium", l: "Medium" },
              { v: "low", l: "Low" },
              { v: "urgent", l: "🔴 Urgent" },
            ]}
          />
        </div>
        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
            Keywords ({keywords.length})
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              value={newKw}
              onChange={(e) => setNewKw(e.target.value)}
              placeholder="Add keyword..."
              onKeyDown={(e) => e.key === "Enter" && addKw()}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 8,
                border: "1.5px solid #e2e8f0",
                fontSize: 13,
                fontFamily: "inherit",
              }}
            />
            <select
              value={newIntent}
              onChange={(e) => setNewIntent(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1.5px solid #e2e8f0",
                fontSize: 12,
                background: "#fff",
              }}
            >
              <option value="commercial">Commercial</option>
              <option value="informational">Informational</option>
              <option value="transactional">Transactional</option>
            </select>
            <Btn onClick={addKw} size="sm">
              Add
            </Btn>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              maxHeight: 220,
              overflowY: "auto",
            }}
          >
            {keywords.map((k, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "#f8fafc",
                  border: "1px solid #f1f5f9",
                }}
              >
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: 500,
                    color: k.tracked ? "#0f172a" : "#94a3b8",
                  }}
                >
                  {k.keyword}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: k.source === "manual" ? "#f1f5f9" : "#eff6ff",
                    color: k.source === "manual" ? "#64748b" : "#2563eb",
                    fontWeight: 600,
                  }}
                >
                  {k.source === "manual" ? "Manual" : "GSC"}
                </span>
                <button
                  onClick={() =>
                    setKws(
                      keywords.map((x, j) =>
                        j === i ? { ...x, tracked: !x.tracked } : x,
                      ),
                    )
                  }
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 14,
                    color: k.tracked ? "#059669" : "#94a3b8",
                  }}
                >
                  {k.tracked ? "✓" : "○"}
                </button>
                <button
                  onClick={() => setKws(keywords.filter((_, j) => j !== i))}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    color: "#dc2626",
                    fontWeight: 700,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
            {keywords.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: 20,
                  color: "#94a3b8",
                  fontSize: 12,
                }}
              >
                No keywords yet.
              </div>
            )}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            borderTop: "1px solid #f1f5f9",
            paddingTop: 16,
          }}
        >
          <Btn variant="secondary" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            onClick={() => {
              onSave({ url, title, category, priority, keywords });
              onClose();
            }}
          >
            {article ? "Save Changes" : "Add Article"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
