// cadmin/src/pages/MasterMedicines/comps/UnmappedTable.jsx

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  X,
  Link2,
  Plus,
  Ban,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Trash2,
  ChevronsUpDown,
} from "lucide-react";
import Pagination from "../../../components/common/Pagination";
import TableEmptyState from "../../../components/common/TableEmptyState";
import TableSkeleton from "../../../components/common/TableSkeleton";
import StyledSelect from "../../../components/common/StyledSelect";
import { TABLE_CONFIG, getRowBgClass } from "../../../config/tableConfig";

const { styles, heights } = TABLE_CONFIG;

const UnmappedTable = ({
  data = [],
  selectedIds = [],
  onSelectionChange,
  onMatch,
  onCreate,
  onIgnore,
  onViewDetail,
  onBulkIgnore,
  loading = false,
}) => {
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "occurrenceCount",
    order: "desc",
  });

  const defaultWidths = {
    checkbox: 48,
    name: 210,
    sampleNames: 200,
    manufacturer: 180,
    type: 80,
    count: 80,
    shops: 80,
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
          item.normalizedName.toLowerCase().includes(s) ||
          item.sampleNames?.some((n) => n.toLowerCase().includes(s)) ||
          item.manufacturers?.some((m) => m.toLowerCase().includes(s))
      );
    }

    if (typeFilter) {
      result = result.filter((item) => item.type === typeFilter);
    }

    result.sort((a, b) => {
      const av = a[sortConfig.key];
      const bv = b[sortConfig.key];

      if (typeof av === "number" && typeof bv === "number") {
        return sortConfig.order === "asc" ? av - bv : bv - av;
      }

      const as = String(av ?? "").toLowerCase();
      const bs = String(bv ?? "").toLowerCase();
      if (sortConfig.order === "asc") return as < bs ? -1 : as > bs ? 1 : 0;
      return as > bs ? -1 : as < bs ? 1 : 0;
    });

    return result;
  }, [data, searchText, typeFilter, sortConfig]);

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

  // ✅ Uses config sortIcon colors
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

  // ✅ Uses config heights.headerRow + config header.cell styles
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

        <ResizableTh col="name" sortKey="normalizedName">
          Normalized Name
        </ResizableTh>
        <ResizableTh col="sampleNames">Sample Names</ResizableTh>
        <ResizableTh col="manufacturer">Manufacturer</ResizableTh>
        <ResizableTh col="type" align="center">
          Type
        </ResizableTh>
        <ResizableTh col="count" align="center" sortKey="occurrenceCount">
          Count
        </ResizableTh>
        <ResizableTh col="shops" align="center" sortKey="shopCount">
          Shops
        </ResizableTh>
        <ResizableTh col="actions" align="center">
          Actions
        </ResizableTh>
      </tr>
    </thead>
  );

  return (
    <div className="flex flex-col h-full gap-0">
      {/* ── Filter Section ── */}
      <div className="flex-shrink-0 bg-white rounded-xl border border-gray-200 px-4 py-3 mb-2 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search name, manufacturer..."
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setCurrentPage(1);
            }}
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

        <div className="w-36">
          <StyledSelect
            value={typeFilter}
            onChange={(v) => {
              setTypeFilter(v);
              setCurrentPage(1);
            }}
            options={[
              { value: "", label: "All Types" },
              { value: "DRUG", label: "Drug" },
              { value: "OTC", label: "OTC" },
            ]}
            placeholder="All Types"
          />
        </div>

        <div className="flex-1" />

        <span className="text-xs text-gray-400">
          {totalItems} item{totalItems !== 1 ? "s" : ""}
        </span>

        {selectedIds.length > 0 && (
          <button
            onClick={onBulkIgnore}
            className="h-9 px-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium
                       flex items-center gap-2 hover:bg-red-100 transition-colors border border-red-200"
          >
            <Trash2 size={14} />
            Ignore ({selectedIds.length})
          </button>
        )}
      </div>

      {/* ── Table Card — uses config container ── */}
      <div className={styles.container.wrapper}>
        <div className="flex-1 min-h-0 overflow-auto">
          {loading ? (
            <table
              className="w-full border-collapse text-sm"
              style={{ minWidth: 900 }}
            >
              {tableHeader}
              <tbody>
                <TableSkeleton rows={rowsPerPage} columns={8} />
              </tbody>
            </table>
          ) : paginatedData.length === 0 ? (
            <TableEmptyState
              icon={Link2}
              title="No unmapped medicines"
              subtitle={
                searchText
                  ? "No results match your search"
                  : "All medicines have been mapped to the master catalog"
              }
            />
          ) : (
            <table
              className="w-full border-collapse text-sm"
              style={{ minWidth: 900 }}
            >
              {tableHeader}
              <tbody>
                {paginatedData.map((item, index) => {
                  const isSelected = selectedIds.includes(item.id);
                  const topManufacturer = item.manufacturers?.[0];
                  const extraManufacturers =
                    (item.manufacturers?.length || 0) - 1;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onViewDetail(item)}
                      className={`${
                        isSelected
                          ? "bg-indigo-50/80"
                          : getRowBgClass(index)
                      } ${styles.row.clickable}`}
                      style={{ height: `${heights.bodyRow}px` }}
                    >
                      {/* Checkbox */}
                      <td
                        className={styles.cell.base}
                        onClick={(e) => e.stopPropagation()}
                      >
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

                      {/* Normalized name */}
                      <td className={styles.cell.base}>
                        <span
                          className={`${styles.cell.primary} truncate block max-w-[200px]`}
                        >
                          {item.normalizedName}
                        </span>
                      </td>

                      {/* Sample names */}
                      <td className={styles.cell.base}>
                        <SampleNamesCell names={item.sampleNames} />
                      </td>

                      {/* Manufacturer */}
                      <td className={styles.cell.base}>
                        {topManufacturer ? (
                          <div>
                            <span
                              className={`${styles.cell.secondary} truncate block max-w-[170px]`}
                            >
                              {topManufacturer}
                            </span>
                            {extraManufacturers > 0 && (
                              <span className={`text-[10px] ${styles.cell.muted}`}>
                                +{extraManufacturers} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className={`text-xs italic ${styles.cell.muted}`}>
                            Unknown
                          </span>
                        )}
                      </td>

                      {/* Type */}
                      <td
                        className={`${styles.cell.base} ${styles.cell.center}`}
                      >
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            item.type === "DRUG"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {item.type}
                        </span>
                      </td>

                      {/* Count */}
                      <td
                        className={`${styles.cell.base} ${styles.cell.center} ${styles.cell.primary}`}
                      >
                        {item.occurrenceCount}
                      </td>

                      {/* Shops */}
                      <td
                        className={`${styles.cell.base} ${styles.cell.center} ${styles.cell.primary}`}
                      >
                        {item.shopCount}
                      </td>

                      {/* Actions */}
                      <td
                        className={styles.cell.base}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className={styles.actions.container}>
                          <button
                            onClick={() => onMatch(item)}
                            className={`${styles.actions.button.base} ${styles.actions.button.edit}`}
                            title="Match to Existing"
                          >
                            <Link2 size={14} />
                          </button>
                          <button
                            onClick={() => onCreate(item)}
                            className={`${styles.actions.button.base} ${styles.actions.button.activate}`}
                            title="Create New Master"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            onClick={() => onIgnore(item)}
                            className={`${styles.actions.button.base} ${styles.actions.button.suspend}`}
                            title="Ignore"
                          >
                            <Ban size={14} />
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

        {/* ✅ Uses config pagination wrapper */}
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

const SampleNamesCell = ({ names }) => {
  const displayName = names?.[0] ?? "—";
  const remaining = (names?.length ?? 0) - 1;
  return (
    <div className="flex items-center gap-1.5">
      <span className={`${styles.cell.secondary} truncate max-w-[170px] text-sm`}>
        {displayName}
      </span>
      {remaining > 0 && (
        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-full flex-shrink-0">
          +{remaining}
        </span>
      )}
    </div>
  );
};

export default UnmappedTable;