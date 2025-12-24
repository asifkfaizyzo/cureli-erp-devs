import React from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useMenuStore } from "../../../store/useMenuStore";

const InventoryTable = ({
  items,
  onView,
  onEdit,
  onDelete,
  rowsPerPage,
  startIndex,
  children,
}) => {
  const sidebarExpanded = useMenuStore((s) => s.sidebarExpanded);

  const textSize = sidebarExpanded ? "text-[11px]" : "text-[13px]";
  const px = sidebarExpanded ? "px-2" : "px-4";
  const py = sidebarExpanded ? "py-2" : "py-3";

  const emptyRows = Math.max(0, rowsPerPage - items.length);

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex-1">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white">
            <tr className="text-xs">
              {[
                "#",
                "Item Name",
                "Category",
                "Batch",
                "Supplier",
                "Expiry",
                "Status",
                "Qty",
                "S.L.R",
                "Actions",
              ].map((h) => (
                <th key={h} className={`${px} py-3 text-left`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {items.map((row, i) => (
              <tr key={row.id} className="hover:bg-blue-50/40 group">
                <td className={`${px} ${py} ${textSize}`}>
                  {startIndex + i + 1}
                </td>
                <td className={`${px} ${py} font-semibold`}>
                  {row.name}
                </td>
                <td className={`${px} ${py}`}>{row.category}</td>
                <td className={`${px} ${py}`}>{row.batch}</td>
                <td className={`${px} ${py}`}>{row.supplier}</td>
                <td className={`${px} ${py}`}>{row.expiry}</td>
                <td className={`${px} ${py}`}>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px]
                      ${
                        row.status === "In Stock"
                          ? "bg-green-100 text-green-700"
                          : row.status === "Low Stock"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className={`${px} ${py}`}>{row.qty}</td>
                <td className={`${px} ${py}`}>{row.slr}</td>

                <td className={`${px} ${py} text-center`}>
                  <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100">
                    <Eye
                      size={14}
                      onClick={() => onView(row)}
                      className="cursor-pointer text-gray-400 hover:text-blue-600"
                    />
                    <Pencil
                      size={14}
                      onClick={() => onEdit(row)}
                      className="cursor-pointer text-gray-400 hover:text-amber-600"
                    />
                    <Trash2
                      size={14}
                      onClick={() => onDelete(row)}
                      className="cursor-pointer text-gray-400 hover:text-red-600"
                    />
                  </div>
                </td>
              </tr>
            ))}

            {emptyRows > 0 &&
              [...Array(emptyRows)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={10} className={`${py}`} />
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div>{children}</div>
    </div>
  );
};

export default InventoryTable;
