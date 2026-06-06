// cadmin-web/src/pages/marketplace/Orders/MarketplaceOrdersPage.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  RefreshCw,
  Package,
  X,
  ChevronRight,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  ShoppingBag,
  Store,
  Building2,
  User,
  MapPin,
  Phone,
  FileText,
  AlertCircle,
  ArrowLeft,
  CreditCard,
  Receipt,
} from "lucide-react";
import {
  getMarketplaceOrders,
  getMarketplaceOrderById,
} from "../../../api/cadminMarketplaceOrders";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const STATUS_CONFIG = {
  PLACED: {
    label: "Placed",
    dot: "bg-amber-500",
    cls: "bg-amber-50 text-amber-700 border-amber-100",
  },
  ACCEPTED: {
    label: "Accepted",
    dot: "bg-blue-500",
    cls: "bg-blue-50 text-blue-700 border-blue-100",
  },
  READY_FOR_PICKUP: {
    label: "Ready",
    dot: "bg-violet-500",
    cls: "bg-violet-50 text-violet-700 border-violet-100",
  },
  COMPLETED: {
    label: "Completed",
    dot: "bg-emerald-500",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  REJECTED: {
    label: "Rejected",
    dot: "bg-red-500",
    cls: "bg-red-50 text-red-700 border-red-100",
  },
  CANCELLED: {
    label: "Cancelled",
    dot: "bg-gray-400",
    cls: "bg-gray-50 text-gray-600 border-gray-100",
  },
};

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "PLACED", label: "Placed" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "READY_FOR_PICKUP", label: "Ready" },
  { key: "COMPLETED", label: "Completed" },
  { key: "REJECTED", label: "Rejected" },
  { key: "CANCELLED", label: "Cancelled" },
];

// Fixed column widths — applied to both <colgroup> instances
const COLS = [
  { key: "order", width: "140px", label: "Order" },
  { key: "customer", width: "180px", label: "Customer" },
  { key: "shop", width: "220px", label: "Shop / Branch" },
  { key: "items", width: "100px", label: "Items" },
  { key: "amount", width: "120px", label: "Amount" },
  { key: "status", width: "120px", label: "Status" },
  { key: "date", width: "120px", label: "Date" },
  { key: "arrow", width: "40px", label: "" },
];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const fmt = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const fmtTime = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const fmtAmount = (n) =>
  `₹${Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ─────────────────────────────────────────────
// REUSABLE COMPONENTS
// ─────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || {
    label: status,
    dot: "bg-gray-400",
    cls: "bg-gray-50 text-gray-600 border-gray-100",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// Shared <colgroup> — ensures both thead and tbody use same widths
const TableColGroup = () => (
  <colgroup>
    {COLS.map((c) => (
      <col key={c.key} style={{ width: c.width }} />
    ))}
  </colgroup>
);

const TableSkeleton = ({ rows = 10 }) => (
  <tbody>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} className="border-b border-gray-50">
        {COLS.map((c) => (
          <td key={c.key} className="px-4 py-3">
            <div className="h-4 bg-gray-100 rounded animate-pulse" />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

const EmptyState = ({ query }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
      <Package size={28} className="text-gray-300" />
    </div>
    <p className="text-sm font-medium text-gray-600">
      {query ? `No orders found for "${query}"` : "No marketplace orders yet"}
    </p>
    <p className="text-xs text-gray-400 mt-1">
      {query
        ? "Try a different search term or status filter"
        : "Orders placed by customers will appear here"}
    </p>
  </div>
);

// ─────────────────────────────────────────────
// ORDER DETAIL MODAL  (unchanged)
// ─────────────────────────────────────────────

const DetailRow = ({ label, value, mono = false }) => (
  <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
    <span className="text-xs text-gray-500 flex-shrink-0 w-36">{label}</span>
    <span
      className={`text-xs font-medium text-gray-800 text-right ${
        mono ? "font-mono" : ""
      }`}
    >
      {value || "—"}
    </span>
  </div>
);

const SectionTitle = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="w-6 h-6 rounded-md bg-[#05015A]/5 flex items-center justify-center flex-shrink-0">
      <Icon size={12} className="text-[#05015A]" />
    </div>
    <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
      {title}
    </p>
  </div>
);

const OrderDetailModal = ({ orderId, onClose }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setOrder(null);

    getMarketplaceOrderById(orderId)
      .then((res) => {
        if (!cancelled) setOrder(res.data?.data || null);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load order details.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackdrop}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl shadow-black/15 border border-gray-100 w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/60 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center">
              <Receipt size={16} className="text-[#05015A]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">
                {order ? `Order ${order.order_number}` : "Order Details"}
              </h2>
              {order && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Placed {fmtTime(order.placed_at)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {order && <StatusBadge status={order.status} />}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-[#05015A] mb-3" />
              <p className="text-sm text-gray-400">Loading order...</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {order && (
            <>
              <div className="bg-gray-50/70 rounded-xl border border-gray-100 p-4">
                <SectionTitle icon={Store} title="Shop & Branch" />
                <div>
                  <DetailRow label="Shop" value={order.shop?.business_name} />
                  <DetailRow
                    label="Shop Location"
                    value={
                      order.shop
                        ? [order.shop.city, order.shop.state].filter(Boolean).join(", ")
                        : null
                    }
                  />
                  <DetailRow label="Branch" value={order.branch?.branch_name} />
                  <DetailRow
                    label="Branch Type"
                    value={
                      order.branch?.branch_type
                        ? order.branch.branch_type.charAt(0).toUpperCase() +
                          order.branch.branch_type.slice(1)
                        : null
                    }
                  />
                  {order.branch?.contact_number && (
                    <DetailRow label="Branch Contact" value={order.branch.contact_number} />
                  )}
                </div>
              </div>

              <div className="bg-gray-50/70 rounded-xl border border-gray-100 p-4">
                <SectionTitle icon={User} title="Customer" />
                <div>
                  <DetailRow label="Name" value={order.customer_name} />
                  <DetailRow label="Phone" value={order.customer_phone} mono />
                  {order.customer?.email && (
                    <DetailRow label="Email" value={order.customer.email} />
                  )}
                  <DetailRow
                    label="Account Status"
                    value={
                      order.customer?.status
                        ? order.customer.status.charAt(0).toUpperCase() +
                          order.customer.status.slice(1)
                        : null
                    }
                  />
                </div>
              </div>

              {order.delivery_address && (
                <div className="bg-gray-50/70 rounded-xl border border-gray-100 p-4">
                  <SectionTitle icon={MapPin} title="Delivery Address" />
                  <div className="text-xs text-gray-700 leading-relaxed space-y-0.5">
                    {order.delivery_address.recipient_name && (
                      <p className="font-medium">
                        {order.delivery_address.recipient_name}
                        {order.delivery_address.recipient_phone
                          ? ` · ${order.delivery_address.recipient_phone}`
                          : ""}
                      </p>
                    )}
                    <p>{order.delivery_address.address_line_1}</p>
                    {order.delivery_address.address_line_2 && (
                      <p>{order.delivery_address.address_line_2}</p>
                    )}
                    {order.delivery_address.landmark && (
                      <p className="text-gray-500">
                        Near: {order.delivery_address.landmark}
                      </p>
                    )}
                    <p>
                      {[
                        order.delivery_address.city,
                        order.delivery_address.state,
                        order.delivery_address.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-gray-50/70 rounded-xl border border-gray-100 p-4">
                <SectionTitle icon={ShoppingBag} title="Items" />
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.item_id}
                      className="flex items-start justify-between gap-3 p-3 bg-white rounded-lg border border-gray-100"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">
                          {item.medicine_name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {item.brand && (
                            <span className="text-[11px] text-gray-500">{item.brand}</span>
                          )}
                          {item.pack_size && (
                            <span className="text-[11px] text-gray-400">· {item.pack_size}</span>
                          )}
                          <span className="text-[10px] font-mono text-gray-400">
                            SKU: {item.sku}
                          </span>
                          {item.requires_prescription && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
                              Rx
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          MRP: {fmtAmount(item.mrp)} · Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-gray-800">
                          {fmtAmount(item.line_total)}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          @ {fmtAmount(item.unit_price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Subtotal</span>
                    <span className="text-xs font-medium text-gray-700">
                      {fmtAmount(order.subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">Total</span>
                    <span className="text-sm font-bold text-gray-900">
                      {fmtAmount(order.total_amount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50/70 rounded-xl border border-gray-100 p-4">
                <SectionTitle icon={CreditCard} title="Payment" />
                <div>
                  <DetailRow label="Method" value={order.payment_method} />
                  <DetailRow
                    label="Status"
                    value={
                      order.payment_status
                        ? order.payment_status.charAt(0).toUpperCase() +
                          order.payment_status.slice(1).toLowerCase()
                        : null
                    }
                  />
                  {order.requires_prescription && (
                    <DetailRow label="Prescription" value="Required" />
                  )}
                </div>
              </div>

              {(order.rejection_reason || order.cancelled_by) && (
                <div className="bg-red-50/60 rounded-xl border border-red-100 p-4">
                  <SectionTitle icon={XCircle} title="Rejection / Cancellation" />
                  <div>
                    {order.rejection_reason && (
                      <DetailRow
                        label="Rejection Reason"
                        value={order.rejection_reason.replace(/_/g, " ")}
                      />
                    )}
                    {order.rejection_reason_other && (
                      <DetailRow label="Details" value={order.rejection_reason_other} />
                    )}
                    {order.cancelled_by && (
                      <DetailRow
                        label="Cancelled By"
                        value={
                          order.cancelled_by.charAt(0).toUpperCase() +
                          order.cancelled_by.slice(1)
                        }
                      />
                    )}
                  </div>
                </div>
              )}

              {order.notes && (
                <div className="bg-gray-50/70 rounded-xl border border-gray-100 p-4">
                  <SectionTitle icon={FileText} title="Customer Notes" />
                  <p className="text-xs text-gray-600 leading-relaxed">{order.notes}</p>
                </div>
              )}

              <div className="bg-gray-50/70 rounded-xl border border-gray-100 p-4">
                <SectionTitle icon={Clock} title="Status Timeline" />
                <div className="space-y-2">
                  {order.status_history.map((h, idx) => (
                    <div key={h.history_id} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                            STATUS_CONFIG[h.to_status]?.dot || "bg-gray-400"
                          }`}
                        />
                        {idx < order.status_history.length - 1 && (
                          <div className="w-px flex-1 bg-gray-200 mt-1 min-h-[12px]" />
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-gray-700">
                            {h.to_status.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            by{" "}
                            {h.changed_by_type.charAt(0).toUpperCase() +
                              h.changed_by_type.slice(1)}
                          </span>
                        </div>
                        {h.reason && (
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {h.reason.replace(/_/g, " ")}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {fmtTime(h.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {order.prescriptions.length > 0 && (
                <div className="bg-amber-50/60 rounded-xl border border-amber-100 p-4">
                  <SectionTitle icon={FileText} title="Prescriptions" />
                  <div className="space-y-2">
                    {order.prescriptions.map((p) => (
                      <div
                        key={p.prescription_id}
                        className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-amber-100"
                      >
                        <FileText size={14} className="text-amber-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate">
                            {p.original_name}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {p.mime_type} · {(p.file_size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

const MarketplaceOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const PAGE_SIZE = 20;
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const fetchOrders = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      try {
        const res = await getMarketplaceOrders({
          page,
          limit: PAGE_SIZE,
          search: debouncedSearch,
          status: statusFilter,
        });
        const d = res.data?.data;
        setOrders(d?.orders || []);
        setTotalPages(d?.total_pages || 1);
        setTotalCount(d?.total || 0);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, debouncedSearch, statusFilter]
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="h-full flex flex-col bg-gray-50/80">
      {/* ═══ HEADER ═══ */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Marketplace Orders
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading
                ? "Loading..."
                : `${totalCount.toLocaleString()} total orders`}
            </p>
          </div>
          <button
            onClick={() => fetchOrders({ silent: true })}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 bg-white rounded-xl border border-gray-200/60 p-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 overflow-x-auto flex-shrink-0">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                  statusFilter === tab.key
                    ? "bg-white text-[#05015A] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search order ID or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:outline-none focus:border-[#05015A]/30 focus:ring-2 focus:ring-[#05015A]/10 transition-all"
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
        </div>
      </div>

      {/* ═══ TABLE ═══ */}
      <div className="flex-1 min-h-0 px-6 pb-6">
        <div className="h-full bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden flex flex-col">
          {/* Single scroll container — both header and body share the same horizontal scroll */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
              <TableColGroup />

              {/* Sticky header */}
              <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm">
                <tr className="border-b border-gray-100">
                  {COLS.map((c) => (
                    <th
                      key={c.key}
                      className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>

              {loading ? (
                <TableSkeleton rows={10} />
              ) : orders.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={COLS.length}>
                      <EmptyState query={debouncedSearch} />
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  {orders.map((order) => {
                    const isSelected = selectedOrderId === order.order_id;
                    return (
                      <tr
                        key={order.order_id}
                        onClick={() =>
                          setSelectedOrderId(isSelected ? null : order.order_id)
                        }
                        className={`border-b border-gray-50 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-[#05015A]/[0.03]"
                            : "hover:bg-gray-50/70"
                        }`}
                      >
                        {/* Order */}
                        <td className="px-4 py-3 font-mono text-xs text-gray-600 truncate">
                          {order.order_number}
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-gray-800 truncate">
                            {order.customer_name || "—"}
                          </p>
                          <p className="text-[11px] text-gray-400 font-mono truncate">
                            {order.customer_phone || ""}
                          </p>
                        </td>

                        {/* Shop / Branch */}
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-gray-800 truncate">
                            {order.shop?.business_name || "—"}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {order.branch?.branch_name || ""}
                          </p>
                        </td>

                        {/* Items */}
                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                          {order.item_count ?? "—"}
                          {order.requires_prescription && (
                            <span className="ml-1.5 inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
                              Rx
                            </span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3 text-xs font-semibold text-gray-800 whitespace-nowrap">
                          {order.total_amount != null
                            ? fmtAmount(order.total_amount)
                            : "—"}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <StatusBadge status={order.status} />
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 text-[11px] text-gray-500 whitespace-nowrap">
                          {fmt(order.placed_at)}
                        </td>

                        {/* Arrow */}
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
              <p className="text-xs text-gray-500">
                Page <span className="font-semibold text-gray-700">{page}</span> of{" "}
                {totalPages} · {totalCount.toLocaleString()} total
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
};

export default MarketplaceOrdersPage;