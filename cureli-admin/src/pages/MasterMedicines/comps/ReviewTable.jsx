// cadmin/src/pages/MasterMedicines/comps/ReviewTable.jsx

import { useState, useMemo } from "react";
import {
  Search,
  X,
  Check,
  RefreshCw,
  XCircle,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  CheckCircle2,
  Trash2,
  Store,
  Image,
  ImageOff,
  ArrowRight,
} from "lucide-react";
import Pagination from "../../../components/common/Pagination";
import TableEmptyState from "../../../components/common/TableEmptyState";
import { getConfidenceColorClasses } from "../../../api/cadminMasterMedicines";
import StyledSelect from "../../../components/common/StyledSelect";
const ReviewTable = ({
  data = [],
  selectedIds = [],
  onSelectionChange,
  onAccept,
  onChange,
  onReject,
  onBulkAccept,
  onBulkReject,
}) => {
  const [searchText, setSearchText] = useState("");
  const [confidenceFilter, setConfidenceFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "confidenceScore",
    order: "desc",
  });
  const rowsPerPage = 10;

  // Filter & Sort
  const filteredData = useMemo(() => {
    let result = [...data];

    // Search
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      result = result.filter(
        (item) =>
          item.rawName.toLowerCase().includes(search) ||
          item.suggestedMaster.name.toLowerCase().includes(search),
      );
    }

    // Confidence filter
    if (confidenceFilter) {
      result = result.filter((item) => {
        if (confidenceFilter === "high") return item.confidenceScore >= 90;
        if (confidenceFilter === "medium")
          return item.confidenceScore >= 70 && item.confidenceScore < 90;
        if (confidenceFilter === "low") return item.confidenceScore < 70;
        return true;
      });
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === "suggestedMaster") {
        aVal = a.suggestedMaster.name;
        bVal = b.suggestedMaster.name;
      }
      if (sortConfig.order === "asc") return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

    return result;
  }, [data, searchText, confidenceFilter, sortConfig]);

  // Pagination
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage]);

  const totalItems = filteredData.length;

  // Selection
  const allSelected =
    paginatedData.length > 0 &&
    paginatedData.every((item) => selectedIds.includes(item.id));
  const someSelected = paginatedData.some((item) =>
    selectedIds.includes(item.id),
  );

  const toggleSelectAll = () => {
    if (allSelected) {
      onSelectionChange(
        selectedIds.filter(
          (id) => !paginatedData.some((item) => item.id === id),
        ),
      );
    } else {
      const newIds = [
        ...new Set([...selectedIds, ...paginatedData.map((item) => item.id)]),
      ];
      onSelectionChange(newIds);
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  // Sort handler
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      order: prev.key === key && prev.order === "desc" ? "asc" : "desc",
    }));
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column)
      return <ChevronDown size={14} className="text-gray-300" />;
    return sortConfig.order === "asc" ? (
      <ChevronUp size={14} className="text-indigo-600" />
    ) : (
      <ChevronDown size={14} className="text-indigo-600" />
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by raw or suggested name..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full h-9 pl-9 pr-8 border border-gray-300 rounded-lg text-sm
                         focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {searchText && (
              <button
                onClick={() => setSearchText("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="w-56">
            <StyledSelect
              value={confidenceFilter}
              onChange={setConfidenceFilter}
              options={[
                { value: "", label: "All Confidence" },
                { value: "high", label: "High (90%+)" },
                { value: "medium", label: "Medium (70-89%)" },
                { value: "low", label: "Low (<70%)" },
              ]}
              placeholder="All Confidence"
            />
          </div>

          {selectedIds.length > 0 && (
            <>
              <button
                onClick={onBulkAccept}
                className="h-9 px-4 bg-green-50 text-green-600 rounded-lg text-sm font-medium
                           flex items-center gap-2 hover:bg-green-100 transition-colors"
              >
                <CheckCircle2 size={14} />
                Accept ({selectedIds.length})
              </button>
              <button
                onClick={onBulkReject}
                className="h-9 px-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium
                           flex items-center gap-2 hover:bg-red-100 transition-colors"
              >
                <Trash2 size={14} />
                Reject ({selectedIds.length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {paginatedData.length === 0 ? (
          <TableEmptyState
            icon={Check}
            title="No items need review"
            subtitle="All auto-suggested matches have been processed"
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-12 px-4 py-3">
                  <button
                    onClick={toggleSelectAll}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {allSelected ? (
                      <CheckSquare size={18} className="text-indigo-600" />
                    ) : someSelected ? (
                      <CheckSquare size={18} className="text-indigo-300" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  <button
                    onClick={() => handleSort("rawName")}
                    className="flex items-center gap-1 hover:text-gray-900"
                  >
                    Raw Name
                    <SortIcon column="rawName" />
                  </button>
                </th>
                <th className="w-8 px-2 py-3"></th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  <button
                    onClick={() => handleSort("suggestedMaster")}
                    className="flex items-center gap-1 hover:text-gray-900"
                  >
                    Suggested Match
                    <SortIcon column="suggestedMaster" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">
                  <button
                    onClick={() => handleSort("confidenceScore")}
                    className="flex items-center gap-1 justify-center hover:text-gray-900"
                  >
                    Confidence
                    <SortIcon column="confidenceScore" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">
                  <Store size={14} className="inline mr-1" />
                  Source
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.map((item, index) => {
                const colors = getConfidenceColorClasses(item.confidenceScore);
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleSelect(item.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {selectedIds.includes(item.id) ? (
                          <CheckSquare size={18} className="text-indigo-600" />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {item.rawName}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            item.suggestedMaster.type === "DRUG"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {item.suggestedMaster.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <ArrowRight size={16} className="text-gray-300" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {item.suggestedMaster.hasImage ? (
                          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Image size={14} className="text-green-600" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                            <ImageOff size={14} className="text-red-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 truncate max-w-[200px]">
                            {item.suggestedMaster.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.suggestedMaster.manufacturer}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${colors.badge}`}
                        >
                          {item.confidenceScore}%
                        </span>
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colors.bg} rounded-full transition-all`}
                            style={{ width: `${item.confidenceScore}%` }}
                          />
                        </div>
                        <span
                          className="text-[10px] text-gray-400 truncate max-w-[100px]"
                          title={item.confidenceReason}
                        >
                          {item.confidenceReason}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="text-sm">
                        <p className="font-medium text-gray-700">
                          {item.shopName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {item.occurrenceCount} occurrences
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onAccept(item)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50"
                          title="Accept Match"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => onChange(item)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          title="Change Match"
                        >
                          <RefreshCw size={16} />
                        </button>
                        <button
                          onClick={() => onReject(item)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                          title="Reject"
                        >
                          <XCircle size={16} />
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

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex-shrink-0 border-t border-gray-200">
          <Pagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalItems={totalItems}
            rowsPerPage={rowsPerPage}
          />
        </div>
      )}
    </div>
  );
};

export default ReviewTable;
