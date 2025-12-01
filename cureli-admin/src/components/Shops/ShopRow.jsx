import { Eye, Pencil, Trash2 } from "lucide-react";

const badge = (text, classes) => (
  <span
    className={`px-2 py-0.5 text-[11px] rounded-full whitespace-nowrap ${classes}`}
  >
    {text}
  </span>
);

const ShopRow = ({ index, shop }) => {
  return (
    <tr className={index % 2 === 0 ? "bg-white" : "bg-gray-100"}>
      <td className="p-2 text-[13px] text-gray-700">{index}</td>

      <td className="p-2 font-medium text-gray-900 truncate max-w-[140px]">{shop.businessName}</td>

      <td className="p-2 text-gray-700 truncate max-w-[130px]">{shop.ownerName}</td>

      <td className="p-2 text-gray-700">{shop.gst}</td>

      <td className="p-2 text-gray-700">{shop.businessType}</td>

      <td className="p-2 text-[13px]">
        {shop.verificationStatus === "Verified"
          ? badge("Verified", "bg-emerald-100 text-emerald-700")
          : shop.verificationStatus === "Pending"
          ? badge("Pending", "bg-orange-100 text-orange-700")
          : badge("Rejected", "bg-red-100 text-red-700")}
      </td>

      <td className="p-2 text-gray-700 truncate max-w-[160px]">
        {shop.location.pin}, {shop.location.place}, {shop.location.state}
      </td>

      <td className="p-2">
        {shop.subscriptionStatus === "Active"
          ? badge("Active", "bg-emerald-100 text-emerald-700")
          : badge("Inactive", "bg-red-100 text-red-700")}
      </td>

      <td className="p-2">{badge(shop.plan, "bg-blue-100 text-blue-700")}</td>

      <td className="p-2 text-center">
        <div className="flex items-center justify-center gap-1">
          <Eye size={15} className="cursor-pointer hover:text-indigo-700" />
          <Pencil size={15} className="cursor-pointer hover:text-amber-600" />
          <Trash2 size={15} className="cursor-pointer hover:text-red-600" />
        </div>
      </td>
    </tr>
  );
};

export default ShopRow;
