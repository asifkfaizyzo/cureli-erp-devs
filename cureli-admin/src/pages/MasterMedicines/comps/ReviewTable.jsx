// cadmin/src/pages/MasterMedicines/comps/ReviewTable.jsx

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  X,
  Check,
  RefreshCw,
  XCircle,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  CheckSquare,
  Square,
  CheckCircle2,
  Trash2,
  Image,
  ImageOff,
  ArrowRight,
  Building2,
} from "lucide-react";
import Pagination from "../../../components/common/Pagination";
import TableEmptyState from "../../../components/common/TableEmptyState";
import TableSkeleton from "../../../components/common/TableSkeleton";
import { getConfidenceColorClasses } from "../../../api/cadminMasterMedicines";
import StyledSelect from "../../../components/common/StyledSelect";
import { TABLE_CONFIG, getRowBgClass } from "../../../config/tableConfig";

const { styles, heights } = TABLE_CONFIG;

const ReviewTable = ({
  data = [],
  selectedIds = [],
  onSelectionChange,
  onAccept,
  onChange,
  onReject,
  onBulkAccept,
  onBulkReject,
  onViewDetail,
  loading = false,
}) => {
  const [searchText, setSearchText] = useState("");
  const [confidenceFilter, setConfidenceFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "confidenceScore",
    order: "desc",
  });

  const defaultWidths = {
    checkbox: 48,
    shopMed: 210,
    arrow: 36,
    match: 210,
    confidence: 140,
    source: 140,
    actions: 130,
  };
  const [columnWidths, setColumnWidths] = useState(defaultWidths);
  const [resizing, setResizing] = useState(null);

  const handleMouseDown = (col, e) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({ col, startX: e.clientX, startWidth: columnWidths[col] });
  };
  const handleMouseMove = (e) => {
    if (!resizing) return;
    setColumnWidths((p) => ({
      ...p,
      [resizing.col]: Math.max(50, resizing.startWidth + (e.clientX - resizing.startX)),
    }));
  };
  const handleMouseUp = () => setResizing(null);

  useEffect(() => {
    if (!resizing) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing]);

  const rowsPerPage = 10;

  const filteredData = useMemo(() => {
    let result = [...data];
    if (searchText.trim()) {
      const s = searchText.toLowerCase();
      result = result.filter(
        (item) =>
          item.rawName.toLowerCase().includes(s) ||
          item.suggestedMaster?.name?.toLowerCase().includes(s) ||
          (item.shopMedicine?.manufacturer || "").toLowerCase().includes(s) ||
          (item.suggestedMaster?.manufacturer || "").toLowerCase().includes(s)
      );
    }
    if (confidenceFilter) {
      result = result.filter((item) => {
        if (confidenceFilter === "high") return item.confidenceScore >= 90;
        if (confidenceFilter === "medium")
          return item.confidenceScore >= 70 && item.confidenceScore < 90;
        if (confidenceFilter === "low") return item.confidenceScore < 70;
        return true;
      });
    }

    result.sort((a, b) => {
      let av = a[sortConfig.key];
      let bv = b[sortConfig.key];

      if (sortConfig.key === "suggestedMaster") {
        av = a.suggestedMaster?.name || "";
        bv = b.suggestedMaster?.name || "";
      }

      if (typeof av === "number" && typeof bv === "number") {
        return sortConfig.order === "asc" ? av - bv : bv - av;
      }

      const as = String(av ?? "").toLowerCase();
      const bs = String(bv ?? "").toLowerCase();
      if (sortConfig.order === "asc") return as < bs ? -1 : as > bs ? 1 : 0;
      return as > bs ? -1 : as < bs ? 1 : 0;
    });

    return result;
  }, [data, searchText, confidenceFilter, sortConfig]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage]);

  const totalItems = filteredData.length;

  const allSelected =
    paginatedData.length > 0 &&
    paginatedData.every((item) => selectedIds.includes(item.id));
  const someSelected = paginatedData.some((item) =>
    selectedIds.includes(item.id)
  );

  const toggleSelectAll = () => {
    if (allSelected) {
      onSelectionChange(
        selectedIds.filter((id) => !paginatedData.find((i) => i.id === id))
      );
    } else {
      onSelectionChange([
        ...new Set([...selectedIds, ...paginatedData.map((i) => i.id)]),
      ]);
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      order: prev.key === key && prev.order === "desc" ? "asc" : "desc",
    }));
    setCurrentPage(1);
  };

  const SortIcon = ({ sortKey }) => {
    if (!sortKey) return null;
    const isActive = sortConfig.key === sortKey;

    if (isActive) {
      return sortConfig.order === "asc" ? (
        <ChevronUp size={14} className={`${styles.header.sortIcon.active} flex-shrink-0`} />
      ) : (
        <ChevronDown size={14} className={`${styles.header.sortIcon.active} flex-shrink-0`} />
      );
    }

    return (
      <ChevronsUpDown size={14} className={`${styles.header.sortIcon.inactive} flex-shrink-0`} />
    );
  };

  const ResizableTh = ({ col, children, align = "left", sortKey }) => (
    <th
      style={{
        width: columnWidths[col],
        minWidth: 50,
        height: `${heights.headerRow}px`,
      }}
      className="relative group"
    >
      <div
        className={`flex items-center gap-1 h-full
                    ${styles.header.cell}
                    ${align === "center" ? "justify-center" : "justify-start"}
                    ${sortKey ? "cursor-pointer select-none" : ""}`}
        onClick={() => sortKey && handleSort(sortKey)}
      >
        <span className="text-sm font-semibold text-white whitespace-nowrap">
          {children}
        </span>
        <SortIcon sortKey={sortKey} />
      </div>
      <div
        onMouseDown={(e) => handleMouseDown(col, e)}
        className={styles.header.resizeHandle}
      />
    </th>
  );

  const tableHeader = (
    <thead className="sticky top-0 z-10">
      <tr className={styles.header.row}>
        {/* Checkbox */}
        <th
          style={{
            width: columnWidths.checkbox,
            minWidth: 48,
            height: `${heights.headerRow}px`,
          }}
          className="relative group"
        >
          <div className={`flex items-center h-full ${styles.header.cell}`}>
            <button
              onClick={toggleSelectAll}
              className="text-white/70 hover:text-white transition-colors"
            >
              {allSelected ? (
                <CheckSquare size={17} className="text-white" />
              ) : someSelected ? (
                <CheckSquare size={17} className="text-white/50" />
              ) : (
                <Square size={17} />
              )}
            </button>
          </div>
          <div
            onMouseDown={(e) => handleMouseDown("checkbox", e)}
            className={styles.header.resizeHandle}
          />
        </th>

        <ResizableTh col="shopMed" sortKey="rawName">Shop Medicine</ResizableTh>
        {/* Arrow spacer */}
        <th
          style={{ width: 36, minWidth: 36, height: `${heights.headerRow}px` }}
          className={styles.header.row.includes("bg-") ? "" : ""}
        />
        <ResizableTh col="match" sortKey="suggestedMaster">Suggested Match</ResizableTh>
        <ResizableTh col="confidence" align="center" sortKey="confidenceScore">Confidence</ResizableTh>
        <ResizableTh col="source" align="center">Source</ResizableTh>
        <ResizableTh col="actions" align="center">Actions</ResizableTh>
      </tr>
    </thead>
  );

  return (
    <div className="flex flex-col h-full gap-0">
      {/* ── Filter Section ── */}
      <div className="flex-shrink-0 bg-white rounded-xl border border-gray-200 px-4 py-3 mb-2 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, manufacturer..."
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
            className="w-full h-9 pl-9 pr-8 border border-gray-300 rounded-lg text-sm
                       focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          {searchText && (
            <button
              onClick={() => setSearchText("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="w-52">
          <StyledSelect
            value={confidenceFilter}
            onChange={(v) => { setConfidenceFilter(v); setCurrentPage(1); }}
            options={[
              { value: "", label: "All Confidence" },
              { value: "high", label: "High (90%+)" },
              { value: "medium", label: "Medium (70-89%)" },
              { value: "low", label: "Low (<70%)" },
            ]}
            placeholder="All Confidence"
          />
        </div>

        <div className="flex-1" />

        <span className="text-xs text-gray-400">{totalItems} item{totalItems !== 1 ? "s" : ""}</span>

        {selectedIds.length > 0 && (
          <>
            <button
              onClick={onBulkAccept}
              className="h-9 px-4 bg-green-50 text-green-600 rounded-lg text-sm font-medium
                         flex items-center gap-2 hover:bg-green-100 transition-colors border border-green-200"
            >
              <CheckCircle2 size={14} />
              Accept ({selectedIds.length})
            </button>
            <button
              onClick={onBulkReject}
              className="h-9 px-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium
                         flex items-center gap-2 hover:bg-red-100 transition-colors border border-red-200"
            >
              <Trash2 size={14} />
              Reject ({selectedIds.length})
            </button>
          </>
        )}
      </div>

      {/* ── Table Card ── */}
      <div className={styles.container.wrapper}>
        <div className="flex-1 min-h-0 overflow-auto">
          {loading ? (
            <table className="w-full border-collapse text-sm" style={{ minWidth: 900 }}>
              {tableHeader}
              <tbody>
                <TableSkeleton rows={rowsPerPage} columns={7} />
              </tbody>
            </table>
          ) : paginatedData.length === 0 ? (
            <TableEmptyState
              icon={Check}
              title="No items need review"
              subtitle="All auto-suggested matches have been processed"
            />
          ) : (
            <table className="w-full border-collapse text-sm" style={{ minWidth: 900 }}>
              {tableHeader}
              <tbody>
                {paginatedData.map((item, index) => {
                  const colors = getConfidenceColorClasses(item.confidenceScore);
                  const shopMed = item.shopMedicine || {};
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onViewDetail?.(item)}
                      className={`${
                        isSelected
                          ? "bg-indigo-50/80"
                          : getRowBgClass(index)
                      } ${styles.row.clickable}`}
                      style={{ height: `${heights.bodyRow}px` }}
                    >
                      {/* Checkbox */}
                      <td className={styles.cell.base} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleSelect(item.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {isSelected ? (
                            <CheckSquare size={17} className="text-indigo-600" />
                          ) : (
                            <Square size={17} />
                          )}
                        </button>
                      </td>

                      {/* Shop medicine */}
                      <td className={styles.cell.base}>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`${styles.cell.primary} truncate max-w-[170px]`}>
                              {item.rawName}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 ${
                                item.suggestedMaster?.type === "DRUG"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {item.suggestedMaster?.type}
                            </span>
                          </div>
                          {shopMed.manufacturer && (
                            <p className={`text-xs ${styles.cell.muted} mt-0.5 flex items-center gap-1`}>
                              <Building2 size={10} />
                              <span className="truncate max-w-[160px]">{shopMed.manufacturer}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Arrow */}
                      <td className={styles.cell.base}>
                        <ArrowRight size={15} className="text-gray-300 mx-auto" />
                      </td>

                      {/* Suggested match */}
                      <td className={styles.cell.base}>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              item.suggestedMaster?.hasImage ? "bg-green-100" : "bg-red-50"
                            }`}
                          >
                            {item.suggestedMaster?.hasImage ? (
                              <Image size={13} className="text-green-600" />
                            ) : (
                              <ImageOff size={13} className="text-red-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className={`${styles.cell.primary} truncate max-w-[160px]`}>
                              {item.suggestedMaster?.name}
                            </p>
                            <p className={`text-xs ${styles.cell.muted} truncate max-w-[160px]`}>
                              {item.suggestedMaster?.manufacturer ||
                                item.suggestedMaster?.form ||
                                item.suggestedMaster?.primaryCategory ||
                                "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Confidence */}
                      <td className={`${styles.cell.base} ${styles.cell.center}`}>
                        <div className="flex flex-col items-center gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colors.badge}`}>
                            {item.confidenceScore}%
                          </span>
                          <div className="w-14 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${colors.bg} rounded-full`}
                              style={{ width: `${item.confidenceScore}%` }}
                            />
                          </div>
                          {item.confidenceReason && (
                            <span
                              className={`text-[10px] ${styles.cell.muted} truncate max-w-[120px]`}
                              title={item.confidenceReason}
                            >
                              {item.confidenceReason}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Source */}
                      <td className={`${styles.cell.base} ${styles.cell.center}`}>
                        <p className={`text-sm ${styles.cell.primary} truncate max-w-[120px] mx-auto`}>
                          {item.shopName}
                        </p>
                        {item.branchName && (
                          <p className={`text-xs ${styles.cell.muted} truncate max-w-[120px] mx-auto`}>
                            {item.branchName}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className={styles.cell.base} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.actions.container}>
                          <button
                            onClick={() => onAccept(item)}
                            className={`${styles.actions.button.base} ${styles.actions.button.activate}`}
                            title="Accept Match"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => onChange(item)}
                            className={`${styles.actions.button.base} ${styles.actions.button.edit}`}
                            title="Change Variant"
                          >
                            <RefreshCw size={14} />
                          </button>
                          <button
                            onClick={() => onReject(item)}
                            className={`${styles.actions.button.base} ${styles.actions.button.suspend}`}
                            title="Reject"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {totalItems > 0 && !loading && (
          <div className={styles.pagination.wrapper}>
            <Pagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalItems={totalItems}
              rowsPerPage={rowsPerPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewTable;