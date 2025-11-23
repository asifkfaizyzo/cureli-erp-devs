const InvoicePagination = ({ currentPage, setCurrentPage, totalPages }) => {
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="flex justify-center mt-2 items-center gap-3">

      {/* PREV */}
      <button
        className="p-2 rounded-full hover:bg-gray-200"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ←
      </button>

      {/* PAGE NUMBERS */}
      {Array.from({ length: totalPages }).map((_, index) => {
        const page = index + 1;
        const active = page === currentPage;

        return (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`px-3 py-2 text-sm rounded ${
              active
                ? "bg-[#05015A] text-white"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            {page}
          </button>
        );
      })}

      {/* NEXT */}
      <button
        className="p-2 rounded-full hover:bg-gray-200"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        →
      </button>
    </div>
  );
};

export default InvoicePagination;
