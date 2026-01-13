// src/components/Shops/ShopRow.jsx
import { Pencil, Ban, CheckCircle } from "lucide-react"; // ❌ Remove Eye

const ShopRow = ({ index, shop, onEdit, onTogglePlan }) => { // ❌ Remove onView prop
  const isActive = shop.subscriptionStatus === "Active";

  // ... rest of component

  return (
    <tr
      className={`
        border-b border-gray-100 transition-all duration-150 group cursor-pointer
        ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}
        hover:bg-indigo-50
        ${!isActive ? "opacity-60" : ""}
      `}
      // Row click handled by parent
    >
      {/* ... other cells ... */}

      {/* Actions - Remove Eye button */}
      <td className="px-2 py-3">
        <div className="flex items-center justify-center gap-1 whitespace-nowrap">
          {/* ❌ REMOVED: Eye/View button */}

          {/* Edit */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(shop);
            }}
            className="p-1.5 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-all"
            title="Edit Shop"
          >
            <Pencil size={16} />
          </button>

          {/* Toggle Plan */}
          {isActive ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePlan?.(shop);
              }}
              className="p-1.5 rounded-lg text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-all"
              title="Suspend Plan"
            >
              <Ban size={16} />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePlan?.(shop);
              }}
              className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
              title="Reactivate Plan"
            >
              <CheckCircle size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default ShopRow;

// // src/components/Shops/ShopRow.jsx
// import { Eye, Pencil, Ban, CheckCircle } from "lucide-react";

// const ShopRow = ({ index, shop, onView, onEdit, onTogglePlan }) => {
//   const isActive = shop.subscriptionStatus === "Active";

//   // Plan badge with project-consistent styling
//   const renderPlanBadge = (plan) => {
//     let styles = "bg-sky-50 text-sky-600 border border-sky-200";

//     if (plan === "Premium") {
//       styles = "bg-purple-100 text-purple-700 border border-purple-200";
//     } else if (plan === "Standard") {
//       styles = "bg-blue-100 text-blue-700 border border-blue-200";
//     }

//     return (
//       <span
//         className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${styles}`}
//       >
//         {plan}
//       </span>
//     );
//   };

//   return (
//     <tr
//       className={`
//         border-b border-gray-100 transition-all duration-150 group
//         ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}
//         hover:bg-indigo-50
//         ${!isActive ? "opacity-60" : ""}
//       `}
//     >
//       {/* SL No */}
//       <td className="px-3 py-3 text-gray-500 font-medium">{index}</td>

//       {/* Business Name */}
//       <td className="px-3 py-3 font-medium text-gray-900 truncate">
//         <div className="flex items-center gap-2">
//           <span className="truncate" title={shop.businessName}>
//             {shop.businessName}
//           </span>

//           {!isActive && (
//             <Ban size={14} className="text-red-400 shrink-0" strokeWidth={2.5} />
//           )}
//         </div>
//       </td>

//       {/* Owner Name */}
//       <td className="px-3 py-3 text-gray-600 truncate" title={shop.ownerName}>
//         {shop.ownerName}
//       </td>

//       {/* Business Type */}
//       <td className="px-3 py-3 text-gray-600 truncate">
//         {shop.businessType}
//       </td>

//       {/* Pin Code */}
//       <td className="px-3 py-3 text-gray-600 font-medium truncate">
//         {shop.location?.pin || "N/A"}
//       </td>

//       {/* Plan */}
//       <td className="px-3 py-3">
//         {renderPlanBadge(shop.plan)}
//       </td>

//       {/* Actions */}
//       <td className="px-2 py-3">
//         <div className="flex items-center justify-center gap-1 whitespace-nowrap">

//           {/* View */}
//           <button
//             onClick={() => onView?.(shop)}
//             className="p-1.5 rounded-lg text-gray-500 hover:text-[#05015A] hover:bg-indigo-50 transition-all"
//             title="View Shop"
//           >
//             <Eye size={16} />
//           </button>

//           {/* Edit */}
//           <button
//             onClick={() => onEdit?.(shop)}
//             className="p-1.5 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-all"
//             title="Edit Shop"
//           >
//             <Pencil size={16} />
//           </button>

//           {/* Toggle Plan */}
//           {isActive ? (
//             <button
//               onClick={() => onTogglePlan?.(shop)}
//               className="p-1.5 rounded-lg text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-all"
//               title="Suspend Plan"
//             >
//               <Ban size={16} />
//             </button>
//           ) : (
//             <button
//               onClick={() => onTogglePlan?.(shop)}
//               className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
//               title="Reactivate Plan"
//             >
//               <CheckCircle size={16} />
//             </button>
//           )}
//         </div>
//       </td>
//     </tr>
//   );
// };

// export default ShopRow;
