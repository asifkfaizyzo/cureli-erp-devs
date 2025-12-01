// src/components/Shops/ShopRow.jsx
import { Eye, Pencil, Trash2 } from "lucide-react";

const badge = (text, classes) => (
  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${classes}`}>
    {text}
  </span>
);

const safe = (v, fallback = "—") => {
  if (v === null || v === undefined || v === "") return fallback;
  if (typeof v === "number" && isNaN(v)) return fallback;
  return v;
};

const ShopRow = ({ index, shop }) => {
  const pinNum = Number(shop?.location?.pin);
  const pin = !isNaN(pinNum) ? pinNum : "—";
  const place = safe(shop?.location?.place);
  const state = safe(shop?.location?.state);

  return (
    <tr className={`border-b border-gray-100 ${index % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-gray-200 transition-all`}>
      <td className="p-3 text-gray-500 text-sm">{safe(index, 0)}</td>

      <td className="p-3 font-medium text-gray-900 text-sm">{safe(shop?.businessName)}</td>

      <td className="p-3 text-gray-700 text-sm">{safe(shop?.ownerName)}</td>

      <td className="p-3 text-gray-700 text-sm">{safe(shop?.gst)}</td>

      <td className="p-3 text-gray-700 text-sm">{safe(shop?.businessType)}</td>

      <td className="p-3 text-sm">
        {shop?.verificationStatus === "Verified"
          ? badge("Verified", "bg-emerald-100 text-emerald-700")
          : shop?.verificationStatus === "Pending"
          ? badge("Pending", "bg-orange-100 text-orange-700")
          : shop?.verificationStatus === "Rejected"
          ? badge("Rejected", "bg-red-100 text-red-700")
          : shop?.verificationStatus === "Partially Rejected"
          ? badge("Partially Rejected", "bg-red-50 text-red-700")
          : badge(safe(shop?.verificationStatus), "bg-gray-100 text-gray-700")}
      </td>

      <td className="p-3 text-gray-700 text-sm">{pin}, {place}, {state}</td>

      <td className="p-3 text-sm">
        {shop?.subscriptionStatus === "Active"
          ? badge("Active", "bg-emerald-100 text-emerald-700")
          : badge("Inactive", "bg-red-100 text-red-700")}
      </td>

      <td className="p-3 text-sm">
        {badge(safe(shop?.plan), "bg-blue-100 text-blue-700")}
      </td>

      <td className="p-2 text-center">
        <div className="flex items-center justify-center gap-1">
          <button className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-700 hover:bg-indigo-50" title="View">
            <Eye size={15} />
          </button>
          <button className="p-1.5 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50" title="Edit">
            <Pencil size={15} />
          </button>
          <button className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50" title="Delete">
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ShopRow;
