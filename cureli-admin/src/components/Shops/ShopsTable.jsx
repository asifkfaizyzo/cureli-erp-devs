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
    slNo: 60,
    businessName: 220,
    ownerName: 160,
    gst: 150,
    businessType: 140,
    verificationStatus: 140,
    location: 200,
    subscriptionStatus: 140,
    plan: 120,
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

  // Note: shops prop is the current page slice, but sorting should operate on full dataset.
  // To keep component self-contained, we'll sort the incoming shops slice (server-side sort would be ideal).
  // If you want client-side full-data sorting, pass full data and paginate here instead.
  const sorted = useMemo(() => {
    const list = [...shops];

    const order = sortConfig.order || "asc";
    const key = sortConfig.key;

    const strCmp = (a, b, k) => {
      const va = (a[k] || "").toString();
      const vb = (b[k] || "").toString();
      return order === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    };

    if (key === "businessName" || key === "ownerName" || key === "businessType" || key === "plan") {
      list.sort((a, b) => strCmp(a, b, key));
    } else if (key === "pin") {
      list.sort((a, b) => {
        const pa = Number(a.location?.pin) || 0;
        const pb = Number(b.location?.pin) || 0;
        return order === "asc" ? pa - pb : pb - pa;
      });
    } else if (key === "verificationStatus") {
      list.sort((a, b) => {
        const ia = verificationPriority.indexOf(a.verificationStatus) !== -1 ? verificationPriority.indexOf(a.verificationStatus) : verificationPriority.length;
        const ib = verificationPriority.indexOf(b.verificationStatus) !== -1 ? verificationPriority.indexOf(b.verificationStatus) : verificationPriority.length;
        return order === "asc" ? ia - ib : ib - ia;
      });
    } else if (key === "subscriptionStatus") {
      list.sort((a, b) => {
        const ia = subscriptionPriority.indexOf(a.subscriptionStatus) !== -1 ? subscriptionPriority.indexOf(a.subscriptionStatus) : subscriptionPriority.length;
        const ib = subscriptionPriority.indexOf(b.subscriptionStatus) !== -1 ? subscriptionPriority.indexOf(b.subscriptionStatus) : subscriptionPriority.length;
        return order === "asc" ? ia - ib : ib - ia;
      });
    }

    return list;
  }, [shops, sortConfig]);

  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;

  // Sortable header component
  const SortableHeader = ({ column, label, width }) => {
    const active = sortConfig.key === column;
    const asc = active && sortConfig.order === "asc";
    const desc = active && sortConfig.order === "desc";

    return (
      <th style={{ width, minWidth: width }} className="relative group select-none">
        <div
          onClick={() => toggleSort(column)}
          className="flex items-center justify-between p-3 cursor-pointer"
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
    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm" style={{ minWidth: "1200px" }}>
          <thead className="sticky top-0 bg-[#05015A] text-white z-10">
            <tr>
              <th style={{ width: columnWidths.slNo }} className="p-3 font-semibold">SL NO</th>

              <SortableHeader column="businessName" label="Business" width={columnWidths.businessName} />
              <SortableHeader column="ownerName" label="Owner" width={columnWidths.ownerName} />

              {/* GST not sortable but resizable */}
              <th style={{ width: columnWidths.gst }} className="p-3 font-semibold relative">
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

      {/* footer: result count left + pagination right */}
      <div className="border-t bg-gray-50 px-4 py-2 flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing <b>{totalCount === 0 ? 0 : startIndex}</b> to{" "}
          <b>{Math.min(startIndex + rowsPerPage - 1, totalCount)}</b> of{" "}
          <b>{totalCount}</b> results
        </span>

        <Pagination totalPages={totalPages} currentPage={currentPage} setCurrentPage={setCurrentPage} />
      </div>
    </div>
  );
};

export default ShopsTable;
