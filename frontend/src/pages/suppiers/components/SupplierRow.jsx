// src/components/Supplier/SupplierRow.jsx

import { Eye, Pencil, Trash2 } from "lucide-react";

const SupplierRow = ({ item, index, onRowClick, loading }) => {
  
  // Empty placeholder row to maintain height
  if (item.empty) {
    return (
      <tr className={(index - 1) % 2 === 0 ? "bg-gray-50" : "bg-white"}>
        {Array.from({ length: 7 }).map((_, i) => (
          <td key={i} className="px-3 py-3">&nbsp;</td>
        ))}
      </tr>
    );
  }

  // Helper shimmer block
  const shimmer = (width = "w-24") => (
    <div className={`h-3 ${width} bg-gray-200 rounded animate-pulse`} />
  );

  return (
    <tr
      onClick={() => onRowClick(item)}
      className={`
        border-b border-gray-100 transition-all duration-150 cursor-pointer 
        ${(index - 1) % 2 === 0 ? "bg-gray-50" : "bg-white"}
        hover:bg-indigo-50
      `}
    >
      {/* SL NO */}
      <td className="px-3 py-3">
        {loading ? shimmer("w-6") : <span className="text-gray-500">{index}</span>}
      </td>

      {/* Supplier ID */}
      <td className="px-3 py-3">
        {loading ? shimmer("w-20") : (
          <span className="font-mono text-xs text-gray-700 truncate">
            {item.supplierId}
          </span>
        )}
      </td>

      {/* Name */}
      <td className="px-3 py-3">
        {loading ? shimmer("w-28") : (
          <span className="text-gray-900 font-medium truncate">
            {item.name}
          </span>
        )}
      </td>

      {/* Contact */}
      <td className="px-3 py-3">
        {loading ? shimmer("w-20") : (
          <span className="text-gray-700">{item.contact}</span>
        )}
      </td>

      {/* Email */}
      <td className="px-3 py-3">
        {loading ? shimmer("w-36") : (
          <a
            href={`mailto:${item.email}`}
            onClick={(e) => e.stopPropagation()}
            className="text-indigo-600 hover:underline truncate block"
          >
            {item.email}
          </a>
        )}
      </td>

      {/* GST */}
      <td className="px-3 py-3">
        {loading ? shimmer("w-24") : (
          <span className="text-gray-700 truncate">{item.gst}</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-3 py-3">
        {loading ? (
          <div className="flex gap-2">
            {shimmer("w-3")}
            {shimmer("w-3")}
            {shimmer("w-3")}
          </div>
        ) : (
          <div className="flex gap-2">
            <Eye size={16} className="text-gray-600 hover:text-indigo-600" />
            <Pencil size={16} className="text-gray-600 hover:text-indigo-600" />
            <Trash2 size={16} className="text-red-500 hover:text-red-600" />
          </div>
        )}
      </td>

    </tr>
  );
};

export default SupplierRow;
