// src/pages/inventory/components/InventoryRowFixed.jsx

import { memo, forwardRef, useImperativeHandle, useRef } from "react";
import { Eye, Pencil, Trash2, RefreshCw, Building2, Lock, Link2, CheckCircle, Clock, AlertCircle } from "lucide-react";

// ══════════════════════════════════════════════════════════════
// CATALOG STATUS BADGE COMPONENT (Imported from InventoryTable)
// ══════════════════════════════════════════════════════════════
const CatalogStatusBadge = ({ status, confidence, loading }) => {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">
        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
        Loading...
      </span>
    );
  }

  const config = {
    LINKED: {
      label: "Linked",
      icon: CheckCircle,
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-700",
      iconColor: "text-emerald-500",
    },
    AUTO_LINKED: {
      label: "Linked",
      icon: CheckCircle,
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-700",
      iconColor: "text-emerald-500",
    },
    PENDING: {
      label: "Pending",
      icon: Clock,
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
      iconColor: "text-amber-500",
    },
    SUGGESTED: {
      label: "Review",
      icon: AlertCircle,
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      iconColor: "text-blue-500",
    },
    NOT_LINKED: {
      label: "Not Linked",
      icon: AlertCircle,
      bg: "bg-slate-50",
      border: "border-slate-200",
      text: "text-slate-600",
      iconColor: "text-slate-400",
    },
  };

  const c = config[status] || config.NOT_LINKED;
  const Icon = c.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.border} ${c.text}`}
      title={confidence > 0 ? `Confidence: ${confidence}%` : undefined}
    >
      <Icon size={12} className={c.iconColor} />
      {c.label}
      {confidence > 0 && status !== "NOT_LINKED" && (
        <span className="text-[10px] opacity-70">({confidence}%)</span>
      )}
    </span>
  );
};

// ✅ ENHANCED: Safely extract string from any value
const display = (value) => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "object") {
    // Handle nested objects like {branch_id, branch_name}, {supplier_id, supplier_name}
    return value.branch_name || 
           value.name || 
           value.supplier_name || 
           value.medicine_name ||
           "-";
  }
  return String(value) || "-";
};

const InventoryRowFixed = memo(forwardRef(({
  index,
  item,
  rowNumber = 1,
  isEven = false,
  onView,
  onEdit,
  onDelete,
  onAdjust,
  rowHeight = 36,
  showBranchColumn = false,
  canAdjustStock = true,
  catalogStatus = "NOT_LINKED",
  catalogConfidence = 0,
  catalogStatusLoading = false,
}, ref) => {
  const rowRef = useRef(null);

  useImperativeHandle(ref, () => ({
    scrollIntoView: () => {
      rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }), []);

  const getStatusColor = (status) => {
    switch (status) {
      case "In Stock":
        return "bg-green-100 text-green-700 border-green-300";
      case "Low Stock":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "Out of Stock":
        return "bg-red-100 text-red-700 border-red-300";
      case "Expired":
        return "bg-gray-100 text-gray-600 border-gray-300";
      case "Expiring Soon":
        return "bg-orange-100 text-orange-700 border-orange-300";
      default:
        return "bg-slate-100 text-slate-600 border-slate-300";
    }
  };

  // Get expiry text color based on status
  const getExpiryColor = (status) => {
    switch (status) {
      case "Expired":
        return "text-red-600 font-semibold";
      case "Expiring Soon":
        return "text-orange-600 font-semibold";
      default:
        return "text-slate-700";
    }
  };

  const cellBase = "border-b border-r border-slate-200 last:border-r-0 p-0 overflow-hidden";

  // Handle action clicks with stock adjustment permission check
  const handleAdjustClick = (e) => {
    e.stopPropagation();
    if (canAdjustStock && onAdjust) {
      onAdjust(item);
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    if (canAdjustStock && onEdit) {
      onEdit(item);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (canAdjustStock && onDelete) {
      onDelete(item);
    }
  };

  const handleViewClick = (e) => {
    e.stopPropagation();
    if (onView) {
      onView(item);
    }
  };

  return (
    <tr 
      ref={rowRef}
      style={{ height: `${rowHeight}px` }}
      className={`
        group transition-all duration-100
        ${isEven ? 'bg-white' : 'bg-slate-50/50'}
        hover:bg-indigo-50/40 
        focus-within:bg-indigo-50/60
        border-l-2 border-l-transparent
        hover:border-l-indigo-400
        cursor-pointer
      `}
      onClick={() => onView?.(item)}
    >
      {/* 1. ROW NUMBER */}
      <td className={`${cellBase} text-center bg-slate-50`}>
        <div className="flex items-center justify-center h-full">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded text-[8px] font-bold bg-indigo-500 text-white">
            {rowNumber}
          </span>
        </div>
      </td>

      {/* 2. ITEM NAME */}
      <td className={`${cellBase} bg-blue-50/30`}>
        <div className="px-1.5 py-1 h-full flex flex-col justify-center">
          <span className="font-semibold text-[9px] 2xl:text-[10px] text-slate-800 truncate leading-tight">
            {display(item.name || item.medicine_name)}
          </span>
          {(item.hsn || item.hsn_code || item.medicine_hsn_code) && display(item.hsn || item.hsn_code || item.medicine_hsn_code) !== '-' && (
            <span className="text-[7px] 2xl:text-[8px] text-slate-400 truncate">
              HSN: {display(item.hsn || item.hsn_code || item.medicine_hsn_code)}
            </span>
          )}
        </div>
      </td>

      {/* 3. CATEGORY */}
      <td className={`${cellBase}`}>
        <div className="px-1.5 py-1 h-full flex items-center">
          <span className="text-[9px] 2xl:text-[10px] text-slate-600 truncate">
            {display(item.category || item.medicine_category)}
          </span>
        </div>
      </td>

      {/* ✅ 4. CATALOG STATUS - NEW CELL */}
      <td className={`${cellBase} bg-purple-50/20`}>
        <div className="px-1 py-1 h-full flex items-center justify-center">
          <CatalogStatusBadge 
            status={catalogStatus} 
            confidence={catalogConfidence}
            loading={catalogStatusLoading}
          />
        </div>
      </td>

      {/* 5. MANUFACTURER (was #4, now #5) */}
      <td className={`${cellBase} bg-violet-50/20`}>
        <div className="px-1.5 py-1 h-full flex items-center">
          <span className="text-[9px] 2xl:text-[10px] text-slate-600 truncate">
            {display(item.manufacturer || item.mfac || item.medicine_manufacturer)}
          </span>
        </div>
      </td>

      {/* 6. BATCH */}
      <td className={`${cellBase} bg-cyan-50/30`}>
        <div className="px-1 py-1 h-full flex items-center justify-center">
          <span className="text-[8px] 2xl:text-[9px] text-slate-700 font-mono">
            {display(item.batch || item.batch_number)}
          </span>
        </div>
      </td>

      {/* 7. EXPIRY */}
      <td className={`${cellBase} bg-cyan-50/30`}>
        <div className="px-1 py-1 h-full flex items-center justify-center">
          <span className={`text-[8px] 2xl:text-[9px] font-mono ${getExpiryColor(item.status)}`}>
            {display(item.expiry || item.expiry_date)}
          </span>
        </div>
      </td>

      {/* 8. BRANCH - CONDITIONAL */}
      {showBranchColumn && (
        <td className={`${cellBase} bg-indigo-50/30`}>
          <div className="px-1 py-1 h-full flex items-center justify-center">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[8px] 2xl:text-[9px] font-medium truncate max-w-full">
              <Building2 size={9} className="flex-shrink-0" />
              <span className="truncate">
                {display(item.branch || item.branch_name)}
              </span>
            </span>
          </div>
        </td>
      )}

      {/* 9. SUPPLIER */}
      <td className={`${cellBase} bg-purple-50/20`}>
        <div className="px-1.5 py-1 h-full flex items-center justify-center">
          <span className="text-[9px] 2xl:text-[10px] text-slate-600 truncate">
            {display(item.supplier || item.supplier_name)}
          </span>
        </div>
      </td>

      {/* 10. QTY */}
      <td className={`${cellBase} bg-emerald-50/60`}>
        <div className="px-1 py-1 h-full flex items-center justify-center">
          <span className={`text-[9px] 2xl:text-[10px] font-bold ${
            Number(item.qty || item.current_stock || 0) > 10 ? 'text-emerald-700' : 
            Number(item.qty || item.current_stock || 0) > 0 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {item.qty ?? item.current_stock ?? 0}
          </span>
        </div>
      </td>

      {/* 11. MRP */}
      <td className={`${cellBase}`}>
        <div className="px-1 py-1 h-full flex items-center justify-end">
          <span className="text-[9px] 2xl:text-[10px] text-slate-600 font-medium">
            ₹{Number(item.mrp || 0).toFixed(2)}
          </span>
        </div>
      </td>

      {/* 12. RACK */}
      <td className={`${cellBase} bg-slate-50`}>
        <div className="px-1 py-1 h-full flex items-center justify-center">
          <span className="text-[8px] 2xl:text-[9px] text-slate-600 font-mono">
            {display(item.rack || item.rack_no || item.medicine_rack_no)}
          </span>
        </div>
      </td>

      {/* 13. STATUS */}
      <td className={`${cellBase}`}>
        <div className="px-1 py-1 h-full flex items-center justify-center">
          <span className={`
            px-1.5 py-0.5 rounded-full text-[8px] 2xl:text-[9px] font-medium border
            ${getStatusColor(item.status)}
          `}>
            {item.status || 'Unknown'}
          </span>
        </div>
      </td>

      {/* 14. ACTIONS */}
      <td className={`${cellBase} bg-slate-50`}>
        <div className="px-1 py-1 h-full flex items-center justify-center gap-0.5">
          {/* View - Always enabled
          <button
            onClick={handleViewClick}
            className="p-0.5 hover:bg-blue-100 rounded transition-colors"
            title="View details"
          >
            <Eye size={11} className="text-blue-600" />
          </button> */}

          {/* Edit - Conditional based on canAdjustStock */}
          <button
            onClick={handleEditClick}
            disabled={!canAdjustStock}
            className={`p-0.5 rounded transition-colors ${
              canAdjustStock 
                ? 'hover:bg-amber-100 cursor-pointer' 
                : 'cursor-not-allowed opacity-40'
            }`}
            title={canAdjustStock ? "Edit" : "Select a branch to edit"}
          >
            <Pencil size={11} className={canAdjustStock ? "text-amber-600" : "text-slate-400"} />
          </button>

          {/* Stock Adjustment - Conditional based on canAdjustStock */}
          <button
            onClick={handleAdjustClick}
            disabled={!canAdjustStock}
            className={`p-0.5 rounded transition-colors ${
              canAdjustStock 
                ? 'hover:bg-purple-100 cursor-pointer' 
                : 'cursor-not-allowed opacity-40'
            }`}
            title={canAdjustStock ? "Stock Adjustment" : "Select a branch to adjust stock"}
          >
            {canAdjustStock ? (
              <RefreshCw size={11} className="text-purple-600" />
            ) : (
              <Lock size={11} className="text-slate-400" />
            )}
          </button>

          {/* Delete - Conditional based on canAdjustStock */}
          <button
            onClick={handleDeleteClick}
            disabled={!canAdjustStock}
            className={`p-0.5 rounded transition-colors ${
              canAdjustStock 
                ? 'hover:bg-red-100 cursor-pointer' 
                : 'cursor-not-allowed opacity-40'
            }`}
            title={canAdjustStock ? "Delete" : "Select a branch to delete"}
          >
            <Trash2 size={11} className={canAdjustStock ? "text-red-600" : "text-slate-400"} />
          </button>
        </div>
      </td>
    </tr>
  );
}));

InventoryRowFixed.displayName = 'InventoryRowFixed';
export default InventoryRowFixed;