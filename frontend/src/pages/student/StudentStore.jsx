import { useEffect, useState, useCallback } from "react";
import { api, API } from "../../lib/api";
import { toast } from "sonner";
import { Package } from "lucide-react";

export default function StudentStore() {
  const [items, setItems] = useState([]);
  const [me, setMe] = useState(null);

  const load = useCallback(async () => {
    const [i, m] = await Promise.all([
      api.get("/store/items"),
      api.get("/me/student"),
    ]);

    setItems(i.data);
    setMe(m.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const buy = async (it) => {
    if (!confirm(`Buy ${it.name} for $${it.price}?`)) return;

    try {
      await api.post("/store/purchase", {
        item_id: it.item_id,
      });

      toast.success(`Got ${it.name}! 🎉`);

      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-bold text-3xl">
          Classroom Store
        </h2>

        {me && (
          <div className="card-brutal bg-yellow-300 px-4 py-2 font-bold">
            Balance: ${me.student.balance.toFixed(2)}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((it) => {
          const can =
            me &&
            me.student.balance >= it.price &&
            it.stock !== 0;

          return (
            <div
              key={it.item_id}
              className="card-brutal bg-white overflow-hidden"
            >
              <div className="aspect-video bg-yellow-100 grid place-items-center border-b-[3px] border-black">
                {it.image_path ? (
                  <img
  src={it.image_path}
  alt={it.name}
  className="w-full h-full object-cover"
/>
                ) : (
                  <Package
                    className="w-12 h-12 text-black/30"
                    strokeWidth={3}
                  />
                )}
              </div>

              <div className="p-4">
                <div className="font-bold text-lg">
                  {it.name}
                </div>

                <div className="text-sm text-black/70 mt-0.5 line-clamp-2 min-h-10">
                  {it.description}
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="font-bold text-2xl">
                    ${it.price}
                  </div>

                  <button
                    data-testid={`buy-${it.item_id}`}
                    onClick={() => buy(it)}
                    disabled={!can}
                    className={`btn-brutal text-sm ${
                      !can
                        ? "opacity-50 cursor-not-allowed"
                        : "bg-green-300"
                    }`}
                  >
                    {it.stock === 0 ? "Sold out" : "Buy"}
                  </button>
                </div>

                {it.stock >= 0 && (
                  <div className="text-xs text-black/50 mt-1">
                    {it.stock} left
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="col-span-3 text-center py-12 font-bold text-black/50">
            No items in the store yet
          </div>
        )}
      </div>
    </div>
  );
}
