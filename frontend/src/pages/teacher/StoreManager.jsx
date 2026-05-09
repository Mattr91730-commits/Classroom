import { useEffect, useState, useCallback } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Pencil,
  ImagePlus,
  Package,
} from "lucide-react";

export default function StoreManager() {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);

  const sym = user?.currency_symbol || "$";

  const load = useCallback(async () => {
    const response = await api.get("/store/items");
    setItems(response.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (data) => {
    if (data.item_id) {
      await api.put(`/store/items/${data.item_id}`, data);
    } else {
      await api.post("/store/items", data);
    }

    toast.success("Saved");

    setEditing(null);

    load();
  };

  const del = async (id) => {
    if (!confirm("Delete item?")) return;

    await api.delete(`/store/items/${id}`);

    load();
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-teacher-heading text-3xl font-bold text-slate-900">
          Classroom Store
        </h1>

        <button
          data-testid="new-item-btn"
          onClick={() =>
            setEditing({
              name: "",
              description: "",
              price: 5,
              stock: -1,
              image_path: null,
            })
          }
          className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New item
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => (
          <div
            key={it.item_id}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden"
          >
            <div className="aspect-video bg-slate-100 grid place-items-center">
              {it.image_path ? (
                <img
                  src={it.image_path}
                  alt={it.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-10 h-10 text-slate-300" />
              )}
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-teacher-heading font-semibold text-slate-900">
                    {it.name}
                  </div>

                  <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                    {it.description}
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    data-testid={`edit-item-${it.item_id}`}
                    onClick={() => setEditing(it)}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    data-testid={`delete-item-${it.item_id}`}
                    onClick={() => del(it.item_id)}
                    className="p-1.5 hover:bg-red-50 rounded text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="font-teacher-heading font-bold text-slate-900">
                  {sym}
                  {it.price}
                </span>

                <span className="text-slate-500">
                  {it.stock < 0
                    ? "∞ stock"
                    : `${it.stock} left`}
                </span>
              </div>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="col-span-3 text-center py-12 text-slate-400">
            No items yet
          </div>
        )}
      </div>

      {editing && (
        <ItemEditor
          item={editing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function ItemEditor({ item, onClose, onSave }) {
  const [data, setData] = useState(item);

  const [uploading, setUploading] = useState(false);

  const upload = async (file) => {
    setUploading(true);

    const fd = new FormData();

    fd.append("file", file);

    try {
      const r = await api.post("/upload", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setData({
        ...data,
        image_path: r.data.path,
      });

      toast.success("Uploaded");
    } catch {
      toast.error("Upload failed");
    }

    setUploading(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-6 w-full max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-teacher-heading text-xl font-bold mb-4">
          {item.item_id ? "Edit item" : "New item"}
        </h3>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Name">
            <input
              data-testid="item-name"
              value={data.name}
              onChange={(e) =>
                setData({
                  ...data,
                  name: e.target.value,
                })
              }
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Price">
            <input
              data-testid="item-price"
              type="number"
              value={data.price}
              onChange={(e) =>
                setData({
                  ...data,
                  price: Number(e.target.value),
                })
              }
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Stock (-1 = unlimited)">
            <input
              type="number"
              value={data.stock}
              onChange={(e) =>
                setData({
                  ...data,
                  stock: Number(e.target.value),
                })
              }
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Image">
            <label className="cursor-pointer inline-flex items-center gap-2 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <ImagePlus className="w-4 h-4" />

              {uploading ? "Uploading…" : "Upload"}

              <input
                type="file"
                accept="image/*"
                hidden
                data-testid="item-image-input"
                onChange={(e) =>
                  e.target.files?.[0] &&
                  upload(e.target.files[0])
                }
              />
            </label>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Description">
              <textarea
                value={data.description}
                onChange={(e) =>
                  setData({
                    ...data,
                    description: e.target.value,
                  })
                }
                rows={2}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              />
            </Field>
          </div>

          {data.image_path && (
            <div className="sm:col-span-2">
              <img
                src={data.image_path}
                alt="preview"
                className="rounded-lg max-h-40 object-cover"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600"
          >
            Cancel
          </button>

          <button
            data-testid="save-item-btn"
            onClick={() => onSave(data)}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-1 font-medium">
        {label}
      </div>

      {children}
    </div>
  );
}
