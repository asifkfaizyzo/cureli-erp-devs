

import React from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useMenuStore } from "../../../../store/useMenuStore";

const PurchaseTable = ({
  purchases = [],
  onView,
  onEdit,
  onDelete,
  children,
  rowsPerPage = 6,
  startIndex = 0,
}) => {
  const sidebarExpanded = useMenuStore((s) => s.sidebarExpanded);
  const safePurchases = Array.isArray(purchases) ? purchases : [];

  const textSize = sidebarExpanded ? "text-[11px]" : "text-[13px]";
  const pySize = sidebarExpanded ? "py-2" : "py-3";
  const pxSize = sidebarExpanded ? "px-2" : "px-4";

  const cellClass = `${textSize} ${pySize} ${pxSize} border-b border-gray-100 group-hover:border-blue-100 transition`;
  const headerClass = `${pxSize} py-3 h-10  text-left font-bold text-white uppercase tracking-wider bg-gradient-to-r from-[#05015A] to-[#0a0280] border-r border-blue-800 sticky top-0 z-10 whitespace-nowrap shadow-sm`;
  const emptyRowsCount = Math.max(0, rowsPerPage - safePurchases.length);

  return (
    <div className="flex flex-col h-full bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex-1 relative overflow-auto">
        <table className="w-full border-collapse">
          <thead className={headerClass}>
            <tr className={sidebarExpanded ? "text-[10px]" : "text-xs"}>
              <th>#</th>
              <th >Supplier Name</th>
              <th>Supplier ID</th>
              <th>Purchase ID</th>
              <th>Contact</th>
              <th>Purchase Date</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {safePurchases.map((row, i) => {
              const serialNumber = startIndex + i + 1;
              const formattedDate = new Date(row.purchaseDate).toLocaleDateString(
                "en-IN",
                { day: "2-digit", month: "short", year: "numeric" }
              );

              return (
                <tr key={row.purchaseId} className="hover:bg-blue-50/40 group">
                  <td className={`${cellClass} text-gray-400`}>
                    {String(serialNumber).padStart(2, "0")}
                  </td>

                  <td className={cellClass}>
                    <span className="font-semibold text-gray-700">
                      {row.supplierName}
                    </span>
                  </td>

                  <td className={cellClass}>
                    <span className="font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                      {row.supplierId}
                    </span>
                  </td>

                  <td className={cellClass}>
                    <span className="font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                      {row.purchaseId}
                    </span>
                  </td>

                  <td className={`${cellClass} text-gray-500`}>
                    {row.contact}
                  </td>

                  <td className={`${cellClass} text-gray-500`}>
                    {formattedDate}
                  </td>

                  {/* ACTIONS */}
                  <td className={`${cellClass} text-center text-gray-400`}>
                    <div className="flex justify-center gap-1">
                      {/* VIEW */}
                      <button
                        onClick={() => {
                          // console.log("📋 Table: VIEW button clicked");
                          onView?.(row, "view");
                        }}
                        className="p-1.5 rounded hover:bg-blue-50 hover:text-blue-600"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>

                      {/* EDIT */}
                      <button
                        onClick={() => {
                          // console.log("📋 Table: EDIT button clicked");
                          onEdit?.(row, "edit");
                        }}
                        className="p-1.5 rounded hover:bg-amber-50 hover:text-amber-600"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>

                      {/* DELETE */}
                      <button
                        onClick={() => {
                          // console.log("📋 Table: DELETE button clicked");
                          onDelete?.(row);
                        }}
                        className="p-1.5 rounded hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {safePurchases.length === 0 && (
              <tr>
                <td colSpan={7} className="py-20 text-center text-gray-400">
                  No purchases found
                </td>
              </tr>
            )}

            {safePurchases.length > 0 &&
              emptyRowsCount > 0 &&
              Array.from({ length: emptyRowsCount }).map((_, i) => (
                <tr key={`empty-${i}`}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className={`${cellClass} border-transparent`}>
                      &nbsp;
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-gray-200 bg-gray-50/50">
        {children}
      </div>
    </div>
  );
};

export default PurchaseTable;
