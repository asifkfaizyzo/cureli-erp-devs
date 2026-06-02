// cadmin-web/src/pages/marketplace/Shops/MarketplaceShopsPage.jsx

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  RefreshCw,
  Store,
  ChevronRight,
  X,
  CheckCircle2,
  XCircle,
  Layers,
} from "lucide-react";
import {
  getMarketplaceShops,
  getMarketplaceShopById,
} from "../../../api/cadminMarketplaceShops";
import ShopDetailView from "./ShopDetailView";

// ── Helpers ────────────────────────────────────────────────────
const fmt = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ── Marketplace status badge ───────────────────────────────────
const MPBadge = ({ status }) => {
  const cfg = {
    NOT_STARTED: { label: "Not Started", cls: "bg-gray-100 text-gray-500" },
    DRAFT: { label: "Draft", cls: "bg-amber-50 text-amber-700" },
    LIVE: { label: "Live", cls: "bg-emerald-50 text-emerald-700" },
    SUSPENDED: { label: "Suspended", cls: "bg-red-50 text-red-700" },
  }[status] || { label: "—", cls: "bg-gray-100 text-gray-500" };

  return (
    <span
      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
};

// ── Table skeleton ─────────────────────────────────────────────
const TableSkeleton = ({ rows = 10 }) => (
  <tbody>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} className="border-b border-gray-50">
        {Array.from({ length: 5 }).map((__, j) => (
          <td key={j} className="px-4 py-3">
            <div className="h-4 bg-gray-100 rounded animate-pulse" />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

// ── Empty ──────────────────────────────────────────────────────
const EmptyState = ({ query }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <Store size={38} className="text-gray-200 mb-3" />
    <p className="text-sm font-medium text-gray-500">
      {query ? `No shops found for "${query}"` : "No shops found"}
    </p>
    <p className="text-xs text-gray-400 mt-1">
      {query ? "Try a different search term" : "Shops will appear here"}
    </p>
  </div>
);

// ── Status filter tabs ─────────────────────────────────────────
const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Blocked" },
];

const MP_TABS = [
  { key: "", label: "Any" },
  { key: "LIVE", label: "Live" },
  { key: "DRAFT", label: "Draft" },
  { key: "NOT_STARTED", label: "Not Started" },
  { key: "SUSPENDED", label: "Suspended" },
];

// ── Main page ──────────────────────────────────────────────────
const MarketplaceShopsPage = () => {
  // List state
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [mpFilter, setMpFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 20;

  // Detail state
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [shopDetail, setShopDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Debounce search ──
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, mpFilter]);

  // ── Fetch list ──
  const fetchShops = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const res = await getMarketplaceShops({
          page,
          limit: PAGE_SIZE,
          search: debouncedSearch,
          status: statusFilter,
          marketplace_status: mpFilter,
        });
        const d = res.data?.data;
        setShops(d?.shops || []);
        setTotalPages(d?.total_pages || 1);
        setTotalCount(d?.total || 0);
      } catch {
        setShops([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, debouncedSearch, statusFilter, mpFilter]
  );

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  // ── Fetch detail ──
  const fetchDetail = useCallback(async (shopId) => {
    setDetailLoading(true);
    setShopDetail(null);
    try {
      const res = await getMarketplaceShopById(shopId);
      setShopDetail(res.data?.data || null);
    } catch {
      setShopDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleSelectShop = (shop) => {
    setSelectedShopId(shop.shop_id);
    fetchDetail(shop.shop_id);
  };

  const handleBack = () => {
    setSelectedShopId(null);
    setShopDetail(null);
    // Refresh list in case something changed
    fetchShops({ silent: true });
  };

  const handleRefreshDetail = () => {
    if (selectedShopId) fetchDetail(selectedShopId);
  };

  // ── Detail view (full screen inside layout) ──
  if (selectedShopId) {
    return (
      <ShopDetailView
        shop={shopDetail}
        loading={detailLoading}
        onBack={handleBack}
        onRefresh={handleRefreshDetail}
      />
    );
  }

  // ── List view ──
  return (
    <div className="flex flex-col h-full p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Marketplace Shops
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading
              ? "Loading..."
              : `${totalCount.toLocaleString()} shop${
                  totalCount !== 1 ? "s" : ""
                }`}
          </p>
        </div>
        <button
          onClick={() => fetchShops({ silent: true })}
          disabled={refreshing || loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            className={refreshing ? "animate-spin" : ""}
          />
          <span className="hidden sm:block">Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4 flex-shrink-0">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search shop, city, GST..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]/40 bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Shop status */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setStatusFilter(t.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
                statusFilter === t.key
                  ? "bg-white text-[#05015A] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Marketplace status */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
          <Layers size={13} className="ml-2 text-gray-400" />
          {MP_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setMpFilter(t.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
                mpFilter === t.key
                  ? "bg-white text-[#05015A] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                {[
                  "Shop",
                  "Location",
                  "Marketplace",
                  "Branches",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            {loading ? (
              <TableSkeleton rows={10} />
            ) : shops.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={6}>
                    <EmptyState query={debouncedSearch} />
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {shops.map((shop) => {
                  const initials = shop.business_name
                    ?.split(" ")
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "?";

                  return (
                    <tr
                      key={shop.shop_id}
                      onClick={() => handleSelectShop(shop)}
                      className="border-b border-gray-50 cursor-pointer hover:bg-gray-50/70 transition-colors"
                    >
                      {/* Shop */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#000060] to-[#0a0280] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 truncate max-w-[160px]">
                              {shop.business_name}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {shop.owner?.full_name || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {shop.city || "—"}
                        {shop.state ? `, ${shop.state}` : ""}
                      </td>

                      {/* Marketplace */}
                      <td className="px-4 py-3">
                        <MPBadge
                          status={
                            shop.marketplaceProfile?.marketplace_status
                          }
                        />
                      </td>

                      {/* Branches */}
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {shop._count?.branches ?? 0}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                            shop.is_active
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {shop.is_active ? (
                            <CheckCircle2 size={11} />
                          ) : (
                            <XCircle size={11} />
                          )}
                          {shop.is_active ? "Active" : "Blocked"}
                        </span>
                      </td>

                      {/* Arrow */}
                      <td className="px-4 py-3">
                        <ChevronRight
                          size={14}
                          className="text-gray-300"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
            <p className="text-xs text-gray-500">
              Page {page} of {totalPages} · {totalCount} total
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplaceShopsPage;