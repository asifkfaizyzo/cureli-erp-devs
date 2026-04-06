// cadmin/src/pages/MasterMedicines/comps/RawImagesTable.jsx

import { useState, useMemo } from "react";
import {
  Search,
  X,
  Upload,
  Eye,
  Link2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckSquare,
  Square,
} from "lucide-react";
import Pagination from "../../../components/common/Pagination";
import TableEmptyState from "../../../components/common/TableEmptyState";

const RawImagesTable = ({
  medicines = [],
  selectedIds = [],
  onSelectionChange,
  onUploadImage,
  onViewLinked,
}) => {
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: "updatedAt", order: "desc" });
  const rowsPerPage = 10;

  // Filter & Sort
  const filteredData = useMemo(() => {
    let result = [...medicines];

    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      result = result.filter(
        (med) =>
          med.name?.toLowerCase().includes(search) ||
          med.manufacturer?.toLowerCase().includes(search)
      );
    }

    if (typeFilter) {
      result = result.filter((med) => med.type === typeFilter);
    }

    result.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === "linkedCount") {
        aVal = a.linkedMedicines?.length || 0;
        bVal = b.linkedMedicines?.length || 0;
      }

      if (sortConfig.key === "imageCount") {
        aVal = a.images?.length || 0;
        bVal = b.images?.length || 0;
      }

      if (sortConfig.key === "updatedAt") {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      }

      if (sortConfig.order === "asc") return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

    return result;
  }, [medicines, searchText, typeFilter, sortConfig]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage]);

  const totalItems = filteredData.length;
  const startIndex = (currentPage - 1) * rowsPerPage;

  // Selection
  const allSelected =
    paginatedData.length > 0 && paginatedData.every((item) => selectedIds.includes(item.id));
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search medicines with raw images..."
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
            <div className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">
              {selectedIds.length} selected
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <AlertTriangle size={16} className="text-amber-600" />
          <p className="text-sm text-amber-700">
            <strong>Raw images</strong> are temporary scraped images. Upload verified images to
            replace them.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {paginatedData.length === 0 ? (
          <TableEmptyState
            icon={AlertTriangle}
            title="No raw images found"
            subtitle="All medicines have verified images"
          />
        ) : (
          <table className="w-full text-sm" style={{ minWidth: "900px" }}>
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
                <th className="w-12 px-4 py-3 text-left text-xs font-semibold text-gray-600">#</th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
                  >
                    Name <SortIcon column="name" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleSort("type")}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
                  >
                    Type <SortIcon column="type" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Manufacturer
                </th>
                <th className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleSort("imageCount")}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
                  >
                    Raw Images <SortIcon column="imageCount" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleSort("linkedCount")}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
                  >
                    <Link2 size={14} />
                    Linked <SortIcon column="linkedCount" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort("updatedAt")}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
                  >
                    Updated <SortIcon column="updatedAt" />
                  </button>
                </th>
                <th className="w-24 px-4 py-3 text-center text-xs font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.map((med, index) => {
                const linkedCount = med.linkedMedicines?.length || 0;
                const rawImageCount = med.images?.filter((img) => img.status === "RAW").length || 0;

                return (
                  <tr
                    key={med.id}
                    className={`hover:bg-amber-50/50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleSelect(med.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {selectedIds.includes(med.id) ? (
                          <CheckSquare size={18} className="text-indigo-600" />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-medium">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-[220px]">
                        <p className="font-medium text-gray-900 truncate">{med.name}</p>
                        <p className="text-xs text-gray-500 truncate">{med.composition || "—"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          med.type === "DRUG"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {med.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="truncate block max-w-[140px]">
                        {med.manufacturer || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">
                        {rawImageCount} raw
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onViewLinked(med)}
                        disabled={linkedCount === 0}
                        className={`px-2 py-1 rounded-lg text-sm font-medium flex items-center gap-1 mx-auto ${
                          linkedCount > 0
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <Link2 size={14} />
                        {linkedCount}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDate(med.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {linkedCount > 0 && (
                          <button
                            onClick={() => onViewLinked(med)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                            title="View Linked"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => onUploadImage(med)}
                          className="p-1.5 rounded-lg text-amber-600 bg-amber-50 hover:bg-amber-100"
                          title="Upload Verified Image"
                        >
                          <Upload size={16} />
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

export default RawImagesTable;