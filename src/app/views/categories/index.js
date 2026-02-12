import { Loader } from "@/app/page";
import { api } from "@/lib/services";
import { useEffect, useState } from "react";

export const CategoriesAdmin = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [delLoading, setDelLoading] = useState(false);

  const fetchCategories = async () => {
    api("/admin/categories").then((d) => {
      setCategories(d);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const addCategory = async () => {
    if (!name.trim()) return;

    setLoading(true);
    await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    setName("");
    setLoading(false);
    fetchCategories();
  };

  const deleteCategory = async (id) => {
    setSelected(id);
    setDelLoading(true);
    await fetch(`/api/admin/categories/${id}`, {
      method: "DELETE",
    });
    setDelLoading(false);

    fetchCategories();
  };

  return (
    <div className="max-w-md space-y-4">
      <div className="flex gap-2">
        <input
          className="border px-3 py-2 flex-1"
          placeholder="New category"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          onClick={addCategory}
          disabled={loading}
          className={`${loading ? "disbled:bg-black/40" : "bg-black"}  text-white px-4`}
        >
          {loading ? "Please wait" : "Add"}
        </button>
      </div>

      <ul className="space-y-2">
        {categories.map((cat) => (
          <li
            key={cat.id}
            className="flex justify-between items-center rounded-lg shadow-sm border px-3 py-2"
          >
            <span>{cat.name}</span>
            <button
              onClick={() => deleteCategory(cat.id)}
              className="text-red-500"
            >
              {delLoading && selected === cat.id ? <Loader /> : "Delete"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
