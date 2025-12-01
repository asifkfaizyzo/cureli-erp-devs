// src/components/common/Pagination.jsx
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  // Calculate start & end range
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-row items-center justify-between w-full">
      
      {/* Pagination buttons */}
      {/* Showing results text aligned RIGHT */}
      <span className="text-sm text-gray-600 ml-auto">
        Showing {start} to {end} results
      </span>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>

        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => onPageChange(i + 1)}
            className={`
              px-3 py-1 text-sm font-medium rounded-lg transition
              ${currentPage === i + 1 ? "bg-[#05015A] text-white" : "hover:bg-gray-100"}
            `}
          >
            {i + 1}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      
    </div>
  );
};

export default Pagination;
