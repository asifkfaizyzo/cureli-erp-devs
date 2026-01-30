// src/pages/inventory/components/InventoryRowFixed.jsx

import { memo, forwardRef, useImperativeHandle, useRef } from "react";
import { Eye, Pencil, Trash2, RefreshCw, Building2, Lock } from "lucide-react";

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
            {item.name}
          </span>
          {item.hsn && item.hsn !== '-' && (
            <span className="text-[7px] 2xl:text-[8px] text-slate-400 truncate">
              HSN: {item.hsn}
            </span>
          )}
        </div>
      </td>

      {/* 3. CATEGORY */}
      <td className={`${cellBase}`}>
        <div className="px-1.5 py-1 h-full flex items-center">
          <span className="text-[9px] 2xl:text-[10px] text-slate-600 truncate">
            {item.category || '-'}
          </span>
        </div>
      </td>

      {/* 4. MANUFACTURER */}
      <td className={`${cellBase} bg-violet-50/20`}>
        <div className="px-1.5 py-1 h-full flex items-center">
          <span className="text-[9px] 2xl:text-[10px] text-slate-600 truncate">
            {item.manufacturer || item.mfac || '-'}
          </span>
        </div>
      </td>

      {/* 5. BATCH */}
      <td className={`${cellBase} bg-cyan-50/30`}>
        <div className="px-1 py-1 h-full flex items-center justify-center">
          <span className="text-[8px] 2xl:text-[9px] text-slate-700 font-mono">
            {item.batch || item.batch_number || '-'}
          </span>
        </div>
      </td>

      {/* 6. EXPIRY */}
      <td className={`${cellBase} bg-cyan-50/30`}>
        <div className="px-1 py-1 h-full flex items-center justify-center">
          <span className={`text-[8px] 2xl:text-[9px] font-mono ${getExpiryColor(item.status)}`}>
            {item.expiry || '-'}
          </span>
        </div>
      </td>

      {/* 7. BRANCH - CONDITIONAL */}
      {showBranchColumn && (
        <td className={`${cellBase} bg-indigo-50/30`}>
          <div className="px-1 py-1 h-full flex items-center justify-center">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[8px] 2xl:text-[9px] font-medium truncate max-w-full">
              <Building2 size={9} className="flex-shrink-0" />
              <span className="truncate">
                {item.branch || item.branch_name || '-'}
              </span>
            </span>
          </div>
        </td>
      )}

      {/* 8. SUPPLIER */}
      <td className={`${cellBase} bg-purple-50/20`}>
        <div className="px-1.5 py-1 h-full flex items-center">
          <span className="text-[9px] 2xl:text-[10px] text-slate-600 truncate">
            {item.supplier || item.supplier_name || '-'}
          </span>
        </div>
      </td>

      {/* 9. QTY */}
      <td className={`${cellBase} bg-emerald-50/60`}>
        <div className="px-1 py-1 h-full flex items-center justify-center">
          <span className={`text-[9px] 2xl:text-[10px] font-bold ${
            Number(item.qty || item.current_stock) > 10 ? 'text-emerald-700' : 
            Number(item.qty || item.current_stock) > 0 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {item.qty ?? item.current_stock ?? 0}
          </span>
        </div>
      </td>

      {/* 10. MRP */}
      <td className={`${cellBase}`}>
        <div className="px-1 py-1 h-full flex items-center justify-end">
          <span className="text-[9px] 2xl:text-[10px] text-slate-600 font-medium">
            ₹{Number(item.mrp || 0).toFixed(2)}
          </span>
        </div>
      </td>

      {/* 11. RACK */}
      <td className={`${cellBase} bg-slate-50`}>
        <div className="px-1 py-1 h-full flex items-center justify-center">
          <span className="text-[8px] 2xl:text-[9px] text-slate-600 font-mono">
            {item.rack || item.rack_no || '-'}
          </span>
        </div>
      </td>

      {/* 12. STATUS */}
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

      {/* 13. ACTIONS */}
      <td className={`${cellBase} bg-slate-50`}>
        <div className="px-1 py-1 h-full flex items-center justify-center gap-0.5">
          {/* View - Always enabled */}
          <button
            onClick={handleViewClick}
            className="p-0.5 hover:bg-blue-100 rounded transition-colors"
            title="View details"
          >
            <Eye size={11} className="text-blue-600" />
          </button>

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