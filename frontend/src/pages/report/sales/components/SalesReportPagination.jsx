import { ChevronLeft, ChevronRight } from "lucide-react";

const SalesReportPagination = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  return (
    <div className="flex justify-between items-center text-sm">
      <p className="text-gray-600">
        Page {currentPage} of {totalPages}
      </p>

      <div className="flex items-center gap-1">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-2 rounded disabled:opacity-40 hover:bg-slate-100"
        >
          <ChevronLeft size={16} />
        </button>

        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => onPageChange(i + 1)}
            className={`px-3 py-1 rounded ${
              currentPage === i + 1
                ? "bg-[#000060] text-white"
                : "hover:bg-slate-100"
            }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-2 rounded disabled:opacity-40 hover:bg-slate-100"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default SalesReportPagination;
