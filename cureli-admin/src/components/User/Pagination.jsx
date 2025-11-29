// import { MdMoreVert } from "react-icons/md";

// const UserPagination = ({ currentPage, setCurrentPage, totalPages }) => {
//   const WINDOW = 3;
//   const JUMP = 3;

//   const computeWindowStart = (page) => {
//     if (totalPages <= WINDOW) return 1;

//     let start = page - 1;
//     if (start < 1) start = 1;
//     if (start > totalPages - WINDOW + 1) start = totalPages - WINDOW + 1;

//     return start;
//   };

//   const windowStart = computeWindowStart(currentPage);
//   const windowEnd = Math.min(totalPages, windowStart + WINDOW - 1);

//   const pages = [];
//   for (let p = windowStart; p <= windowEnd; p++) pages.push(p);

//   return (
//     <div className="flex justify-center items-center gap-3 mt-1 select-none">

//       {/* PREV */}
//       <button
//         onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
//         disabled={currentPage === 1}
//         className="text-[#05015A] text-lg disabled:opacity-30"
//       >
//         ←
//       </button>

//       {/* LEFT DOTS */}
//       {windowStart > 1 && (
//         <button
//           onClick={() => setCurrentPage((p) => Math.max(1, p - JUMP))}
//           className="text-[#05015A] text-lg hover:scale-105"
//         >
//           <MdMoreVert size={18} />
//         </button>
//       )}

//       {/* PAGE BUTTONS */}
//       <div className="flex items-center gap-3">
//         {pages.map((page) => (
//           <button
//             key={page}
//             onClick={() => setCurrentPage(page)}
//             className={`text-sm transition ${
//               page === currentPage
//                 ? "bg-[#05015A] text-white w-7 h-7 rounded-full flex items-center justify-center"
//                 : "text-[#05015A] hover:text-black"
//             }`}
//           >
//             {page}
//           </button>
//         ))}
//       </div>

//       {/* RIGHT DOTS */}
//       {windowEnd < totalPages && (
//         <button
//           onClick={() => setCurrentPage((p) => Math.min(totalPages, p + JUMP))}
//           className="text-[#05015A] text-lg hover:scale-105"
//         >
//           <MdMoreVert size={18} />
//         </button>
//       )}

//       {/* NEXT */}
//       <button
//         onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
//         disabled={currentPage === totalPages}
//         className="text-[#05015A] text-lg disabled:opacity-30"
//       >
//         →
//       </button>
//     </div>
//   );
// };

// export default UserPagination;


import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

const Pagination = ({ totalPages, currentPage, setCurrentPage }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const showEllipsisStart = currentPage > 3;
    const showEllipsisEnd = currentPage < totalPages - 2;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      
      if (showEllipsisStart) pages.push("...");
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      
      if (showEllipsisEnd) pages.push("...");
      
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="flex items-center gap-1">
      {/* First */}
      <button
        onClick={() => setCurrentPage(1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronsLeft size={16} />
      </button>

      {/* Previous */}
      <button
        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1 mx-2">
        {getPageNumbers().map((page, i) => (
          page === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-400">...</span>
          ) : (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all
                ${currentPage === page
                  ? "bg-[#05015A] text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
                }`}
            >
              {page}
            </button>
          )
        ))}
      </div>

      {/* Next */}
      <button
        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight size={16} />
      </button>

      {/* Last */}
      <button
        onClick={() => setCurrentPage(totalPages)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronsRight size={16} />
      </button>
    </div>
  );
};

export default Pagination;