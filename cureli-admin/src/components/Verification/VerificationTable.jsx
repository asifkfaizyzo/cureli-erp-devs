import { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
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

  /* ----------------------------- COLUMN WIDTHS ----------------------------- */
  const [columnWidths, setColumnWidths] = useState({
    slNo: 50,
    shopName: 160,
    shopId: 110,
    ownerName: 150,
    email: 180,
    status: 110,
    subCount: 100,
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
      const newWidth = Math.max(80, resizing.startWidth + diff);
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

  /* ----------------------------- SORT STATE ----------------------------- */

  const isActive = (column, dir) =>
    sortField === column && sortOrder === dir;

  /* ----------------------------- SORTABLE HEADER ----------------------------- */

  const SortHeader = ({ field, label, width }) => {
    const asc = isActive(field, "asc");
    const desc = isActive(field, "desc");

    return (
      <th
        style={{ width, minWidth: width }}
        className="p-2 font-semibold text-[12px] relative select-none cursor-pointer"
        onClick={() => triggerSort(field, asc ? "desc" : "asc")}
      >
        <div className="flex justify-between items-center">
          <span>{label}</span>

          <div className="flex flex-col leading-[6px]">
            <ChevronUp
              size={11}
              className={asc ? "text-yellow-300" : "text-white/50"}
            />
            <ChevronDown
              size={11}
              className={desc ? "text-yellow-300 -mt-1" : "text-white/50 -mt-1"}
            />
          </div>
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={(e) => handleMouseDown(field, e)}
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-white/30"
        />
      </th>
    );
  };

  /* ----------------------------- PAGINATION INDEX ----------------------------- */

  const startIndex =
    totalCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;

  /* ----------------------------- TABLE UI ----------------------------- */

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">

      {/* TABLE */}
      <div className="flex-1">
        <table className="w-full border-collapse text-[12px]" style={{ minWidth: "900px" }}>
          <thead className="sticky top-0 bg-gradient-to-r from-[#05015A] to-[#090174] text-white z-10">
            <tr>

              {/* SL NO */}
              <th style={{ width: columnWidths.slNo }} className="p-2 font-semibold text-[12px]">
                SL.No
              </th>

              <SortHeader field="shopName" label="Shop Name" width={columnWidths.shopName} />
              <th
                style={{ width: columnWidths.shopId }}
                className="p-2 font-semibold text-[12px] relative"
              >
                Shop ID
                <div
                  onMouseDown={(e) => handleMouseDown("shopId", e)}
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize"
                />
              </th>

              <SortHeader field="ownerName" label="Owner Name" width={columnWidths.ownerName} />
              <SortHeader field="email" label="Email" width={columnWidths.email} />

              <th
                style={{ width: columnWidths.status }}
                className="p-2 font-semibold text-[12px] relative"
              >
                Status
                <div
                  onMouseDown={(e) => handleMouseDown("status", e)}
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize"
                />
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
                <td colSpan="8" className="p-8 text-center text-gray-500">
                  No verification records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER — Pagination Inside Table */}
      <div className="border-t bg-gray-50 px-4 py-2 flex items-center justify-between text-[12px] text-gray-600">
        <span>
          Showing <b>{startIndex}</b> to{" "}
          <b>{Math.min(startIndex + rowsPerPage - 1, totalCount)}</b> of{" "}
          <b>{totalCount}</b> results
        </span>

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
