

import { useState, useEffect, useCallback } from "react";
import SupplierRow from "./SupplierRow";
import SupplierPagination from "./SupplierPagination";
import { useMenuStore } from "../../../store/useMenuStore"; // Assuming you have this store

const SupplierTable = ({
  data = [],
  currentPage,
  setCurrentPage,
  rowsPerPage,
  totalCount,
  totalPages,
  loading,
  onRowClick
}) => {
  // Use store for dynamic sizing logic if available, or default to false
  const sidebarExpanded = useMenuStore?.((s) => s.sidebarExpanded) || false;

  // --- DYNAMIC SIZING CONSTANTS ---
  const textSize = sidebarExpanded ? "text-[11px]" : "text-[13px]";
  const pySize = sidebarExpanded ? "py-2" : "py-3";
  const pxSize = sidebarExpanded ? "px-2" : "px-4";

  // ✅ UPDATED HEADER CLASS: Gradient Background + Right Border + White Text
   const headerClass = `${pxSize} py-3 text-left h-10 font-bold text-white uppercase tracking-wider bg-gradient-to-r from-[#05015A] to-[#0a0280] border-r border-blue-800 sticky top-0 z-10 whitespace-nowrap shadow-sm`;
  const [columnWidths, setColumnWidths] = useState({
    slNo: 40,
    supplierId: 120,
    name: 160,
    contact: 120,
    email: 200,
    gst: 130,
    actions: 100,
  });

  const [resizing, setResizing] = useState(null);

  const handleMouseDown = (column, e) => {
    if (column === "slNo") return;
    setResizing({ column, startX: e.clientX, startWidth: columnWidths[column] });
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!resizing) return;
      const diff = e.clientX - resizing.startX;
      const newWidth = Math.max(60, resizing.startWidth + diff);
      setColumnWidths((prev) => ({ ...prev, [resizing.column]: newWidth }));
    },
    [resizing]
  );

  const handleMouseUp = useCallback(() => setResizing(null), []);

  useEffect(() => {
    if (!resizing) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing, handleMouseMove, handleMouseUp]);

  const startIndex =
    totalCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;

  return (
    <div className="flex flex-col h-full bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 font-poppins">

      {/* SCROLL AREA (with overlay fix) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 relative">

        <table className={`w-full text-left border-collapse table-fixed ${textSize}`}>
          
          {/* HEADER */}
          <thead className={`${headerClass} w-12`}>
            <tr className={sidebarExpanded ? "text-[10px]" : "text-xs"}>

              <th style={{ width: columnWidths.slNo }}>
                #
              </th>

              {Object.entries({
                supplierId: "Supplier ID",
                name: "Name",
                contact: "Contact",
                email: "Email",
                gst: "GST",
                actions: "Actions",
              }).map(([key, label]) => (
                <th
                  key={key}
                  style={{ width: columnWidths[key] }}
                  className={`${headerClass} relative group select-none`}
                >
                  {label}

                  {/* Resize handle */}
                  <div
                    onMouseDown={(e) => handleMouseDown(key, e)}
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-white/30 transition-colors"
                  />
                </th>
              ))}

            </tr>
          </thead>

          {/* BODY */}
          <tbody className="bg-white">
            {data.map((item, i) => (
              <SupplierRow
                key={`sup-${i}`}
                item={item}
                index={startIndex + i}
                loading={loading}
                onRowClick={onRowClick}
                // Pass styles down if needed by SupplierRow
                cellClass={`${textSize} ${pySize} ${pxSize} border-b border-gray-100 group-hover:border-blue-100 transition-all duration-200`}
              />
            ))}
          </tbody>
        </table>

        {/* ---------------------- */}
        {/* ANTI-BLINK LOADING OVERLAY */}
        {/* ---------------------- */}
        {loading && (
          <div className="
            absolute inset-0 
            bg-white/60 
            backdrop-blur-[1px]
            animate-fadeOverlay
            pointer-events-none
          " />
        )}

      </div>

      {/* FOOTER (Pagination Slot) */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50/50 px-4 py-2 flex items-center justify-between">
        
        <div className="text-xs font-medium text-gray-500">
          Showing <span className="text-[#05015A] font-bold">{startIndex}</span> - <span className="text-[#05015A] font-bold">
            {Math.min(startIndex + rowsPerPage - 1, totalCount)}
          </span> of <span className="text-gray-900">{totalCount}</span>
        </div>

        <SupplierPagination
          totalPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default SupplierTable;
