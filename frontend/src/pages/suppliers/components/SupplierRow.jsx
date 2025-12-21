// // src/components/Supplier/SupplierRow.jsx

// import { Eye, Pencil, Trash2 } from "lucide-react";

// const SupplierRow = ({ item, index, onRowClick, loading }) => {
  
//   // Empty placeholder row to maintain height
//   if (item.empty) {
//     return (
//       <tr className={(index - 1) % 2 === 0 ? "bg-gray-50" : "bg-white"}>
//         {Array.from({ length: 7 }).map((_, i) => (
//           <td key={i} className="px-3 py-3">&nbsp;</td>
//         ))}
//       </tr>
//     );
//   }

//   // Helper shimmer block
//   const shimmer = (width = "w-24") => (
//     <div className={`h-3 ${width} bg-gray-200 rounded animate-pulse`} />
//   );

//   return (
//     <tr
//       onClick={() => onRowClick(item)}
//       className={`
//         border-b border-gray-100 transition-all duration-150 cursor-pointer 
//         ${(index - 1) % 2 === 0 ? "bg-gray-50" : "bg-white"}
//         hover:bg-indigo-50
//       `}
//     >
//       {/* SL NO */}
//       <td className="px-3 py-3">
//         {loading ? shimmer("w-6") : <span className="text-gray-500">{index}</span>}
//       </td>

//       {/* Supplier ID */}
//       <td className="px-3 py-3">
//         {loading ? shimmer("w-20") : (
//           <span className="font-mono text-xs text-gray-700 truncate">
//             {item.supplierId}
//           </span>
//         )}
//       </td>

//       {/* Name */}
//       <td className="px-3 py-3">
//         {loading ? shimmer("w-28") : (
//           <span className="text-gray-900 font-medium truncate">
//             {item.name}
//           </span>
//         )}
//       </td>

//       {/* Contact */}
//       <td className="px-3 py-3">
//         {loading ? shimmer("w-20") : (
//           <span className="text-gray-700">{item.contact}</span>
//         )}
//       </td>

//       {/* Email */}
//       <td className="px-3 py-3">
//         {loading ? shimmer("w-36") : (
//           <a
//             href={`mailto:${item.email}`}
//             onClick={(e) => e.stopPropagation()}
//             className="text-indigo-400 hover:underline truncate block"
//           >
//             {item.email}
//           </a>
//         )}
//       </td>

//       {/* GST */}
//       <td className="px-3 py-3">
//         {loading ? shimmer("w-24") : (
//           <span className="text-gray-700 truncate">{item.gst}</span>
//         )}
//       </td>

//      {/* Actions */}
// <td className="px-3 py-3">
//   <div className="flex gap-4">
//     <Eye
//       size={16}
//       className="text-gray-600 hover:text-indigo-600"
//       onClick={(e) => {
//         e.stopPropagation();
//         onRowClick("view", item);
//       }}
//     />
//     <Pencil
//       size={16}
//       className="text-gray-600 hover:text-indigo-600"
//       onClick={(e) => {
//         e.stopPropagation();
//         onRowClick("edit", item);
//       }}
//     />
//     <Trash2
//       size={16}
//       className="text-red-500 hover:text-red-600"
//       onClick={(e) => {
//         e.stopPropagation();
//         onRowClick("delete", item);
//       }}
//     />
//   </div>
// </td>


//     </tr>
//   );
// };

// export default SupplierRow;


// src/components/Supplier/SupplierRow.jsx

import { Eye, Pencil, Trash2 } from "lucide-react";
import { useMenuStore } from "../../../store/useMenuStore"; // Assuming store access

const SupplierRow = ({ item, index, onRowClick, loading }) => {
  // Use store for dynamic sizing logic if available
  const sidebarExpanded = useMenuStore?.((s) => s.sidebarExpanded) || false;

  // --- DYNAMIC SIZING CONSTANTS ---
  const textSize = sidebarExpanded ? "text-[11px]" : "text-[13px]";
  const pySize = sidebarExpanded ? "py-2" : "py-3";
  const pxSize = sidebarExpanded ? "px-2" : "px-4";
  const iconSize = sidebarExpanded ? 14 : 16;
  
  // Standard cell class matching InvoiceTable
  const cellClass = `${textSize} ${pySize} ${pxSize} border-b border-gray-100 group-hover:border-blue-100 transition-all duration-200`;

  // Empty placeholder row to maintain height
  if (item.empty) {
    return (
      <tr className="bg-white">
        {Array.from({ length: 7 }).map((_, i) => (
          <td key={i} className={`${cellClass} border-transparent`}>&nbsp;</td>
        ))}
      </tr>
    );
  }

  // Helper shimmer block
  const shimmer = (width = "w-24") => (
    <div className={`h-3 ${width} bg-gray-200 rounded animate-pulse`} />
  );

  return (
    <tr
      onClick={() => onRowClick("view", item)}
      className={`
        hover:bg-blue-50/40 transition-colors duration-150 group cursor-pointer bg-white
      `}
    >
      {/* SL NO */}
      <td className={`${cellClass} font-medium text-gray-400`}>
        {loading ? shimmer("w-6") : String(index).padStart(2, '0')}
      </td>

      {/* Supplier ID - Styled like Bill No */}
      <td className={cellClass}>
        {loading ? shimmer("w-20") : (
          <span className="font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
            {item.supplierId}
          </span>
        )}
      </td>

      {/* Name - Styled like Customer Name */}
      <td className={cellClass}>
        {loading ? shimmer("w-28") : (
          <span className="font-semibold text-gray-700 group-hover:text-[#000060]">
            {item.name}
          </span>
        )}
      </td>

      {/* Contact */}
      <td className={`${cellClass} text-gray-500`}>
        {loading ? shimmer("w-20") : item.contact}
      </td>

      {/* Email - Styled link */}
      <td className={cellClass}>
        {loading ? shimmer("w-36") : (
          <a
            href={`mailto:${item.email}`}
            onClick={(e) => e.stopPropagation()}
            className="text-gray-500 hover:text-blue-600 hover:underline truncate block transition-colors"
          >
            {item.email}
          </a>
        )}
      </td>

      {/* GST */}
      <td className={`${cellClass} text-gray-500`}>
        {loading ? shimmer("w-24") : item.gst}
      </td>

      {/* Actions - Matching InvoiceTable Layout */}
      <td className={`${cellClass}`}>
        <div className={`flex items-center gap-1 ${sidebarExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-200`}>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRowClick("view", item);
            }}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
            title="View Details"
          >
            <Eye size={iconSize} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onRowClick("edit", item);
            }}
            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-all"
            title="Edit"
          >
            <Pencil size={iconSize} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onRowClick("delete", item);
            }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
            title="Delete"
          >
            <Trash2 size={iconSize} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default SupplierRow;
