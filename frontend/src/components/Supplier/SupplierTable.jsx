// src/components/Supplier/SupplierTable.jsx

import { useState, useEffect, useCallback } from "react";
import SupplierRow from "./SupplierRow";
import SupplierPagination from "./SupplierPagination";

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
    <div className="h-full w-full flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">

      {/* SCROLL AREA (with overlay fix) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 relative">

        <table className="w-full border-collapse text-sm table-fixed">
          
          {/* HEADER */}
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white">

              <th style={{ width: columnWidths.slNo }} className="px-3 py-3 font-semibold">
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
                  className="px-3 py-3 font-semibold truncate relative"
                >
                  {label}

                  {/* Resize handle */}
                  <div
                    onMouseDown={(e) => handleMouseDown(key, e)}
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-white/30"
                  />
                </th>
              ))}

            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {data.map((item, i) => (
              <SupplierRow
                key={`sup-${i}`}
                item={item}
                index={startIndex + i}
                loading={loading}
                onRowClick={onRowClick}
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

      {/* FOOTER */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50 px-4 py-2 flex items-center justify-between">
        
        <div className="text-sm text-gray-600">
          Showing <span className="font-semibold">{startIndex}</span> to{" "}
          <span className="font-semibold">
            {Math.min(startIndex + rowsPerPage - 1, totalCount)}
          </span>{" "}
          of <span className="font-semibold">{totalCount}</span> results
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
