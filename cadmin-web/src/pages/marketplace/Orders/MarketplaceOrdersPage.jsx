// src/pages/marketplace/Orders/MarketplaceOrdersPage.jsx

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  RefreshCw,
  ShoppingBag,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  ChevronRight,
  X,
} from "lucide-react";

// ── Status config ──────────────────────────────────────────
const ORDER_STATUS = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "bg-amber-50 text-amber-700 border-amber-100",
    dot: "bg-amber-500",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    color: "bg-blue-50 text-blue-700 border-blue-100",
    dot: "bg-blue-500",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    icon: Truck,
    color: "bg-violet-50 text-violet-700 border-violet-100",
    dot: "bg-violet-500",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle2,
    color: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "bg-red-50 text-red-700 border-red-100",
    dot: "bg-red-500",
  },
};

const StatusBadge = ({ status }) => {
  const cfg = ORDER_STATUS[status] || {
    label: status,
    color: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ── Skeleton ───────────────────────────────────────────────
const TableSkeleton = ({ rows = 8 }) => (
  <tbody>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} className="border-b border-gray-50">
        {Array.from({ length: 6 }).map((__, j) => (
          <td key={j} className="px-4 py-3">
            <div className="h-4 bg-gray-100 rounded animate-pulse" />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

// ── Empty state ────────────────────────────────────────────
const EmptyState = ({ query }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <Package size={40} className="text-gray-200 mb-3" />
    <p className="text-sm font-medium text-gray-500">
      {query ? `No orders found for "${query}"` : "No marketplace orders yet"}
    </p>
    <p className="text-xs text-gray-400 mt-1">
      {query
        ? "Try a different search term"
        : "Orders placed through the app will appear here"}
    </p>
  </div>
);

// ── Filter tabs ────────────────────────────────────────────
const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "out_for_delivery", label: "In Transit" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

// ── Main ───────────────────────────────────────────────────
const MarketplaceOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchOrders = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      try {
        // TODO: replace with real API
        // const res = await fetchMarketplaceOrders({
        //   page, search, status: statusFilter === "all" ? undefined : statusFilter
        // });
        // setOrders(res.data.orders);
        // setTotalPages(res.data.total_pages);
        // setTotalCount(res.data.total_count);

        await new Promise((r) => setTimeout(r, 700));
        setOrders([]);
        setTotalPages(1);
        setTotalCount(0);
      } catch (err) {
        console.error("Failed to fetch marketplace orders:", err);
        setOrders([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, search, statusFilter]
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setPage(1);
    setSelectedOrder(null);
  }, [search, statusFilter]);

  return (
    <div className="p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Marketplace Orders
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? "Loading..." : `${totalCount} total orders`}
          </p>
        </div>
        <button
          onClick={() => fetchOrders({ silent: true })}
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

      {/* Status tabs */}
      <div className="flex items-center gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
              statusFilter === tab.key
                ? "bg-white text-[#05015A] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search by order ID or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]/40 bg-white"
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

      {/* Table */}
      <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                {[
                  "Order ID",
                  "Customer",
                  "Items",
                  "Amount",
                  "Status",
                  "Date",
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
              <TableSkeleton rows={8} />
            ) : orders.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={7}>
                    <EmptyState query={search} />
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {orders.map((order) => {
                  const isSelected = selectedOrder?.id === order.id;
                  return (
                    <tr
                      key={order.id}
                      onClick={() =>
                        setSelectedOrder(isSelected ? null : order)
                      }
                      className={`border-b border-gray-50 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#05015A]/[0.03]"
                          : "hover:bg-gray-50/70"
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        #{order.id}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {order.customer_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {order.item_count ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-medium">
                        {order.total != null
                          ? `₹${Number(order.total).toLocaleString("en-IN")}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight
                          size={14}
                          className={`transition-colors ${
                            isSelected ? "text-[#05015A]" : "text-gray-300"
                          }`}
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              Page {page} of {totalPages}
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
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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

export default MarketplaceOrdersPage;