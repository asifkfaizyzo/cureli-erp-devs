// src/components/Shops/ShopsTable.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import ShopRow from "./ShopRow";
import Pagination from "./Pagination";

const ShopsTable = ({
  shops = [],
  currentPage = 1,
  setCurrentPage,
  rowsPerPage = 10,
  totalCount = 0,
  totalPages = 1,
}) => {
  // Compact column widths
  const [columnWidths, setColumnWidths] = useState({
    slNo: 45,
    businessName: 140,
    ownerName: 130,
    gst: 110,
    businessType: 110,
    verificationStatus: 120,
    location: 160,
    subscriptionStatus: 120,
    plan: 95,
    actions: 70,
  });

  const [resizing, setResizing] = useState(null);

  const handleMouseDown = (column, e) => {
    e.preventDefault();
    if (column === "slNo" || column === "actions") return;
    setResizing({ column, startX: e.clientX, startWidth: columnWidths[column] });
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!resizing) return;
      const diff = e.clientX - resizing.startX;
      const newWidth = Math.max(70, resizing.startWidth + diff);
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

  // Sorting logic
  const [sortConfig, setSortConfig] = useState({ key: null, order: null });

  const toggleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      order: prev.key === key && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  const verificationPriority = ["Verified", "Pending", "Rejected", "Partially Rejected"];
  const subscriptionPriority = ["Active", "Inactive"];
  const planPriority = ["Premium", "Standard"];

  const sorted = useMemo(() => {
    const list = [...shops];
    const { key, order } = sortConfig;
    if (!key) return list;

    const asc = order === "asc";

    const strCmp = (a, b, k) =>
      asc
        ? (a[k] || "").localeCompare(b[k] || "")
        : (b[k] || "").localeCompare(a[k] || "");

    if (["businessName", "ownerName", "businessType", "plan"].includes(key)) {
      return list.sort((a, b) => strCmp(a, b, key));
    }

    if (key === "pin") {
      return list.sort((a, b) =>
        asc
          ? Number(a.location.pin) - Number(b.location.pin)
          : Number(b.location.pin) - Number(a.location.pin)
      );
    }

    if (key === "verificationStatus") {
      return list.sort(
        (a, b) =>
          verificationPriority.indexOf(a.verificationStatus) -
          verificationPriority.indexOf(b.verificationStatus)
      );
    }

    if (key === "subscriptionStatus") {
      return list.sort(
        (a, b) =>
          subscriptionPriority.indexOf(a.subscriptionStatus) -
          subscriptionPriority.indexOf(b.subscriptionStatus)
      );
    }

    return list;
  }, [shops, sortConfig]);

  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;

  const SortableHeader = ({ column, label, width }) => {
    const active = sortConfig.key === column;
    const asc = active && sortConfig.order === "asc";
    const desc = active && sortConfig.order === "desc";

    return (
      <th style={{ width, minWidth: width }} className="relative group select-none">
        <div
          onClick={() => toggleSort(column)}
          className="flex items-center justify-between p-2 cursor-pointer"
        >
          <span className="font-semibold text-[13px]">{label}</span>
          <div className="flex flex-col">
            <ChevronUp size={12} className={asc ? "text-yellow-300" : "text-white/40"} />
            <ChevronDown size={12} className={desc ? "text-yellow-300" : "text-white/40"} />
          </div>
        </div>
        <div
          onMouseDown={(e) => handleMouseDown(column, e)}
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-white/30"
        />
      </th>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">

      {/* TABLE (No scroll, fully responsive) */}
      <table className="w-full border-collapse text-[13px]">
        <thead className="sticky top-0 bg-[#05015A] text-white z-10">
          <tr>
            <th style={{ width: columnWidths.slNo }} className="p-2 font-semibold text-[13px]">
              SL NO
            </th>

            <SortableHeader column="businessName" label="Business" width={columnWidths.businessName} />
            <SortableHeader column="ownerName" label="Owner" width={columnWidths.ownerName} />

            <th style={{ width: columnWidths.gst }} className="p-2 font-semibold relative text-[13px]">
              GST Number
              <div
                onMouseDown={(e) => handleMouseDown("gst", e)}
                className="absolute right-0 top-0 h-full w-1 cursor-col-resize"
              />
            </th>

            <SortableHeader column="businessType" label="Type" width={columnWidths.businessType} />
            <SortableHeader column="verificationStatus" label="Verification" width={columnWidths.verificationStatus} />
            <SortableHeader column="pin" label="Location (PIN)" width={columnWidths.location} />
            <SortableHeader column="subscriptionStatus" label="Subscription" width={columnWidths.subscriptionStatus} />
            <SortableHeader column="plan" label="Plan" width={columnWidths.plan} />

            <th style={{ width: columnWidths.actions }} className="p-2 font-semibold text-center text-[13px]">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {sorted.length > 0 ? (
            sorted.map((s, idx) => (
              <ShopRow key={`shop-${startIndex + idx}`} index={startIndex + idx} shop={s} />
            ))
          ) : (
            <tr>
              <td colSpan="10" className="p-10 text-center text-gray-500">
                No shops found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* FOOTER: Showing X to Y + Pagination */}
      <div className="border-t bg-gray-50 px-4 py-2 flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing <b>{startIndex}</b> to <b>{Math.min(startIndex + rowsPerPage - 1, totalCount)}</b> of{" "}
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

export default ShopsTable;
