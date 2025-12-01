import { Eye, Pencil, Trash } from "lucide-react";

const badge = (text, color) => (
  <span className={`px-3 py-1 rounded-full text-sm font-medium ${color}`}>
    {text}
  </span>
);

const ShopRow = ({ index, shop }) => {
  return (
    <tr className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
      <td className="py-4 px-3">{index}</td>
      <td className="font-semibold px-3">{shop.businessName}</td>
      <td className="px-3">{shop.ownerName}</td>
      <td className="px-3">{shop.gst}</td>
      <td className="px-3">{shop.businessType}</td>

      {/* Verification Status */}
      <td className="px-3">
        {shop.verificationStatus === "Verified"
          ? badge("Verified", "bg-green-100 text-green-700")
          : badge("Pending", "bg-orange-100 text-orange-700")}
      </td>

      {/* Location */}
      <td className="px-3">
        {shop.location.pin}, {shop.location.place}, {shop.location.state}
      </td>

      {/* Subscription Status */}
      <td className="px-3">
        {shop.subscriptionStatus === "Active"
          ? badge("Active", "bg-green-100 text-green-700")
          : badge("Inactive", "bg-red-100 text-red-700")}
      </td>

      {/* Plan */}
      <td className="px-3">
        {badge(shop.plan, "bg-blue-100 text-blue-700")}
      </td>

      {/* Actions */}
      <td className="px-3 flex items-center gap-3">
        <Eye className="cursor-pointer" size={18} />
        <Pencil className="cursor-pointer" size={18} />
        <Trash className="cursor-pointer text-red-500" size={18} />
      </td>
    </tr>
  );
};

export default ShopRow;
