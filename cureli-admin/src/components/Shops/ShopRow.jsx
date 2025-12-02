// src/components/Shops/ShopRow.jsx
import { Eye, Pencil, Ban, CheckCircle } from "lucide-react";

const badge = (text, classes) => (
  <span
    className={`
      inline-block w-[85px] text-center py-1 text-xs font-semibold rounded-full border
      ${classes}
    `}
  >
    {text}
  </span>
);

const ShopRow = ({ index, shop }) => {
  const isActive = shop.subscriptionStatus === "Active";

  const getPlanBadge = (plan) => {
    switch (plan) {
      case "Premium": return "bg-purple-100 text-purple-700 border-purple-200";
      case "Standard": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Basic":
      default: return "bg-sky-50 text-sky-600 border-sky-200";
    }
  };

  return (
    <tr
      className={`
        border-b border-gray-100 transition-all duration-150
        ${(index - 1) % 2 === 0 ? "bg-gray-50" : "bg-white"}
        hover:bg-indigo-50
        ${!isActive ? "opacity-60 grayscale-[0.2]" : ""}
      `}
    >
      {/* SL NO */}
      <td className="p-3 text-gray-500 font-medium">{index}</td>

      {/* Business Name with Red Ban Icon if Inactive */}
      <td className="p-3 font-medium text-gray-900 truncate max-w-[200px]">
        <div className="flex items-center gap-2">
          {shop.businessName}
          {!isActive && (
            <Ban size={14} className="text-red-400 shrink-0" strokeWidth={2.5} />
          )}
        </div>
      </td>

      {/* Owner Name */}
      <td className="p-3 text-gray-600 truncate max-w-[180px]">
        {shop.ownerName}
      </td>

      {/* Business Type */}
      <td className="p-3 text-gray-600">{shop.businessType}</td>

      {/* Pin Code */}
      <td className="p-3 text-gray-600 font-medium">
        {shop.location?.pin || "N/A"}
      </td>

      {/* Plan */}
      <td className="p-3">
        {badge(shop.plan, getPlanBadge(shop.plan))}
      </td>

      {/* Actions */}
      <td className="p-2">
        <div className="flex items-center justify-center gap-1">
          <button
            className="p-1.5 rounded-lg text-gray-500 hover:text-[#05015A] hover:bg-indigo-50 transition-all"
            title="View Details"
          >
            <Eye size={16} />
          </button>

          <button
            className="p-1.5 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-all"
            title="Edit Shop"
          >
            <Pencil size={16} />
          </button>

          {isActive ? (
            <button
              className="p-1.5 rounded-lg text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-all"
              title="Suspend Plan"
            >
              <Ban size={16} />
            </button>
          ) : (
            <button
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

// // Updated Badge: Added 'inline-block', 'w-[85px]', and 'text-center'
// // so all badges look uniform in size regardless of text length.
// const badge = (text, classes) => (
//   <span
//     className={`
//       inline-block w-[85px] text-center py-1 text-xs font-semibold rounded-full border
//       ${classes}
//     `}
//   >
//     {text}
//   </span>
// );

// const ShopRow = ({ index, shop }) => {
//   const isActive = shop.subscriptionStatus === "Active";

//   // Updated Colors for Plans
//   const getPlanBadge = (plan) => {
//     switch (plan) {
//       case "Premium":
//         return "bg-purple-100 text-purple-700 border-purple-200";
//       case "Standard":
//         return "bg-blue-100 text-blue-700 border-blue-200";
//       case "Basic":
//       default:
//         return "bg-sky-50 text-sky-600 border-sky-200"; // Lighter blue for Basic
//     }
//   };

//   return (
//     <tr
//       className={`
//         border-b border-gray-100 transition-all duration-150
//         ${(index - 1) % 2 === 0 ? "bg-gray-50" : "bg-white"}
//         hover:bg-indigo-50
//       `}
//     >
//       {/* SL NO */}
//       <td className="p-3 text-gray-500 font-medium">{index}</td>

//       {/* Business Name */}
//       <td className="p-3 font-medium text-gray-900 truncate max-w-[200px]">
//         {shop.businessName}
//       </td>

//       {/* Owner Name */}
//       <td className="p-3 text-gray-600 truncate max-w-[180px]">
//         {shop.ownerName}
//       </td>

//       {/* Business Type */}
//       <td className="p-3 text-gray-600">{shop.businessType}</td>

//       {/* Pin Code */}
//       <td className="p-3 text-gray-600 font-medium">
//         {shop.location?.pin || "N/A"}
//       </td>

//       {/* Plan - Uniform Size Pills */}
//       <td className="p-3">
//         {badge(shop.plan, getPlanBadge(shop.plan))}
//       </td>

//       {/* Actions */}
//       <td className="p-2">
//         <div className="flex items-center justify-center gap-1">
//           {/* View */}
//           <button
//             className="p-1.5 rounded-lg text-gray-500 hover:text-[#05015A] hover:bg-indigo-50 transition-all"
//             title="View Details"
//           >
//             <Eye size={16} />
//           </button>

//           {/* Edit */}
//           <button
//             className="p-1.5 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-all"
//             title="Edit Shop"
//           >
//             <Pencil size={16} />
//           </button>

//           {/* Suspend / Activate Logic */}
//           {isActive ? (
//             <button
//               className="p-1.5 rounded-lg text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-all"
//               title="Suspend Plan"
//             >
//               <Ban size={16} />
//             </button>
//           ) : (
//             <button
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