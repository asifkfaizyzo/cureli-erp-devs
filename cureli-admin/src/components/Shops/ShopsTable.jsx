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
  // column widths (resizable except slNo & actions)
  const [columnWidths, setColumnWidths] = useState({
    slNo: 10,
    businessName: 160,
    ownerName: 140,
    gst: 140,
    businessType: 90,
    verificationStatus: 95,
    location: 190,
    subscriptionStatus: 110,
    plan: 80,
    actions: 90,
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

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, order: null });

  const toggleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      order: prev.key === key && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  // Sorting helpers
  const verificationPriority = ["Verified", "Pending", "Rejected", "Partially Rejected"];
  const subscriptionPriority = ["Active", "Inactive"];
  const planPriority = ["Premium", "Standard"];

  const sorted = useMemo(() => {
    const list = [...shops];
    const key = sortConfig.key;
    const order = sortConfig.order || "asc";

    const strCmp = (a, b, k) => {
      const va = (a[k] || "").toString();
      const vb = (b[k] || "").toString();
      return order === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    };

    if (["businessName", "ownerName", "businessType", "plan"].includes(key)) {
      list.sort((a, b) => strCmp(a, b, key));
    } else if (key === "pin") {
      list.sort((a, b) => {
        const pa = Number(a.location?.pin) || 0;
        const pb = Number(b.location?.pin) || 0;
        return order === "asc" ? pa - pb : pb - pa;
      });
    } else if (key === "verificationStatus") {
      list.sort((a, b) => {
        const ia = verificationPriority.indexOf(a.verificationStatus);
        const ib = verificationPriority.indexOf(b.verificationStatus);
        return order === "asc" ? ia - ib : ib - ia;
      });
    } else if (key === "subscriptionStatus") {
      list.sort((a, b) => {
        const ia = subscriptionPriority.indexOf(a.subscriptionStatus);
        const ib = subscriptionPriority.indexOf(b.subscriptionStatus);
        return order === "asc" ? ia - ib : ib - ia;
      });
    }

    return list;
  }, [shops, sortConfig]);

  const startIndex =
    totalCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;

  const SortableHeader = ({ column, label, width }) => {
    const active = sortConfig.key === column;
    const asc = active && sortConfig.order === "asc";
    const desc = active && sortConfig.order === "desc";

    return (
      <th style={{ width, minWidth: width }} className="relative group select-none">
        <div
          onClick={() => toggleSort(column)}
          className="flex items-center justify-between p-1 cursor-pointer"
        >
          <span className="font-semibold">{label}</span>
          <div className="flex flex-col gap-0.5">
            <ChevronUp size={12} className={asc ? "text-yellow-300" : "text-white/40"} />
            <ChevronDown size={12} className={desc ? "text-yellow-300" : "text-white/40"} />
          </div>
        </div>

        <div
          onMouseDown={(e) => handleMouseDown(column, e)}
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-white/20"
        />
      </th>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 overflow-auto">

      {/* Table - NO SCROLL */}
      <div>
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-[#05015A] text-white z-10">
            <tr>
              <th style={{ width: columnWidths.slNo }} className="p-3 font-semibold">#</th>

              <SortableHeader column="businessName" label="Business" width={columnWidths.businessName} />
              <SortableHeader column="ownerName" label="Owner" width={columnWidths.ownerName} />

              <th style={{ width: columnWidths.gst }} className="p-1 font-semibold relative">
                GST Number
                <div onMouseDown={(e) => handleMouseDown("gst", e)} className="absolute right-0 top-0 h-full w-1 cursor-col-resize" />
              </th>

              <SortableHeader column="businessType" label="Type" width={columnWidths.businessType} />
              <SortableHeader column="verificationStatus" label="Verification" width={columnWidths.verificationStatus} />
              <SortableHeader column="pin" label="Location (PIN)" width={columnWidths.location} />
              <SortableHeader column="subscriptionStatus" label="Subscription" width={columnWidths.subscriptionStatus} />
              <SortableHeader column="plan" label="Plan" width={columnWidths.plan} />

              <th style={{ width: columnWidths.actions }} className="p-3 font-semibold text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {sorted.length > 0 ? (
              sorted.map((s, idx) => (
                <ShopRow key={`shop-${startIndex + idx}`} index={startIndex + idx} shop={s} />
              ))
            ) : (
              <tr>
                <td colSpan="10" className="p-10 text-center text-gray-500">No shops found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer – INSIDE TABLE CONTAINER */}
      <div className="border-t bg-gray-50 px-4 py-2 flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing <b>{totalCount === 0 ? 0 : startIndex}</b> to{" "}
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

export default ShopsTable;
