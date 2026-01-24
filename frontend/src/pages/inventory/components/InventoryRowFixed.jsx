// src/pages/inventory/components/InventoryRowFixed.jsx
import { memo, forwardRef, useImperativeHandle, useRef } from "react";
import { Eye, Pencil, Trash2, RefreshCw } from "lucide-react";

const InventoryRowFixed = memo(forwardRef(({
  index,
  item,
  rowNumber = 1,
  isEven = false,
  onView,
  onEdit,
  onDelete,
  onAdjust,  // Add this prop
  rowHeight = 36,
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
      default:
        return "bg-slate-100 text-slate-600 border-slate-300";
    }
  };

  const cellBase = "border-b border-r border-slate-200 last:border-r-0 p-0 overflow-hidden";

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
      `}
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
        <div className="px-1.5 py-1 h-full flex items-center">
          <span className="font-semibold text-[9px] 2xl:text-[10px] text-slate-800 truncate">
            {item.name}
          </span>
        </div>
      </td>

      {/* 3. CATEGORY */}
      <td className={`${cellBase}`}>
        <div className="px-1.5 py-1 h-full flex items-center">
          <span className="text-[9px] 2xl:text-[10px] text-slate-600 truncate">
            {item.category}
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
            {item.batch}
          </span>
        </div>
      </td>

      {/* 6. EXPIRY */}
      <td className={`${cellBase} bg-cyan-50/30`}>
        <div className="px-1 py-1 h-full flex items-center justify-center">
          <span className="text-[8px] 2xl:text-[9px] text-slate-700 font-mono">
            {item.expiry}
          </span>
        </div>
      </td>

      {/* 7. SUPPLIER */}
      <td className={`${cellBase} bg-purple-50/20`}>
        <div className="px-1.5 py-1 h-full flex items-center">
          <span className="text-[9px] 2xl:text-[10px] text-slate-600 truncate">
            {item.supplier}
          </span>
        </div>
      </td>

      {/* 8. QTY */}
      <td className={`${cellBase} bg-emerald-50/60`}>
        <div className="px-1 py-1 h-full flex items-center justify-center">
          <span className={`text-[9px] 2xl:text-[10px] font-bold ${
            Number(item.qty) > 10 ? 'text-emerald-700' : 
            Number(item.qty) > 0 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {item.qty}
          </span>
        </div>
      </td>

      {/* 9. MRP */}
      <td className={`${cellBase}`}>
        <div className="px-1 py-1 h-full flex items-center justify-end">
          <span className="text-[9px] 2xl:text-[10px] text-slate-600 font-medium">
            ₹{Number(item.mrp || 0).toFixed(2)}
          </span>
        </div>
      </td>

      {/* 10. RACK */}
      <td className={`${cellBase} bg-slate-50`}>
        <div className="px-1 py-1 h-full flex items-center justify-center">
          <span className="text-[8px] 2xl:text-[9px] text-slate-600 font-mono">
            {item.rack || '-'}
          </span>
        </div>
      </td>

      {/* 11. STATUS */}
      <td className={`${cellBase}`}>
        <div className="px-1 py-1 h-full flex items-center justify-center">
          <span className={`
            px-1.5 py-0.5 rounded-full text-[8px] 2xl:text-[9px] font-medium border
            ${getStatusColor(item.status)}
          `}>
            {item.status}
          </span>
        </div>
      </td>

      {/* 12. ACTIONS - ALWAYS VISIBLE */}
      <td className={`${cellBase} bg-slate-50`}>
  <div className="px-1 py-1 h-full flex items-center justify-center gap-0.5">
    <button
      onClick={() => onView?.(item)}
      className="p-0.5 hover:bg-blue-100 rounded transition-colors"
      title="View"
    >
      <Eye size={11} className="text-blue-600" />
    </button>
    <button
      onClick={() => onEdit?.(item)}
      className="p-0.5 hover:bg-amber-100 rounded transition-colors"
      title="Edit"
    >
      <Pencil size={11} className="text-amber-600" />
    </button>
    <button
      onClick={() => onAdjust?.(item)}
      className="p-0.5 hover:bg-purple-100 rounded transition-colors"
      title="Stock Adjustment"
    >
      <RefreshCw size={11} className="text-purple-600" />
    </button>
    <button
      onClick={() => onDelete?.(item)}
      className="p-0.5 hover:bg-red-100 rounded transition-colors"
      title="Delete"
    >
      <Trash2 size={11} className="text-red-600" />
    </button>
  </div>
</td>
    </tr>
  );
}));

InventoryRowFixed.displayName = 'InventoryRowFixed';
export default InventoryRowFixed;