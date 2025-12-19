// // src/components/Supplier/SupplierPagination.jsx
// import {
//   ChevronLeft,
//   ChevronRight,
//   ChevronsLeft,
//   ChevronsRight,
// } from "lucide-react";

// const SupplierPagination = ({ currentPage, setCurrentPage, totalPages }) => {
//   if (totalPages <= 1) return null;

//   const getPages = () => {
//     const pages = [];
//     const showStartDots = currentPage > 3;
//     const showEndDots = currentPage < totalPages - 2;

//     if (totalPages <= 7) {
//       for (let i = 1; i <= totalPages; i++) pages.push(i);
//     } else {
//       pages.push(1);

//       if (showStartDots) pages.push("...");

//       const start = Math.max(2, currentPage - 1);
//       const end = Math.min(totalPages - 1, currentPage + 1);

//       for (let p = start; p <= end; p++) pages.push(p);

//       if (showEndDots) pages.push("...");

//       pages.push(totalPages);
//     }

//     return pages;
//   };

//   return (
//     <div className="flex items-center gap-1 select-none">

//       {/* First Page */}
//       <button
//         onClick={() => setCurrentPage(1)}
//         disabled={currentPage === 1}
//         className="p-2 rounded-md text-gray-600 hover:bg-gray-200 disabled:opacity-30"
//       >
//         <ChevronsLeft size={16} />
//       </button>

//       {/* Prev */}
//       <button
//         onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
//         disabled={currentPage === 1}
//         className="p-2 rounded-md text-gray-600 hover:bg-gray-200 disabled:opacity-30"
//       >
//         <ChevronLeft size={16} />
//       </button>

//       {/* Pages */}
//       <div className="flex items-center gap-1">
//         {getPages().map((page, i) =>
//           page === "..." ? (
//             <span key={i} className="px-2 text-gray-400">
//               ...
//             </span>
//           ) : (
//             <button
//               key={page}
//               onClick={() => setCurrentPage(page)}
//               className={`min-w-[32px] h-8 px-2 rounded-md text-sm font-medium transition-all
//                 ${
//                   currentPage === page
//                     ? "bg-[#05015A] text-white"
//                     : "text-gray-700 hover:bg-gray-200"
//                 }
//               `}
//             >
//               {page}
//             </button>
//           )
//         )}
//       </div>

//       {/* Next */}
//       <button
//         onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
//         disabled={currentPage === totalPages}
//         className="p-2 rounded-md text-gray-600 hover:bg-gray-200 disabled:opacity-30"
//       >
//         <ChevronRight size={16} />
//       </button>

//       {/* Last */}
//       <button
//         onClick={() => setCurrentPage(totalPages)}
//         disabled={currentPage === totalPages}
//         className="p-2 rounded-md text-gray-600 hover:bg-gray-200 disabled:opacity-30"
//       >
//         <ChevronsRight size={16} />
//       </button>
//     </div>
//   );
// };

// export default SupplierPagination;


// src/components/Supplier/SupplierPagination.jsx
import React from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from "lucide-react";

const SupplierPagination = ({ currentPage, setCurrentPage, totalPages }) => {
  if (totalPages <= 1) return null;

  // --- STYLING CLASSES (Matching InvoicePagination) ---
  const btnBase = "h-8 w-8 flex items-center justify-center rounded-lg text-sm transition-all duration-200 select-none";
  const btnInactive = "text-gray-500 hover:bg-gray-100 hover:text-[#05015A]";
  const btnActive = "bg-[#05015A] text-white shadow-md shadow-indigo-200 font-semibold scale-105";
  const btnNav = "p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-gray-200 transition-all";

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
    <div className="flex items-center gap-2 select-none">

      {/* First Page (ChevronsLeft) */}
      <button
        onClick={() => setCurrentPage(1)}
        disabled={currentPage === 1}
        className={btnNav}
        title="First Page"
      >
        <ChevronsLeft size={16} />
      </button>

      {/* Prev */}
      <button
        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className={btnNav}
        title="Previous Page"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Pages */}
      <div className="flex items-center gap-1 px-2">
        {getPages().map((page, i) =>
          page === "..." ? (
            <span key={i} className="px-1 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`${btnBase} ${
                currentPage === page ? btnActive : btnInactive
              }`}
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
        className={btnNav}
        title="Next Page"
      >
        <ChevronRight size={16} />
      </button>

      {/* Last Page (ChevronsRight) */}
      <button
        onClick={() => setCurrentPage(totalPages)}
        disabled={currentPage === totalPages}
        className={btnNav}
        title="Last Page"
      >
        <ChevronsRight size={16} />
      </button>
    </div>
  );
};

export default SupplierPagination;
