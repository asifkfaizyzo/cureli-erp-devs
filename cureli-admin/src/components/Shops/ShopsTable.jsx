// src/components/Shops/ShopsTable.jsx

import { useEffect, useState } from "react";
import {
  Eye,
  Pencil,
  ChevronUp,
  ChevronDown,
  ShoppingBag,
  Ban,
  CheckCircle,
} from "lucide-react";
import Pagination from "./Pagination";
import ShopDetailsModal from "./ShopDetailsModal";
import ConfirmDialog from "../common/ConfirmDialog";
import { toggleShopActive } from "../../api/cadminShops";

const ShopsTable = ({
  currentPage,
  setCurrentPage,
  rowsPerPage,
  shops = [],
  loading = false,
  totalItems = 0,
  sortConfig = { sortBy: null, order: null },
  onSortChange,
  onRefresh,
  onShopUpdate,
}) => {
  // Single modal state (like UserTable)
  const [selectedShop, setSelectedShop] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view"); // "view" or "edit"

  // Suspend confirm dialog
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [shopToSuspend, setShopToSuspend] = useState(null);
  const [suspendLoading, setSuspendLoading] = useState(false);

  // Column widths for resizing
  const [columnWidths, setColumnWidths] = useState({
    slNo: 60,
    businessName: 200,
    ownerName: 160,
    businessType: 130,
    plan: 140,
    verification: 140,
    actions: 100,
  });

  const [resizing, setResizing] = useState(null);

  const handleMouseDown = (column, e) => {
    e.preventDefault();
    setResizing({
      column,
      startX: e.clientX,
      startWidth: columnWidths[column],
    });
  };

  const handleMouseMove = (e) => {
    if (!resizing) return;
    const diff = e.clientX - resizing.startX;
    const newWidth = Math.max(60, resizing.startWidth + diff);
    setColumnWidths((prev) => ({ ...prev, [resizing.column]: newWidth }));
  };

  const handleMouseUp = () => setResizing(null);

  // Proper useEffect for resize listeners
  useEffect(() => {
    if (resizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [resizing]);

  // Plan badge styling
  const getPlanBadge = (subscription) => {
    if (!subscription || !subscription.plan_name) {
      return (
        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 min-w-[70px]">
          None
        </span>
      );
    }

    const isExpired = !subscription.is_active || subscription.status === "expired" || 
                      (subscription.end_date && new Date(subscription.end_date) < new Date());

    if (isExpired) {
      return (
        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 min-w-[70px]">
          {subscription.plan_name}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 min-w-[70px]">
        {subscription.plan_name}
      </span>
    );
  };

  // Verification badge styling
  const getVerificationBadge = (status) => {
    const config = {
      verified: { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle, label: "Verified" },
      pending: { bg: "bg-blue-100", text: "text-blue-700", icon: null, label: "Pending" },
      pending_review: { bg: "bg-yellow-100", text: "text-yellow-700", icon: null, label: "Pending Review" },
      rejected: { bg: "bg-red-100", text: "text-red-700", icon: null, label: "Rejected" },
      partially_rejected: { bg: "bg-orange-100", text: "text-orange-700", icon: null, label: "Partial Reject" },
    };

    const style = config[status] || config.pending;
    const Icon = style.icon;

    return (
      <span className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text} min-w-[90px]`}>
        {Icon && <Icon size={12} />}
        {style.label}
      </span>
    );
  };

  // Sortable header component
  const SortableHeader = ({ column, label, width }) => {
    const isActive = sortConfig?.sortBy === column;
    const isAsc = isActive && sortConfig?.order === "asc";
    const isDesc = isActive && sortConfig?.order === "desc";

    return (
      <th style={{ width, minWidth: width }} className="relative group">
        <div
          className="flex items-center justify-between p-3 cursor-pointer select-none"
          onClick={() => onSortChange && onSortChange(column)}
        >
          <span className="font-semibold">{label}</span>
          <div className="flex flex-col gap-0.5">
            <ChevronUp
              size={12}
              className={`transition-colors ${isAsc ? "text-yellow-300" : "text-white/50"}`}
            />
            <ChevronDown
              size={12}
              className={`-mt-1 transition-colors ${isDesc ? "text-yellow-300" : "text-white/50"}`}
            />
          </div>
        </div>
        <div
          onMouseDown={(e) => handleMouseDown(column, e)}
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-white/30 transition-colors"
        />
      </th>
    );
  };

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil((totalItems || 0) / (rowsPerPage || 1)));
  const startIndex = (currentPage - 1) * rowsPerPage;

  // Suspend handlers
  const handleSuspendClick = (shop) => {
    setShopToSuspend(shop);
    setShowSuspendConfirm(true);
  };

  const handleSuspendConfirm = async () => {
    if (!shopToSuspend) return;
    setSuspendLoading(true);
    try {
      const newIsActive = !shopToSuspend.is_active;
      await toggleShopActive(shopToSuspend.shop_id, newIsActive);

      // Update row locally
      onShopUpdate?.(shopToSuspend.shop_id, { is_active: newIsActive });

      setShowSuspendConfirm(false);
      setShopToSuspend(null);
    } catch (err) {
      console.error("Suspend/Activate failed:", err);
      alert(err.response?.data?.message || "Failed to update shop status");
    } finally {
      setSuspendLoading(false);
    }
  };

  // Handler when modal closes after an action
  const handleModalClose = (shouldRefresh = false) => {
    setIsModalOpen(false);
    setSelectedShop(null);
    if (shouldRefresh) {
      onRefresh?.();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded-xl border border-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#05015A] border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 text-sm">Loading shops...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm" style={{ minWidth: "900px" }}>
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white text-left">
              <th style={{ width: columnWidths.slNo }} className="p-3 font-semibold">#</th>
              <SortableHeader column="business_name" label="Business Name" width={columnWidths.businessName} />
              <SortableHeader column="owner" label="Owner" width={columnWidths.ownerName} />
              <SortableHeader column="business_type" label="Type" width={columnWidths.businessType} />
              <th style={{ width: columnWidths.plan }} className="p-3 font-semibold text-center">Plan</th>
              <th style={{ width: columnWidths.verification }} className="p-3 font-semibold text-center">Verification</th>
              <th style={{ width: columnWidths.actions, minWidth: 100 }} className="p-3 font-semibold text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {shops.length > 0 ? (
              shops.map((shop, index) => (
                <tr
                  key={shop.shop_id}
                  className={`
                    border-b border-gray-100 transition-all duration-150
                    ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                    ${!shop.is_active ? "opacity-60" : ""}
                    hover:bg-indigo-50
                  `}
                >
                  <td className="p-3 text-gray-500 font-medium">{startIndex + index + 1}</td>

                  <td className="p-3 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <span className="truncate" title={shop.business_name}>
                        {shop.business_name}
                      </span>
                      {!shop.is_active && <Ban size={14} className="text-red-400 shrink-0" />}
                    </div>
                  </td>

                  <td className="p-3 text-gray-600 truncate" title={shop.owner?.name || shop.owner?.full_name}>
                    {shop.owner?.name || shop.owner?.full_name || "N/A"}
                  </td>

                  <td className="p-3 text-gray-600 truncate">
                    {shop.business_type || "N/A"}
                  </td>

                  <td className="p-3 text-center">
                    {getPlanBadge(shop.subscription)}
                  </td>

                  <td className="p-3 text-center">
                    {getVerificationBadge(shop.verification_status)}
                  </td>

                  <td className="p-2">
                    <div className="flex items-center justify-center gap-0.5 whitespace-nowrap">
                      {/* View */}
                      <button
                        onClick={() => {
                          setSelectedShop(shop);
                          setIsModalOpen(true);
                          setModalMode("view");
                        }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-[#05015A] hover:bg-indigo-50 transition-all"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => {
                          setSelectedShop(shop);
                          setIsModalOpen(true);
                          setModalMode("edit");
                        }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-all"
                        title="Edit Shop"
                      >
                        <Pencil size={16} />
                      </button>

                      {/* Suspend/Activate */}
                      <button
                        onClick={() => handleSuspendClick(shop)}
                        className={`p-1.5 rounded-lg transition-all ${
                          shop.is_active
                            ? "text-gray-500 hover:text-orange-600 hover:bg-orange-50"
                            : "text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
                        }`}
                        title={shop.is_active ? "Suspend Shop" : "Activate Shop"}
                      >
                        {shop.is_active ? <Ban size={16} /> : <CheckCircle size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-12">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <ShoppingBag size={32} className="text-gray-300" />
                    </div>
                    <p className="text-lg font-medium text-gray-500 mb-1">No shops found</p>
                    <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50/50 px-4 py-1.5 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing{" "}
          <span className="font-medium text-gray-700">{totalItems > 0 ? startIndex + 1 : 0}</span>{" "}
          to{" "}
          <span className="font-medium text-gray-700">{Math.min(startIndex + rowsPerPage, totalItems)}</span>{" "}
          of{" "}
          <span className="font-medium text-gray-700">{totalItems}</span>{" "}
          results
        </div>

        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </div>

      {/* Single Modal - handles both view and edit modes */}
      <ShopDetailsModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        shop={selectedShop}
        mode={modalMode}
      />

      {/* Suspend Confirm Dialog */}
      <ConfirmDialog
        isOpen={showSuspendConfirm}
        onClose={() => {
          setShowSuspendConfirm(false);
          setShopToSuspend(null);
        }}
        onConfirm={handleSuspendConfirm}
        title={shopToSuspend?.is_active ? "Suspend Shop?" : "Activate Shop?"}
        message={
          shopToSuspend?.is_active
            ? `Are you sure you want to suspend "${shopToSuspend?.business_name}"? All users under this shop will lose access.`
            : `Are you sure you want to activate "${shopToSuspend?.business_name}"? Users will regain access.`
        }
        confirmText={shopToSuspend?.is_active ? "Suspend" : "Activate"}
        cancelText="Cancel"
        type={shopToSuspend?.is_active ? "warning" : "success"}
        loading={suspendLoading}
      />
    </div>
  );
};

export default ShopsTable;