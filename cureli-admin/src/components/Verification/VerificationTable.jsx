  // const [columnWidths, setColumnWidths] = useState({
  //   slNo: 30,
  //   shopName: 160,  // Reduced
  //   shopId: 110,    // Reduced
  //   ownerName: 130, // Reduced
  //   email: 180,     // Reduced
  //   status: 110,
  //   subCount: 100,   // Reduced
  //   date: 110,
  // });


// src/components/Verification/VerificationTable.jsx
import { useState, useEffect, useCallback } from "react";
import { ChevronUp, ChevronDown, ShieldCheck } from "lucide-react";
import VerificationRow from "./VerificationRow";
import Pagination from "./VerificationPagination";

const VerificationTable = ({
  data = [],
  triggerSort,
  onRowClick,
  sortField,
  sortOrder,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  totalCount,
  totalPages
}) => {

  /* 
     1. REDUCED COLUMN WIDTHS 
     These are starting values. Since we removed minWidth on the table, 
     these will act as "weights" in a fixed layout.
  */
  const [columnWidths, setColumnWidths] = useState({
    slNo: 30,
    shopName: 160,  // Reduced
    shopId: 110,    // Reduced
    ownerName: 130, // Reduced
    email: 180,     // Reduced
    status: 110,
    subCount: 100,   // Reduced
    date: 110,
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
      const newWidth = Math.max(50, resizing.startWidth + diff); // allow smaller shrink
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

  /* ----------------------------- SORT HEADER ----------------------------- */
  const isActive = (column, dir) => sortField === column && sortOrder === dir;

  const SortHeader = ({ field, label, width }) => {
    const asc = isActive(field, "asc");
    const desc = isActive(field, "desc");

    return (
      <th
        style={{ width }} 
        className="relative group select-none cursor-pointer px-3 py-3 text-left"
      >
        <div 
          onClick={() => triggerSort(field, asc ? "desc" : "asc")}
          className="flex items-center justify-between hover:bg-white/10 transition-colors rounded p-1 -ml-1"
        >
          <span className="font-semibold truncate">{label}</span>
          <div className="flex flex-col gap-0.5 ml-1 shrink-0">
            <ChevronUp size={11} className={asc ? "text-yellow-300" : "text-white/40"} />
            <ChevronDown size={11} className={desc ? "text-yellow-300" : "text-white/40"} />
          </div>
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={(e) => handleMouseDown(field, e)}
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-white/30 transition-colors z-20"
        />
      </th>
    );
  };

  /* ----------------------------- UI RENDER ----------------------------- */
  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;

  return (
    <div className="h-full w-full flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">

      {/* 
          2. REMOVED OVERFLOW-X
          We only allow vertical scrolling (overflow-y-auto). 
          Horizontal scrolling is hidden to enforce "Fixed" layout.
      */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full min-h-0">
        
        {/* 
           3. TABLE LAYOUT
           - w-full: Takes exactly 100% width.
           - table-fixed: Respects widths but truncates if space is tight.
           - No minWidth style: Removes the force scrollbar.
        */}
        <table className="w-full border-collapse text-sm table-fixed">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white text-left">

              <th style={{ width: columnWidths.slNo }} className="px-3 py-3 font-semibold truncate">#</th>

              <SortHeader field="shopName" label="Shop Name" width={columnWidths.shopName} />
              
              <th style={{ width: columnWidths.shopId }} className="px-3 py-3 font-semibold relative group truncate text-left">
                Shop ID
                <div onMouseDown={(e) => handleMouseDown("shopId", e)} className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-white/30" />
              </th>

              <SortHeader field="ownerName" label="Owner Name" width={columnWidths.ownerName} />
              <SortHeader field="email" label="Email" width={columnWidths.email} />

              <th style={{ width: columnWidths.status }} className="px-2 py-2 font-semibold relative group truncate text-left">
                Status
                <div onMouseDown={(e) => handleMouseDown("status", e)} className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-white/30" />
              </th>

              <SortHeader field="subCount" label="Sub Count" width={columnWidths.subCount} />
              <SortHeader field="date" label="Date" width={columnWidths.date} />

            </tr>
          </thead>

          <tbody>
            {data.length > 0 ? (
              data.map((item, i) => (
                <VerificationRow
                  key={`v-${i}`}
                  item={item}
                  index={startIndex + i}
                  onRowClick={onRowClick}
                />
              ))
            ) : (
              <tr>
                <td colSpan="8" className="p-12">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <ShieldCheck size={32} className="text-gray-300" />
                    </div>
                    <p className="text-lg font-medium text-gray-500 mb-1">No verification records found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50/50 px-4 py-1.5 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium text-gray-700">{startIndex}</span> to{" "}
          <span className="font-medium text-gray-700">{Math.min(startIndex + rowsPerPage - 1, totalCount)}</span> of{" "}
          <span className="font-medium text-gray-700">{totalCount}</span> results
        </div>

        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default VerificationTable;