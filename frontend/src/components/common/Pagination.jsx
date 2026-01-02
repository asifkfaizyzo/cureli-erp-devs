// cureli-admin\src\components\common\Pagination.jsx
import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

const Pagination = ({
  currentPage,
  setCurrentPage,
  totalItems,
  rowsPerPage,
}) => {
  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil((totalItems || 0) / (rowsPerPage || 1)));

  // Calculate display range
  const startIndex = (currentPage - 1) * rowsPerPage;
  const startItem = totalItems > 0 ? startIndex + 1 : 0;
  const endItem = Math.min(startIndex + rowsPerPage, totalItems);

  // Don't render if no items at all
  if (totalItems === 0) return null;

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const showEllipsisStart = currentPage > 3;
    const showEllipsisEnd = currentPage < totalPages - 2;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (showEllipsisStart) pages.push("ellipsis-start");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (showEllipsisEnd) pages.push("ellipsis-end");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }

    return pages;
  };

  const showControls = totalPages > 1;

  return (
    <div className="w-full flex-shrink-0 border-t border-gray-100 bg-gray-50/50 px-4 py-1.5 flex items-center justify-between">
      {/* LEFT END: Results info */}
      <div className="text-sm text-gray-500">
        Showing{" "}
        <span className="font-medium text-gray-700">{startItem}</span>
        {" "}to{" "}
        <span className="font-medium text-gray-700">{endItem}</span>
        {" "}of{" "}
        <span className="font-medium text-gray-700">{totalItems}</span>
        {" "}results
      </div>

      {/* RIGHT END: Pagination controls */}
      <div className="flex items-center gap-1">
        {showControls && (
          <>
            {/* First */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="First page"
            >
              <ChevronsLeft size={16} />
            </button>

            {/* Previous */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
          </>
        )}

        {/* Page Numbers - Always show */}
        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((page) =>
            typeof page === "string" ? (
              <span key={page} className="px-2 text-gray-400">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                disabled={totalPages === 1}
                className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all
                  ${
                    currentPage === page
                      ? "bg-[#05015A] text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }
                  ${totalPages === 1 ? "cursor-default" : ""}
                `}
              >
                {page}
              </button>
            )
          )}
        </div>

        {showControls && (
          <>
            {/* Next */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Next page"
            >
              <ChevronRight size={16} />
            </button>

            {/* Last */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Last page"
            >
              <ChevronsRight size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Pagination;