// src/components/Shops/ShopsTable.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { ChevronUp, ChevronDown, ShoppingBag } from "lucide-react";
import ShopRow from "./ShopRow";
import Pagination from "./Pagination";

const ShopsTable = ({
  shops = [],
  currentPage = 1,
  setCurrentPage,
  rowsPerPage = 10,
  totalCount = 0,
  totalPages = 1,
}) => {
  const [columnWidths, setColumnWidths] = useState({
    slNo: 60,
    businessName: 200,
    ownerName: 180,
    businessType: 120,
    pin: 100,
    plan: 100,
    actions: 120,
  });

  const [resizing, setResizing] = useState(null);

  const handleMouseDown = (column, e) => {
    e.preventDefault();
    if (column === "slNo" || column === "actions") return;
    setResizing({ column, startX: e.clientX, startWidth: columnWidths[column] });
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!resizing) return;
      const diff = e.clientX - resizing.startX;
      const newWidth = Math.max(80, resizing.startWidth + diff);
      setColumnWidths((prev) => ({ ...prev, [resizing.column]: newWidth }));
    },
    [resizing]
  );

  const handleMouseUp = useCallback(() => setResizing(null), []);

  useEffect(() => {
    if (!resizing) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing, handleMouseMove, handleMouseUp]);

  const [sortConfig, setSortConfig] = useState({ key: null, order: null });

  const toggleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      order: prev.key === key && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  const sorted = useMemo(() => {
    const list = [...shops];
    const key = sortConfig.key;
    const order = sortConfig.order || "asc";

    const strCmp = (a, b, k) => {
      const va = (a[k] || "").toString();
      const vb = (b[k] || "").toString();
      return order === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    };

    if (["businessName", "ownerName", "businessType", "plan"].includes(key)) {
      list.sort((a, b) => strCmp(a, b, key));
    } else if (key === "pin") {
      list.sort((a, b) => {
        const pa = Number(a.location?.pin) || 0;
        const pb = Number(b.location?.pin) || 0;
        return order === "asc" ? pa - pb : pb - pa;
      });
    }

    return list;
  }, [shops, sortConfig]);

  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;

  const SortableHeader = ({ column, label, width }) => {
    const active = sortConfig.key === column;
    const asc = active && sortConfig.order === "asc";
    const desc = active && sortConfig.order === "desc";

    return (
      <th style={{ width, minWidth: width }} className="relative group select-none">
        <div
          onClick={() => toggleSort(column)}
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/10 transition-colors"
        >
          <span className="font-semibold">{label}</span>
          <div className="flex flex-col gap-0.5">
            <ChevronUp size={12} className={asc ? "text-yellow-300" : "text-white/40"} />
            <ChevronDown size={12} className={desc ? "text-yellow-300" : "text-white/40"} />
          </div>
        </div>
        <div
          onMouseDown={(e) => handleMouseDown(column, e)}
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-white/30 transition-colors"
        />
      </th>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden">

      {/* 
         FIX: Added 'min-h-0' to flex-1. 
         This prevents the table container from expanding beyond the parent's flex height.
      */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full border-collapse text-sm" style={{ minWidth: "800px" }}>
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white text-left">
              <th style={{ width: columnWidths.slNo }} className="p-3 font-semibold">#</th>
              <SortableHeader column="businessName" label="Business Name" width={columnWidths.businessName} />
              <SortableHeader column="ownerName" label="Owner Name" width={columnWidths.ownerName} />
              <SortableHeader column="businessType" label="Type" width={columnWidths.businessType} />
              <SortableHeader column="pin" label="Pin Code" width={columnWidths.pin} />
              <SortableHeader column="plan" label="Plan" width={columnWidths.plan} />
              <th style={{ width: columnWidths.actions }} className="p-3 font-semibold text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {sorted.length > 0 ? (
              sorted.map((s, idx) => (
                <ShopRow 
                  key={`shop-${startIndex + idx}`} 
                  index={startIndex + idx} 
                  shop={s} 
                />
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-12">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <ShoppingBag size={32} className="text-gray-300" />
                    </div>
                    <p className="text-lg font-medium text-gray-500 mb-1">No shops found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50/50 px-4 py-1.5 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium text-gray-700">{totalCount === 0 ? 0 : startIndex}</span> to{" "}
          <span className="font-medium text-gray-700">{Math.min(startIndex + rowsPerPage - 1, totalCount)}</span> of{" "}
          <span className="font-medium text-gray-700">{totalCount}</span> results
        </div>

        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default ShopsTable;



// src/components/Shops/ShopsTable.jsx
// import { useEffect, useMemo, useState, useCallback } from "react";
// import { ChevronUp, ChevronDown, ShoppingBag } from "lucide-react";
// import ShopRow from "./ShopRow";
// import Pagination from "./Pagination";

// const ShopsTable = ({
//   shops = [],
//   currentPage = 1,
//   setCurrentPage,
//   rowsPerPage = 10,
//   totalCount = 0,
//   totalPages = 1,
// }) => {
//   // Updated: Changed 'location' to 'pin' and adjusted width
//   const [columnWidths, setColumnWidths] = useState({
//     slNo: 60,
//     businessName: 200,
//     ownerName: 180,
//     businessType: 120,
//     pin: 100, // Reduced width for just PIN
//     plan: 100,
//     actions: 120,
//   });

//   const [resizing, setResizing] = useState(null);

//   const handleMouseDown = (column, e) => {
//     e.preventDefault();
//     if (column === "slNo" || column === "actions") return;
//     setResizing({ column, startX: e.clientX, startWidth: columnWidths[column] });
//   };

//   const handleMouseMove = useCallback(
//     (e) => {
//       if (!resizing) return;
//       const diff = e.clientX - resizing.startX;
//       const newWidth = Math.max(80, resizing.startWidth + diff);
//       setColumnWidths((prev) => ({ ...prev, [resizing.column]: newWidth }));
//     },
//     [resizing]
//   );

//   const handleMouseUp = useCallback(() => setResizing(null), []);

//   useEffect(() => {
//     if (!resizing) return;
//     window.addEventListener("mousemove", handleMouseMove);
//     window.addEventListener("mouseup", handleMouseUp);
//     return () => {
//       window.removeEventListener("mousemove", handleMouseMove);
//       window.removeEventListener("mouseup", handleMouseUp);
//     };
//   }, [resizing, handleMouseMove, handleMouseUp]);

//   // Sorting state
//   const [sortConfig, setSortConfig] = useState({ key: null, order: null });

//   const toggleSort = (key) => {
//     setSortConfig((prev) => ({
//       key,
//       order: prev.key === key && prev.order === "asc" ? "desc" : "asc",
//     }));
//   };

//   // Sorting Logic
//   const sorted = useMemo(() => {
//     const list = [...shops];
//     const key = sortConfig.key;
//     const order = sortConfig.order || "asc";

//     const strCmp = (a, b, k) => {
//       const va = (a[k] || "").toString();
//       const vb = (b[k] || "").toString();
//       return order === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
//     };

//     if (["businessName", "ownerName", "businessType", "plan"].includes(key)) {
//       list.sort((a, b) => strCmp(a, b, key));
//     } else if (key === "pin") {
//       // Numeric sort for PIN
//       list.sort((a, b) => {
//         const pa = Number(a.location?.pin) || 0;
//         const pb = Number(b.location?.pin) || 0;
//         return order === "asc" ? pa - pb : pb - pa;
//       });
//     }

//     return list;
//   }, [shops, sortConfig]);

//   const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;

//   const SortableHeader = ({ column, label, width }) => {
//     const active = sortConfig.key === column;
//     const asc = active && sortConfig.order === "asc";
//     const desc = active && sortConfig.order === "desc";

//     return (
//       <th style={{ width, minWidth: width }} className="relative group select-none">
//         <div
//           onClick={() => toggleSort(column)}
//           className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/10 transition-colors"
//         >
//           <span className="font-semibold">{label}</span>
//           <div className="flex flex-col gap-0.5">
//             <ChevronUp size={12} className={asc ? "text-yellow-300" : "text-white/40"} />
//             <ChevronDown size={12} className={desc ? "text-yellow-300" : "text-white/40"} />
//           </div>
//         </div>
//         <div
//           onMouseDown={(e) => handleMouseDown(column, e)}
//           className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-white/30 transition-colors"
//         />
//       </th>
//     );
//   };

//   return (
//     <div className="h-full flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden">

//       {/* Table Container */}
//       <div className="flex-1 overflow-auto">
//         <table className="w-full border-collapse text-sm" style={{ minWidth: "800px" }}>
//           {/* Header with Gradient */}
//           <thead className="sticky top-0 z-10">
//             <tr className="bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white text-left">
//               <th style={{ width: columnWidths.slNo }} className="p-3 font-semibold">#</th>

//               <SortableHeader column="businessName" label="Business Name" width={columnWidths.businessName} />
//               <SortableHeader column="ownerName" label="Owner Name" width={columnWidths.ownerName} />
//               <SortableHeader column="businessType" label="Type" width={columnWidths.businessType} />
              
//               {/* Updated Header Label */}
//               <SortableHeader column="pin" label="Pin Code" width={columnWidths.pin} />
              
//               <SortableHeader column="plan" label="Plan" width={columnWidths.plan} />

//               <th style={{ width: columnWidths.actions }} className="p-3 font-semibold text-center">Actions</th>
//             </tr>
//           </thead>

//           <tbody>
//             {sorted.length > 0 ? (
//               sorted.map((s, idx) => (
//                 <ShopRow 
//                   key={`shop-${startIndex + idx}`} 
//                   index={startIndex + idx} 
//                   shop={s} 
//                 />
//               ))
//             ) : (
//               /* Empty State */
//               <tr>
//                 <td colSpan="7" className="p-12">
//                   <div className="flex flex-col items-center justify-center text-gray-400">
//                     <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
//                       <ShoppingBag size={32} className="text-gray-300" />
//                     </div>
//                     <p className="text-lg font-medium text-gray-500 mb-1">No shops found</p>
//                   </div>
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Footer */}
//       <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50/50 px-4 py-1.5 flex items-center justify-between">
//         <div className="text-sm text-gray-500">
//           Showing <span className="font-medium text-gray-700">{totalCount === 0 ? 0 : startIndex}</span> to{" "}
//           <span className="font-medium text-gray-700">{Math.min(startIndex + rowsPerPage - 1, totalCount)}</span> of{" "}
//           <span className="font-medium text-gray-700">{totalCount}</span> results
//         </div>

//         <Pagination
//           totalPages={totalPages}
//           currentPage={currentPage}
//           setCurrentPage={setCurrentPage}
//         />
//       </div>
//     </div>
//   );
// };

// export default ShopsTable;