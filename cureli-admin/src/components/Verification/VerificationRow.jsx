const statusColors = {
  Approved: "bg-emerald-100 text-emerald-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Rejected: "bg-red-100 text-red-700",
  "Partially Rejected": "bg-orange-100 text-orange-700",
};

const VerificationRow = ({ item, index, onRowClick }) => {
  return (
    <tr
      onClick={() => onRowClick(item)}
      className={`
        text-[12px]
        transition-all
        ${index % 2 === 0 ? "bg-white" : "bg-gray-100"}
        hover:bg-indigo-100 cursor-pointer
      `}
    >
      {/* SL No */}
      <td className="p-2 text-gray-700">{index}</td>

      {/* Shop Name */}
      <td className="p-2 text-gray-900 truncate max-w-[150px] font-medium">
        {item.shopName}
      </td>

      {/* Shop ID */}
      <td className="p-2 text-gray-700">{item.shopId}</td>

      {/* Owner Name */}
      <td className="p-2 text-gray-700 truncate max-w-[130px]">
        {item.ownerName}
      </td>

      {/* Email */}
      <td className="p-2 truncate max-w-[160px]">
        <a
          href={`mailto:${item.email}`}
          className="text-indigo-600 underline text-[12px] truncate inline-block"
        >
          {item.email}
        </a>
      </td>

      {/* Status Badge */}
      <td className="p-2">
        <span
          className={`
            px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap
            ${statusColors[item.status] || "bg-gray-100 text-gray-700"}
          `}
        >
          {item.status}
        </span>
      </td>

      {/* Sub Count */}
      <td className="p-2 text-center text-gray-700">{item.subCount}</td>

      {/* Date */}
      <td className="p-2 text-gray-700">{item.date}</td>
    </tr>
  );
};

export default VerificationRow;
