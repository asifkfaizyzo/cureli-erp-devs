// src/components/verify/ShopList.jsx
import { useMemo } from "react";
import { motion } from "framer-motion";

/**
 * files: array of shopFile rows with shop included
 * We group by shop and show a compact line per shop
 */
const ShopList = ({ files = [], loading, onSelectShop, page, perPage, setPage, total, selectedShopId }) => {
  // Group files by shop
  const shops = useMemo(() => {
    const map = new Map();
    files.forEach((f) => {
      const s = f.shop;
      if (!s) return;
      if (!map.has(s.shop_id)) map.set(s.shop_id, { shop: s, files: [] });
      map.get(s.shop_id).files.push(f);
    });
    return Array.from(map.values());
  }, [files]);

  const totalPages = Math.max(1, Math.ceil((total || shops.length) / perPage));

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">Loading…</div>
        ) : shops.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">No shops</div>
        ) : (
          <div className="flex flex-col gap-3">
            {shops.map(({ shop, files }) => (
              <motion.button
                key={shop.shop_id}
                onClick={() => onSelectShop({ ...shop, files })}
                whileHover={{ scale: 1.01 }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition
                  ${selectedShopId === shop.shop_id ? "ring-2 ring-[#000060] bg-[#F7F7FF]" : "hover:bg-gray-50"}`}
              >
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
                  {shop.business_name?.slice(0,2).toUpperCase()}
                </div>

                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-800">{shop.business_name}</div>
                  <div className="text-xs text-gray-500">{shop.city} • {files.length} docs</div>
                </div>

                <div className="text-sm text-gray-600">{files.filter(f=>f.status==="rejected").length}✘</div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* pagination controls (fits non-scrolling UI) */}
      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-gray-500">Page {page} / {totalPages}</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            className="px-3 py-1 rounded-md bg-white border"
            disabled={page <= 1}
          >
            Prev
          </button>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            className="px-3 py-1 rounded-md bg-white border"
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopList;
