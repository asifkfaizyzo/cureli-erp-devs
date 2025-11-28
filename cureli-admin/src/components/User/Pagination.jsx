import { MdMoreVert } from "react-icons/md";

const UserPagination = ({ currentPage, setCurrentPage, totalPages }) => {
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

  const goPrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const jumpBackward = () =>
    setCurrentPage(Math.max(currentPage - JUMP, 1));

  const jumpForward = () =>
    setCurrentPage(Math.min(currentPage + JUMP, totalPages));

  return (
    <div className="flex justify-center items-center gap-3 mt-3">

      {/* ← PREVIOUS */}
      <button
        onClick={goPrev}
        disabled={currentPage === 1}
        className="text-[#05015A] text-lg disabled:opacity-30"
      >
        ←
      </button>

      {/* LEFT ⋮ */}
      {windowStart > 1 && (
        <button
          onClick={jumpBackward}
          className="text-[#05015A] text-lg hover:scale-105"
        >
          <MdMoreVert size={18} />
        </button>
      )}

      {/* PAGE NUMBERS */}
      <div className="flex items-center gap-3">
        {pages.map((page) => {
          const active = page === currentPage;

          return (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`text-base transition ${
                active
                  ? "bg-[#05015A] text-white w-7 h-7 rounded-full flex items-center justify-center"
                  : "text-[#05015A] hover:text-black px-1"
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* RIGHT ⋮ */}
      {windowEnd < totalPages && (
        <button
          onClick={jumpForward}
          className="text-[#05015A] text-lg hover:scale-105"
        >
          <MdMoreVert size={18} />
        </button>
      )}

      {/* → NEXT */}
      <button
        onClick={goNext}
        disabled={currentPage === totalPages}
        className="text-[#05015A] text-lg disabled:opacity-30"
      >
        →
      </button>
    </div>
  );
};

export default UserPagination;
