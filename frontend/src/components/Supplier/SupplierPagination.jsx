// src/components/Supplier/SupplierPagination.jsx
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

const SupplierPagination = ({ currentPage, setCurrentPage, totalPages }) => {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    const showStartDots = currentPage > 3;
    const showEndDots = currentPage < totalPages - 2;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      if (showStartDots) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let p = start; p <= end; p++) pages.push(p);

      if (showEndDots) pages.push("...");

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex items-center gap-1 select-none">

      {/* First Page */}
      <button
        onClick={() => setCurrentPage(1)}
        disabled={currentPage === 1}
        className="p-2 rounded-md text-gray-600 hover:bg-gray-200 disabled:opacity-30"
      >
        <ChevronsLeft size={16} />
      </button>

      {/* Prev */}
      <button
        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className="p-2 rounded-md text-gray-600 hover:bg-gray-200 disabled:opacity-30"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Pages */}
      <div className="flex items-center gap-1">
        {getPages().map((page, i) =>
          page === "..." ? (
            <span key={i} className="px-2 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`min-w-[32px] h-8 px-2 rounded-md text-sm font-medium transition-all
                ${
                  currentPage === page
                    ? "bg-[#05015A] text-white"
                    : "text-gray-700 hover:bg-gray-200"
                }
              `}
            >
              {page}
            </button>
          )
        )}
      </div>

      {/* Next */}
      <button
        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
        className="p-2 rounded-md text-gray-600 hover:bg-gray-200 disabled:opacity-30"
      >
        <ChevronRight size={16} />
      </button>

      {/* Last */}
      <button
        onClick={() => setCurrentPage(totalPages)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-md text-gray-600 hover:bg-gray-200 disabled:opacity-30"
      >
        <ChevronsRight size={16} />
      </button>
    </div>
  );
};

export default SupplierPagination;
