
import React from "react";
import { Eye, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { useMenuStore } from "../../../../store/useMenuStore";

const InvoiceTable = ({ invoices, onEdit, onDelete, onView, children }) => {
  const sidebarExpanded = useMenuStore((s) => s.sidebarExpanded);

  // --- DYNAMIC SIZING CONSTANTS ---
  const textSize = sidebarExpanded ? "text-[11px]" : "text-[13px]";
  const pySize = sidebarExpanded ? "py-2" : "py-3";
  const pxSize = sidebarExpanded ? "px-2" : "px-4";
  
  const cellClass = `${textSize} ${pySize} ${pxSize} border-b border-gray-100 group-hover:border-blue-100 transition-all duration-200`;
  const headerClass = `${pxSize} py-3 text-left font-bold text-[#000060] uppercase tracking-wider bg-gray-50 border-b border-gray-200 sticky top-0 z-10 whitespace-nowrap`;

  return (
    // Wrapper: Takes full remaining height, flex column to push children (pagination) to bottom
    <div className="flex flex-col h-full bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden transition-all duration-300">
      
      {/* Scrollable Table Area */}
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <table className="w-full text-left border-collapse">
          
          {/* STICKY HEADER */}
          <thead>
            <tr className={sidebarExpanded ? "text-[10px]" : "text-xs"}>
              <th className={`${headerClass} w-12`}>#</th>
              <th className={headerClass}>Customer Name</th>
              <th className={headerClass}>Bill No</th>
              <th className={headerClass}>Contact</th>
              <th className={headerClass}>Date</th>
              <th className={`${headerClass} text-center`}>E-Way</th>
              <th className={`${headerClass} text-right`}>Price</th>
              <th className={`${headerClass} text-center w-24`}>Actions</th>
            </tr>
          </thead>

          {/* TABLE BODY */}
          <tbody className="bg-white">
            {invoices.map((row, i) => {
              const formattedDate = new Date(row.date).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });

              return (
                <tr
                  key={row.id}
                  className="hover:bg-blue-50/40 transition-colors duration-150 group"
                >
                  {/* SL. NO */}
                  <td className={`${cellClass} font-medium text-gray-400`}>
                    {String(i + 1).padStart(2, '0')}
                  </td>

                  {/* CUSTOMER */}
                  <td className={cellClass}>
                    <span className="font-semibold text-gray-700 group-hover:text-[#000060]">
                      {row.name}
                    </span>
                  </td>

                  {/* BILL NO */}
                  <td className={cellClass}>
                    <span className="font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
                      #{row.billNo}
                    </span>
                  </td>

                  {/* PHONE */}
                  <td className={`${cellClass} text-gray-500`}>
                    {row.phone}
                  </td>

                  {/* DATE */}
                  <td className={`${cellClass} text-gray-500`}>
                    {formattedDate}
                  </td>

                  {/* E-WAY BILL */}
                  <td className={`${cellClass} text-center`}>
                    {row.eway ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-100">
                        {row.eway}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>

                  {/* PRICE */}
                  <td className={`${cellClass} text-right font-bold text-gray-800`}>
                    ₹{row.price?.toLocaleString('en-IN')}
                  </td>

                  {/* ACTIONS */}
                  <td className={`${cellClass} text-center`}>
                    <div className={`flex items-center justify-center gap-1 ${sidebarExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-200`}>
                      
                      <button 
                        onClick={() => onView?.(row)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                        title="View Details"
                      >
                        <Eye size={sidebarExpanded ? 14 : 16} />
                      </button>

                      <button 
                        onClick={() => onEdit?.(row)}
                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-all"
                        title="Edit"
                      >
                        <Pencil size={sidebarExpanded ? 14 : 16} />
                      </button>

                      <button 
                        onClick={() => onDelete?.(row)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                        title="Delete"
                      >
                        <Trash2 size={sidebarExpanded ? 14 : 16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {/* Empty State for visual height consistency if needed, or just leaves blank */}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={8} className="py-20 text-center text-gray-400 italic text-sm">
                  No invoices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 
         PAGINATION SLOT 
         Rendered as the last element in the Flex column.
         This visually acts as the "Last Row" or Footer of the table card.
      */}
      <div className="border-t border-gray-200 bg-gray-50/50">
        {children}
      </div>
    </div>
  );
};

export default InvoiceTable;