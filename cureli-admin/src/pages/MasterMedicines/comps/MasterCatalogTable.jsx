// cadmin/src/pages/MasterMedicines/comps/MasterCatalogTable.jsx

import { useState, useEffect } from "react";
import {
  Search,
  X,
  Upload,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  ImageOff,
  AlertTriangle,
} from "lucide-react";
import Pagination from "../../../components/common/Pagination";
import TableEmptyState from "../../../components/common/TableEmptyState";
import StyledSelect from "../../../components/common/StyledSelect";
import { IMAGE_STATUS, getImageStatusInfo, getImageUrl } from "../../../api/cadminMasterMedicines";

const MasterCatalogTable = ({ 
  medicines = [], 
  meta = {}, 
  onViewLinked, 
  onUploadImage, 
  loading = false,
  onFiltersChange,
  onRowClick, // NEW: Handler for row click
}) => {
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [imageStatusFilter, setImageStatusFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "generic_name", order: "asc" });

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters();
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchText, typeFilter, imageStatusFilter, sortConfig]); // eslint-disable-line

  // Apply filters to parent
  const applyFilters = () => {
    const filters = {
      search: searchText.trim(),
      type: typeFilter,
      imageStatus: imageStatusFilter,
      page: 1, // Reset to page 1 on filter change
      limit: meta.limit || 20,
      sort: sortConfig.key,
      order: sortConfig.order,
    };

    onFiltersChange(filters);
  };

  // Use medicines directly from props (no local filtering)
  const displayData = medicines;

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      order: prev.key === key && prev.order === "desc" ? "asc" : "desc",
    }));
  };

  const handlePageChange = (newPage) => {
    onFiltersChange({
      search: searchText.trim(),
      type: typeFilter,
      imageStatus: imageStatusFilter,
      page: newPage,
      limit: meta.limit || 20,
      sort: sortConfig.key,
      order: sortConfig.order,
    });
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
      year: "numeric",
    });
  };

  // Type options for StyledSelect
  const typeOptions = [
    { value: "", label: "All Types" },
    { value: "DRUG", label: "Drug" },
    { value: "OTC", label: "OTC" },
  ];

  // Image status options
  const imageStatusOptions = [
    { value: "", label: "All Image Status" },
    { value: IMAGE_STATUS.VERIFIED, label: "Verified" },
    { value: IMAGE_STATUS.RAW, label: "Raw" },
    { value: IMAGE_STATUS.NONE, label: "No Image" },
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search master medicines..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full h-10 pl-9 pr-8 border border-gray-300 rounded-lg text-sm
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

          <div className="w-40">
            <StyledSelect
              value={typeFilter}
              onChange={setTypeFilter}
              options={typeOptions}
              placeholder="All Types"
            />
          </div>

          <div className="w-48">
            <StyledSelect
              value={imageStatusFilter}
              onChange={setImageStatusFilter}
              options={imageStatusOptions}
              placeholder="All Image Status"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : displayData.length === 0 ? (
          <TableEmptyState
            icon={ImageIcon}
            title="No master medicines found"
            subtitle="Try adjusting your search or filters"
          />
        ) : (
          <table className="w-full text-sm" style={{ minWidth: "1000px" }}>
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-12 px-4 py-3 text-left text-xs font-semibold text-gray-600">#</th>
                <th className="w-20 px-4 py-3 text-center text-xs font-semibold text-gray-600">
                  Image
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort("generic_name")}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
                  >
                    Name <SortIcon column="generic_name" />
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
                  Composition
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort("manufacturer")}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
                  >
                    Manufacturer <SortIcon column="manufacturer" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleSort("variant_count")}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
                  >
                    Variants <SortIcon column="variant_count" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort("updated_at")}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
                  >
                    Updated <SortIcon column="updated_at" />
                  </button>
                </th>
                <th className="w-20 px-4 py-3 text-center text-xs font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayData.map((med, index) => {
                const statusInfo = getImageStatusInfo(med.imageStatus);
                const needsAttention =
                  med.imageStatus === IMAGE_STATUS.RAW || med.imageStatus === IMAGE_STATUS.NONE;
                
                // Compute actual index from pagination
                const globalIndex = ((meta.page || 1) - 1) * (meta.limit || 20) + index + 1;

                return (
                  <tr
                    key={med.id}
                    className={`hover:bg-indigo-50/50 transition-colors cursor-pointer ${
                      needsAttention ? "bg-amber-50/30" : index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                    onClick={() => onRowClick && onRowClick(med)}
                  >
                    <td className="px-4 py-3 text-gray-500 font-medium">
                      {globalIndex}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        {med.primaryImage ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200">
                            <img
                              src={getImageUrl(med.primaryImage)}
                              alt={med.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = "flex";
                                }
                              }}
                            />
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusInfo.bgClass}`}
                              style={{ display: "none" }}
                            >
                              {med.imageStatus === IMAGE_STATUS.RAW ? (
                                <AlertTriangle size={18} className={statusInfo.textClass} />
                              ) : (
                                <ImageOff size={18} className={statusInfo.textClass} />
                              )}
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusInfo.bgClass}`}
                          >
                            <ImageOff size={18} className={statusInfo.textClass} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-[200px]">
                        <p className="font-medium text-gray-900 truncate">{med.name}</p>
                        <p className="text-xs text-gray-500 truncate">{med.packSize || "—"}</p>
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
                      <span className="truncate block max-w-[160px]">
                        {med.composition || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="truncate block max-w-[140px]">
                        {med.manufacturer || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium">
                        {med.variantCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          statusInfo.bgClass
                        } ${statusInfo.textClass}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDate(med.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click
                            onUploadImage(med);
                          }}
                          className={`p-1.5 rounded-lg ${
                            needsAttention
                              ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
                              : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                          }`}
                          title={
                            med.imageStatus === IMAGE_STATUS.NONE
                              ? "Upload Image"
                              : "Change Image"
                          }
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
      {meta.total > 0 && (
        <div className="flex-shrink-0 border-t border-gray-200">
          <Pagination
            currentPage={meta.page || 1}
            setCurrentPage={handlePageChange}
            totalItems={meta.total}
            rowsPerPage={meta.limit || 20}
          />
        </div>
      )}
    </div>
  );
};

export default MasterCatalogTable;