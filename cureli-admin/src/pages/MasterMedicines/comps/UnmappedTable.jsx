// cadmin/src/pages/MasterMedicines/comps/UnmappedTable.jsx

import { useState, useMemo } from "react";
import {
  Search,
  X,
  Link2,
  Plus,
  Ban,
  Eye,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Trash2,
  Store,
  Hash,
  Image,
  ImageOff,
} from "lucide-react";
import Pagination from "../../../components/common/Pagination";
import TableEmptyState from "../../../components/common/TableEmptyState";

const UnmappedTable = ({
  data = [],
  selectedIds = [],
  onSelectionChange,
  onMatch,
  onCreate,
  onIgnore,
  onViewDetail,
  onBulkIgnore,
}) => {
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: "occurrenceCount", order: "desc" });
  const rowsPerPage = 10;

  // Filter & Sort
  const filteredData = useMemo(() => {
    let result = [...data];

    // Search
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      result = result.filter(
        (item) =>
          item.normalizedName.toLowerCase().includes(search) ||
          item.sampleNames.some((name) => name.toLowerCase().includes(search))
      );
    }

    // Type filter
    if (typeFilter) {
      result = result.filter((item) => item.type === typeFilter);
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (sortConfig.order === "asc") return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

    return result;
  }, [data, searchText, typeFilter, sortConfig]);

  // Pagination
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage]);

  const totalItems = filteredData.length;

  // Selection
  const allSelected = paginatedData.length > 0 && paginatedData.every((item) => selectedIds.includes(item.id));
  const someSelected = paginatedData.some((item) => selectedIds.includes(item.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      onSelectionChange(selectedIds.filter((id) => !paginatedData.some((item) => item.id === id)));
    } else {
      const newIds = [...new Set([...selectedIds, ...paginatedData.map((item) => item.id)])];
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
    if (sortConfig.key !== column) return <ChevronDown size={14} className="text-gray-300" />;
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
        {/* Search & Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name..."
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

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 px-3 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="">All Types</option>
            <option value="DRUG">Drug</option>
            <option value="OTC">OTC</option>
          </select>

          {selectedIds.length > 0 && (
            <button
              onClick={onBulkIgnore}
              className="h-9 px-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium
                         flex items-center gap-2 hover:bg-red-100 transition-colors"
            >
              <Trash2 size={14} />
              Ignore Selected ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {paginatedData.length === 0 ? (
          <TableEmptyState
            icon={Link2}
            title="No unmapped medicines"
            subtitle="All medicines have been mapped to the master catalog"
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-12 px-4 py-3">
                  <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">
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
                    onClick={() => handleSort("normalizedName")}
                    className="flex items-center gap-1 hover:text-gray-900"
                  >
                    Normalized Name
                    <SortIcon column="normalizedName" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Sample Names</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Type</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">
                  <button
                    onClick={() => handleSort("occurrenceCount")}
                    className="flex items-center gap-1 justify-center hover:text-gray-900"
                  >
                    <Hash size={14} />
                    Count
                    <SortIcon column="occurrenceCount" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">
                  <button
                    onClick={() => handleSort("shopCount")}
                    className="flex items-center gap-1 justify-center hover:text-gray-900"
                  >
                    <Store size={14} />
                    Shops
                    <SortIcon column="shopCount" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Image</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.map((item, index) => (
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
                    <button
                      onClick={() => onViewDetail(item)}
                      className="text-gray-900 font-medium hover:text-indigo-600 transition-colors text-left"
                    >
                      {item.normalizedName}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <SampleNamesCell names={item.sampleNames} onClick={() => onViewDetail(item)} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.type === "DRUG"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {item.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-gray-700">
                    {item.occurrenceCount}
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-gray-700">
                    {item.shopCount}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.hasImageSuggestion ? (
                      <div className="w-8 h-8 mx-auto rounded-lg bg-green-100 flex items-center justify-center">
                        <Image size={16} className="text-green-600" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 mx-auto rounded-lg bg-red-100 flex items-center justify-center">
                        <ImageOff size={16} className="text-red-500" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onViewDetail(item)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => onMatch(item)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                        title="Match to Existing"
                      >
                        <Link2 size={16} />
                      </button>
                      <button
                        onClick={() => onCreate(item)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50"
                        title="Create New"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        onClick={() => onIgnore(item)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                        title="Ignore"
                      >
                        <Ban size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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

// Sample Names Cell Component
const SampleNamesCell = ({ names, onClick }) => {
  const displayName = names[0];
  const remaining = names.length - 1;

  return (
    <button onClick={onClick} className="flex items-center gap-2 text-left hover:text-indigo-600">
      <span className="text-gray-700 truncate max-w-[200px]">{displayName}</span>
      {remaining > 0 && (
        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full flex-shrink-0">
          +{remaining} more
        </span>
      )}
    </button>
  );
};

export default UnmappedTable;