// src/components/Shops/Pagination.jsx
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

const Pagination = ({ totalPages, currentPage, setCurrentPage }) => {
  if (!setCurrentPage) {
    console.error("❌ Pagination missing setCurrentPage prop");
    return null;
  }

  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const leftDots = currentPage > 3;
    const rightDots = currentPage < totalPages - 2;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      if (leftDots) pages.push("dots-left");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (rightDots) pages.push("dots-right");

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setCurrentPage(1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30"
        aria-label="first"
      >
        <ChevronsLeft size={16} />
      </button>

      <button
        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30"
        aria-label="prev"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex items-center mx-2 gap-1">
        {getPageNumbers().map((page, index) =>
          typeof page === "number" ? (
            <button
              key={`page-${page}`}
              onClick={() => setCurrentPage(page)}
              className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all ${
                currentPage === page
                  ? "bg-[#05015A] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </button>
          ) : (
            <span key={`dots-${page}-${index}`} className="px-2 text-gray-400 select-none">
              …
            </span>
          )
        )}
      </div>

      <button
        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30"
        aria-label="next"
      >
        <ChevronRight size={16} />
      </button>

      <button
        onClick={() => setCurrentPage(totalPages)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30"
        aria-label="last"
      >
        <ChevronsRight size={16} />
      </button>
    </div>
  );
};

export default Pagination;
