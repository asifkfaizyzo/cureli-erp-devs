import { MdMoreVert } from "react-icons/md";

const VerificationPagination = ({ currentPage, setCurrentPage, totalPages }) => {
  const WINDOW = 3;
  const JUMP = 3;

  const computeWindowStart = (page) => {
    if (totalPages <= WINDOW) return 1;

    let start = page - 1;
    if (start < 1) start = 1;
    if (start > totalPages - WINDOW + 1) start = totalPages - WINDOW + 1;

    return start;
  };

  const windowStart = computeWindowStart(currentPage);
  const windowEnd = Math.min(totalPages, windowStart + WINDOW - 1);

  const pages = [];
  for (let p = windowStart; p <= windowEnd; p++) pages.push(p);

  return (
    <div className="flex justify-center items-center gap-3 mt-3 select-none">

      {/* PREV */}
      <button
        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className="text-[#05015A] text-lg disabled:opacity-30"
      >
        ←
      </button>

      {/* LEFT DOTS */}
      {windowStart > 1 && (
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - JUMP))}
          className="text-[#05015A] text-lg hover:scale-105"
        >
          <MdMoreVert size={18} />
        </button>
      )}

      {/* PAGE NUMBERS */}
      <div className="flex items-center gap-3">
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`text-sm transition ${
              page === currentPage
                ? "bg-[#05015A] text-white w-7 h-7 rounded-full flex items-center justify-center"
                : "text-[#05015A] hover:text-black"
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      {/* RIGHT DOTS */}
      {windowEnd < totalPages && (
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + JUMP))}
          className="text-[#05015A] text-lg hover:scale-105"
        >
          <MdMoreVert size={18} />
        </button>
      )}

      {/* NEXT */}
      <button
        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
        className="text-[#05015A] text-lg disabled:opacity-30"
      >
        →
      </button>
    </div>
  );
};

export default VerificationPagination;
