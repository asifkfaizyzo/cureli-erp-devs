import { useState, useEffect, useCallback } from "react";
import SupplierRow from "./SupplierRow";
import { useMenuStore } from "../../../store/useMenuStore";

const SupplierTable = ({
  data = [],
  rowsPerPage,
  startIndex,
  loading,
  onRowClick,
  children // For pagination slot
}) => {
  const sidebarExpanded = useMenuStore?.((s) => s.sidebarExpanded) || false;

  // --- DYNAMIC SIZING CONSTANTS ---
  const textSize = sidebarExpanded ? "text-[11px]" : "text-[13px]";
  const pySize = sidebarExpanded ? "py-2" : "py-3";
  const pxSize = sidebarExpanded ? "px-2" : "px-4";

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
                cellClass={`${textSize} ${pySize} ${pxSize} border-b border-gray-100 group-hover:border-blue-100 transition-all duration-200`}
              />
            ))}
          </tbody>
        </table>

        {/* ANTI-BLINK LOADING OVERLAY */}
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

      {/* PAGINATION SLOT */}
      {children}
    </div>
  );
};

export default SupplierTable;
