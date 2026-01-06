// cureli-admin/src/pages/Communications/pages/Enquiries/components/EnquiriesTable.jsx
import {
  Eye,
  MessageSquare,
  Trash2,
  Loader2,
  Inbox,
  Search,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { format } from "date-fns";
import Pagination from "../../../../../components/common/Pagination";

const statusConfig = {
  PENDING: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    label: "Pending",
  },
  IN_PROGRESS: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
    label: "In Progress",
  },
  REPLIED: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    dot: "bg-green-500",
    label: "Replied",
  },
  CLOSED: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-300",
    dot: "bg-gray-500",
    label: "Closed",
  },
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold 
                  ${config.bg} ${config.text} border ${config.border} whitespace-nowrap`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${config.dot} flex-shrink-0`}
      />
      <span className="truncate">{config.label}</span>
    </span>
  );
};

// Header Cell
const HeaderCell = ({ children, className = "", center = false }) => (
  <th
    className={`px-2 sm:px-3 py-3 text-xs font-semibold text-white uppercase tracking-wider 
                ${center ? "text-center" : "text-left"} ${className}`}
  >
    {children}
  </th>
);

const EnquiriesTable = ({
  enquiries,
  loading,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  totalItems,
  onViewEnquiry,
  onReplyEnquiry,
  onDeleteEnquiry,
  hasActiveFilters = false,
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return "-";
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "HH:mm");
    } catch {
      return "";
    }
  };

  // Empty state content
  const renderEmptyState = () => {
    if (hasActiveFilters) {
      return (
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
            <Search size={28} className="text-amber-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">
              No enquiries match your filters
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Try adjusting or clearing your filters
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
          <Inbox size={28} className="text-gray-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">No enquiries yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Enquiries will appear here when submitted
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Scrollable table container */}
      <div className="flex-1 overflow-auto">
        <table
          className="w-full border-collapse text-sm"
          style={{ minWidth: "900px" }}
        >
          {/* Header */}
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-[#000060] to-[#0000a0] text-white text-left">
              <HeaderCell className="w-10">#</HeaderCell>
              <HeaderCell>Enquiry</HeaderCell>
              <HeaderCell>Contact Info</HeaderCell>
              <HeaderCell>Status</HeaderCell>
              <HeaderCell>Submitted</HeaderCell>
              <HeaderCell center className="w-24">
                Actions
              </HeaderCell>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {/* Loading State */}
            {loading && (
              <tr>
                <td colSpan="6" className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#000060]/10 flex items-center justify-center">
                      <Loader2
                        size={20}
                        className="animate-spin text-[#000060]"
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Loading enquiries...
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {/* Empty State */}
            {!loading && enquiries.length === 0 && (
              <tr>
                <td colSpan="6" className="px-4 py-12 text-center">
                  {renderEmptyState()}
                </td>
              </tr>
            )}

            {/* Data Rows */}
            {!loading &&
              enquiries.map((enquiry, index) => (
                <tr
                  key={enquiry.enquiry_id}
                  className={`
                    border-b border-gray-100 transition-all duration-150
                    ${index % 2 === 0 ? "bg-gray-50/50" : "bg-white"}
                    hover:bg-indigo-50/50
                  `}
                >
                  <td className="px-2 sm:px-3 py-3 text-gray-500 font-medium text-xs">
                    {(currentPage - 1) * rowsPerPage + index + 1}
                  </td>

                  <td className="px-2 sm:px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#000060]/10 flex items-center justify-center flex-shrink-0">
                        <User size={16} className="text-[#000060]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {enquiry.name}
                        </p>
                        <p className="text-[10px] font-mono text-gray-500">
                          {enquiry.enquiry_number}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-2 sm:px-3 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Mail
                          size={12}
                          className="text-gray-400 flex-shrink-0"
                        />
                        <span
                          className="text-xs text-gray-700 truncate max-w-[180px]"
                          title={enquiry.email}
                        >
                          {enquiry.email}
                        </span>
                      </div>
                      {enquiry.phone && (
                        <>
                          <span className="text-gray-300">•</span>
                          <div className="flex items-center gap-1.5">
                            <Phone
                              size={12}
                              className="text-gray-400 flex-shrink-0"
                            />
                            <span className="text-xs text-gray-600">
                              {enquiry.phone}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </td>

                  <td className="px-2 sm:px-3 py-3">
                    <StatusBadge status={enquiry.status} />
                  </td>

                  <td className="px-2 sm:px-3 py-3">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-900">
                        {formatDate(enquiry.created_at)}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {formatTime(enquiry.created_at)}
                      </span>
                    </div>
                  </td>

                  <td className="px-2 sm:px-3 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onViewEnquiry(enquiry)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#000060] 
                                   hover:bg-[#000060]/10 transition-all"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => onReplyEnquiry(enquiry)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 
                                   hover:bg-green-50 transition-all"
                        title="Send Reply"
                      >
                        <MessageSquare size={16} />
                      </button>
                      <button
                        onClick={() => onDeleteEnquiry(enquiry)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 
                                   hover:bg-red-50 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination - Acts as last row */}
      {!loading && totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalItems={totalItems}
          rowsPerPage={rowsPerPage}
        />
      )}
    </div>
  );
};

export default EnquiriesTable;
