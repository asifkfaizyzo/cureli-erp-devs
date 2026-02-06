// frontend/src/pages/purchase/returns/PurchaseReturnsPage.jsx

import React, { useState, useEffect, useMemo } from "react";
import {
  Package,
  Search,
  Filter,
  Calendar,
  Building2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Shield,
  ChevronDown,
  FileText,
  TrendingUp,
} from "lucide-react";
import { useToast } from "../../../components/common/Toast";
import purchaseAPI from "../../../api/purchase";
import { useAuthStore } from "../../../store/useAuthStore";
import ViewReturnModal from "./components/ViewReturnModal";
import ReturnStatusBadge from "./components/ReturnStatusBadge";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import TableSkeleton from "../../../components/common/TableSkeleton";
import TableEmptyState from "../../../components/common/TableEmptyState";
import Pagination from "../../../components/common/Pagination";

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const NAVY = "#000060";

const RETURN_REASON_LABELS = {
  DAMAGED_GOODS: "Damaged Goods",
  EXPIRED_GOODS: "Expired Goods",
  WRONG_ITEM_RECEIVED: "Wrong Item",
  QUALITY_ISSUE: "Quality Issue",
  EXCESS_STOCK: "Excess Stock",
  PRICE_DIFFERENCE: "Price Difference",
  OTHER: "Other",
};

const ADJUSTMENT_TYPE_CONFIG = {
  CASH_REFUND: {
    label: "Cash Refund",
    color: "emerald",
    icon: "₹",
  },
  CREDIT_NOTE: {
    label: "Credit Note",
    color: "blue",
    icon: "📄",
  },
  OFFSET_NEXT_PURCHASE: {
    label: "Offset",
    color: "purple",
    icon: "🔄",
  },
};

const formatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ════════════════════════════════════════════════════════════════════════════
// APPROVAL QUEUE CARD (For Super Admin)
// ════════════════════════════════════════════════════════════════════════════

const ApprovalQueueCard = ({ pendingReturns, onViewReturn }) => {
  const totalPendingAmount = useMemo(() => {
    return pendingReturns.reduce((sum, ret) => sum + (parseFloat(ret.net_amount) || 0), 0);
  }, [pendingReturns]);

  if (pendingReturns.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-amber-500 flex items-center justify-center shadow-lg">
            <Shield size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-900">Pending Approvals</h3>
            <p className="text-sm text-amber-700">
              {pendingReturns.length} return{pendingReturns.length !== 1 ? "s" : ""} awaiting your approval
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-amber-600 uppercase tracking-wider mb-1">Total Amount</p>
          <p className="text-2xl font-bold text-amber-900">{formatCurrency(totalPendingAmount)}</p>
        </div>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {pendingReturns.map((returnInvoice) => (
          <div
            key={returnInvoice.invoice_id}
            className="bg-white rounded-lg p-4 border border-amber-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer"
            onClick={() => onViewReturn(returnInvoice)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <p className="font-mono font-bold text-[#000060]">{returnInvoice.invoice_number}</p>
                  <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                    {RETURN_REASON_LABELS[returnInvoice.return_reason] || returnInvoice.return_reason}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Building2 size={14} />
                    {returnInvoice.supplier?.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {formatDate(returnInvoice.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText size={14} />
                    {returnInvoice._count?.lineItems || 0} items
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-lg font-bold text-[#000060]">{formatCurrency(returnInvoice.net_amount)}</p>
                </div>
                <button className="p-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
                  <Eye size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// FILTERS COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const ReturnsFilters = ({ filters, onFilterChange, onReset }) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-[#000060] transition-colors"
        >
          <Filter size={18} />
          Filters
          <ChevronDown
            size={16}
            className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
          />
        </button>

        {(filters.startDate || filters.endDate || filters.approvalStatus) && (
          <button
            onClick={onReset}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Reset Filters
          </button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={filters.startDate || ""}
              onChange={(e) => onFilterChange("startDate", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#000060] focus:border-[#000060]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              value={filters.endDate || ""}
              onChange={(e) => onFilterChange("endDate", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#000060] focus:border-[#000060]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Approval Status</label>
            <select
              value={filters.approvalStatus || ""}
              onChange={(e) => onFilterChange("approvalStatus", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#000060] focus:border-[#000060]"
            >
              <option value="">All Statuses</option>
              <option value="PENDING_APPROVAL">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Return number..."
                value={filters.search || ""}
                onChange={(e) => onFilterChange("search", e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#000060] focus:border-[#000060]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const PurchaseReturnsPage = () => {
  const toast = useToast();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "super_admin";

  // State
  const [returns, setReturns] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Pagination
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    approvalStatus: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
  });

  // Modals
  const [viewReturnModal, setViewReturnModal] = useState({
    open: false,
    returnInvoice: null,
  });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: "warning",
    title: "",
    message: "",
    confirmText: "",
    onConfirm: () => {},
  });

  // Computed
  const pendingReturns = useMemo(() => {
    return returns.filter((r) => r.return_approval_status === "PENDING_APPROVAL");
  }, [returns]);

  const filteredReturns = useMemo(() => {
    let result = [...returns];

    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.invoice_number?.toLowerCase().includes(query) ||
          r.supplier?.name?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [returns, filters.search]);

  // Load Returns
  const loadReturns = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      const params = {
        ...filters,
        ...pagination,
      };

      // Remove empty filters
      Object.keys(params).forEach((key) => {
        if (params[key] === "" || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await purchaseAPI.getAllReturns(params);
      setReturns(response.data?.returns || []);
      setTotal(response.data?.total || 0);
    } catch (error) {
      console.error("Load returns error:", error);
      toast.error("Failed to Load Returns", error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Effects
  useEffect(() => {
    loadReturns();
  }, [filters.startDate, filters.endDate, filters.approvalStatus, pagination.limit, pagination.offset]);

  // Handlers
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, offset: 0 })); // Reset to first page
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      approvalStatus: "",
      search: "",
    });
    setPagination({ limit: 20, offset: 0 });
  };

  const handleRefresh = () => {
    loadReturns(false);
  };

 const handleViewReturn = async (returnInvoice) => {
  try {
    // If lineItems is missing or it's just a summary, fetch full details
    if (!returnInvoice.lineItems || returnInvoice._count) {
      console.log("📦 Fetching full return details for:", returnInvoice.invoice_id);
      const response = await purchaseAPI.getReturnById(returnInvoice.invoice_id);
      setViewReturnModal({ open: true, returnInvoice: response.data });
    } else {
      setViewReturnModal({ open: true, returnInvoice });
    }
  } catch (error) {
    console.error("Failed to get return details:", error);
    toast.error("Failed to load return details");
  }
};

  const handleApproveReturn = (returnInvoice) => {
    setConfirmDialog({
      isOpen: true,
      type: "success",
      title: "Approve Return",
      message: (
        <div className="space-y-3">
          <p>You are about to approve this purchase return.</p>
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="font-semibold text-gray-900">Return: {returnInvoice.invoice_number}</p>
            <p className="text-sm text-gray-600 mt-1">Amount: {formatCurrency(returnInvoice.net_amount)}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 font-medium mb-2">This will:</p>
            <ul className="text-xs text-blue-700 list-disc list-inside space-y-1">
              <li>Deduct stock from inventory</li>
              <li>Process payment adjustment ({ADJUSTMENT_TYPE_CONFIG[returnInvoice.adjustment_type]?.label})</li>
              <li>Mark return as approved</li>
            </ul>
          </div>
        </div>
      ),
      confirmText: "Approve Return",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        await performApproval(returnInvoice.invoice_id);
      },
    });
  };

  const performApproval = async (returnId) => {
    try {
      await purchaseAPI.approveReturn(returnId, {
        action: "APPROVE",
      });

      toast.success("Return Approved", "Stock deducted and payment adjustment processed.");
      setViewReturnModal({ open: false, returnInvoice: null });
      loadReturns(false);
    } catch (error) {
      console.error("Approve return error:", error);
      toast.error("Approval Failed", error.response?.data?.message || error.message);
    }
  };

  const handleRejectReturn = (returnInvoice) => {
    setConfirmDialog({
      isOpen: true,
      type: "danger",
      title: "Reject Return",
      message: (
        <div className="space-y-3">
          <p>You are about to reject this purchase return.</p>
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="font-semibold text-gray-900">Return: {returnInvoice.invoice_number}</p>
            <p className="text-sm text-gray-600 mt-1">Amount: {formatCurrency(returnInvoice.net_amount)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              id="rejection-reason"
              placeholder="Enter reason for rejection..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
            />
          </div>
          <p className="text-sm text-red-600 font-medium">⚠️ This action cannot be undone.</p>
        </div>
      ),
      confirmText: "Reject Return",
      onConfirm: async () => {
        const reason = document.getElementById("rejection-reason")?.value.trim();
        if (!reason) {
          toast.warning("Reason Required", "Please provide a rejection reason.");
          return;
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        await performRejection(returnInvoice.invoice_id, reason);
      },
    });
  };

  const performRejection = async (returnId, reason) => {
    try {
      await purchaseAPI.rejectReturn(returnId, reason);

      toast.success("Return Rejected", "Return has been rejected and marked as cancelled.");
      setViewReturnModal({ open: false, returnInvoice: null });
      loadReturns(false);
    } catch (error) {
      console.error("Reject return error:", error);
      toast.error("Rejection Failed", error.response?.data?.message || error.message);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({
      ...prev,
      offset: (newPage - 1) * prev.limit,
    }));
  };

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(total / pagination.limit);

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#000060] mb-2">Purchase Returns</h1>
          <p className="text-gray-600">Manage product returns and approval workflow</p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#000060] text-white hover:bg-[#000060]/90 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Returns</p>
            <Package size={20} className="text-[#000060]" />
          </div>
          <p className="text-2xl font-bold text-[#000060]">{total}</p>
        </div>

        <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-amber-700">Pending</p>
            <Clock size={20} className="text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700">{pendingReturns.length}</p>
        </div>

        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-green-700">Approved</p>
            <CheckCircle2 size={20} className="text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-700">
            {returns.filter((r) => r.return_approval_status === "APPROVED").length}
          </p>
        </div>

        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-red-700">Rejected</p>
            <XCircle size={20} className="text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-700">
            {returns.filter((r) => r.return_approval_status === "REJECTED").length}
          </p>
        </div>
      </div>

      {/* Approval Queue (Super Admin Only) */}
      {isSuperAdmin && (
        <ApprovalQueueCard pendingReturns={pendingReturns} onViewReturn={handleViewReturn} />
      )}

      {/* Filters */}
      <ReturnsFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Returns Table */}
      <div className="bg-white rounded-lg border border-gray-200 mt-6 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={10} columns={8} />
        ) : filteredReturns.length === 0 ? (
          <TableEmptyState
            icon={Package}
            title="No Returns Found"
            description={
              filters.startDate || filters.endDate || filters.approvalStatus || filters.search
                ? "Try adjusting your filters"
                : "No purchase returns have been created yet"
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Return #</th>
                    <th className="px-4 py-3 text-left">Original Invoice</th>
                    <th className="px-4 py-3 text-left">Supplier</th>
                    <th className="px-4 py-3 text-center">Items</th>
                    <th className="px-4 py-3 text-left">Reason</th>
                    <th className="px-4 py-3 text-left">Adjustment</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Date</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredReturns.map((returnInvoice) => {
                    const adjustmentConfig = ADJUSTMENT_TYPE_CONFIG[returnInvoice.adjustment_type];

                    return (
                      <tr
                        key={returnInvoice.invoice_id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-mono font-bold text-[#000060]">
                            {returnInvoice.invoice_number}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-mono text-sm text-gray-700">
                            {returnInvoice.parentInvoice?.invoice_number || "N/A"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">
                            {returnInvoice.supplier?.name}
                          </p>
                          {returnInvoice.supplier?.supplier_code && (
                            <p className="text-xs text-gray-500 font-mono">
                              {returnInvoice.supplier.supplier_code}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold text-gray-900">
                            {returnInvoice._count?.lineItems || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                            {RETURN_REASON_LABELS[returnInvoice.return_reason] ||
                              returnInvoice.return_reason}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {adjustmentConfig && (
                            <span
                              className={`text-xs px-2 py-1 bg-${adjustmentConfig.color}-100 text-${adjustmentConfig.color}-700 rounded`}
                            >
                              {adjustmentConfig.icon} {adjustmentConfig.label}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="font-bold text-[#000060]">
                            {formatCurrency(returnInvoice.net_amount)}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <ReturnStatusBadge status={returnInvoice.return_approval_status} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">
                          {formatDate(returnInvoice.created_at)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleViewReturn(returnInvoice)}
                            className="p-2 rounded-lg bg-[#000060]/10 text-[#000060] hover:bg-[#000060]/20 transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* View Return Modal */}
      <ViewReturnModal
        open={viewReturnModal.open}
        onClose={() => setViewReturnModal({ open: false, returnInvoice: null })}
        returnInvoice={viewReturnModal.returnInvoice}
        onApprove={handleApproveReturn}
        onReject={handleRejectReturn}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText="Cancel"
        type={confirmDialog.type}
      />
    </div>
  );
};

export default PurchaseReturnsPage;