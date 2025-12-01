const statusColors = {
  Approved: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Rejected: "bg-red-100 text-red-700",
  "Partially Rejected": "bg-orange-100 text-orange-700",
};

const VerificationRow = ({ item, index, onRowClick }) => {
  return (
    <tr
      className="border-r-2 border-b-2 border-white hover:bg-gray-50 text-[11px] cursor-pointer"
      onClick={() => onRowClick(item)}
    >
      <td className="py-1 px-2 border-r-2 border-b-2 border-white">{index + 1}</td>

      <td className="py-1 px-2 border-r-2 border-b-2 border-white max-w-[140px] truncate">
        {item.shopName}
      </td>

      <td className="py-1 px-2 border-r-2 border-b-2 border-white">
        {item.shopId}
      </td>

      <td className="py-1 px-2 border-r-2 border-b-2 border-white max-w-[120px] truncate">
        {item.ownerName}
      </td>

      <td className="py-1 px-2 border-r-2 border-b-2 border-white">
        <a
          href={`mailto:${item.email}`}
          className="text-blue-600 underline text-[11px] max-w-[150px] truncate inline-block"
        >
          {item.email}
        </a>
      </td>

      <td className="py-1 px-2 border-r-2 border-b-2 border-white">
        <span
          className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
            statusColors[item.status] || ""
          }`}
        >
          {item.status}
        </span>
      </td>

      <td className="py-1 px-2 border-r-2 border-b-2 border-white text-center">
        {item.subCount}
      </td>

      <td className="py-1 px-2 border-b-2 border-white">{item.date}</td>
    </tr>
  );
};

export default VerificationRow;
