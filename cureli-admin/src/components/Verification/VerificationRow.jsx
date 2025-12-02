// src/components/Verification/VerificationRow.jsx
import { Ban } from "lucide-react";

const statusColors = {
  Approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Rejected: "bg-red-100 text-red-700 border-red-200",
  "Partially Rejected": "bg-orange-100 text-orange-700 border-orange-200",
};

const VerificationRow = ({ item, index, onRowClick }) => {
  // Identify if the row is rejected to show the Icon, but NO longer blurring the row


  return (
    <tr
      onClick={() => onRowClick(item)}
      className={`
        border-b border-gray-100 transition-all duration-150 cursor-pointer group
        ${(index - 1) % 2 === 0 ? "bg-gray-50" : "bg-white"}
        hover:bg-indigo-50
      `}
    >
      {/* SL No */}
      <td className="px-3 py-3 text-gray-500 font-medium truncate">{index}</td>

      {/* Shop Name - Red Icon remains, but text is clear */}
      <td className="px-3 py-3 font-medium text-gray-900 truncate">
        <div className="flex items-center gap-2 w-full">
          <span className="truncate" title={item.shopName}>{item.shopName}</span>
        </div>
      </td>

      {/* Shop ID */}
      <td className="px-3 py-3 text-gray-600 font-mono text-xs truncate">
        {item.shopId}
      </td>

      {/* Owner Name */}
      <td className="px-3 py-3 text-gray-600 truncate" title={item.ownerName}>
        {item.ownerName}
      </td>

      {/* Email */}
      <td className="px-3 py-3 truncate">
        <a
          href={`mailto:${item.email}`}
          onClick={(e) => e.stopPropagation()}
          className="text-indigo-600 hover:text-indigo-800 hover:underline truncate block w-full"
          title={item.email}
        >
          {item.email}
        </a>
      </td>

      {/* Status Badge */}
      <td className="px-3 py-3">
        <span
          className={`
            inline-block w-[110px] text-center py-1 text-xs font-semibold rounded-full border
            ${statusColors[item.status] || "bg-gray-100 text-gray-700 border-gray-200"}
          `}
        >
          {item.status}
        </span>
      </td>

      {/* Sub Count */}
      <td className="px-3 py-3 text-left pl-6">
        <span className="inline-flex items-center justify-center bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md text-xs font-medium min-w-[30px]">
          {item.subCount}
        </span>
      </td>

      {/* Date */}
      <td className="px-3 py-3 text-gray-500 text-sm whitespace-nowrap truncate">
        {item.date}
      </td>
    </tr>
  );
};

export default VerificationRow;