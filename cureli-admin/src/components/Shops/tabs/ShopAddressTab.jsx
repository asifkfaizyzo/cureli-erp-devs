// src/components/Shops/tabs/ShopAddressTab.jsx

import { MapPin } from "lucide-react";
import DetailRow from "../../User/DetailRow";

const ShopAddressTab = ({ shop }) => {
  if (!shop) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <MapPin size={16} />
        Business Address
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <DetailRow label="Address" value={shop.address_line_1 || "N/A"} isEditing={false} />
        <DetailRow label="Address Line 2" value={shop.address_line_2 || "N/A"} isEditing={false} />
        <DetailRow label="City" value={shop.city || "N/A"} isEditing={false} />
        <DetailRow label="State" value={shop.state || "N/A"} isEditing={false} />
        <DetailRow label="Pincode" value={shop.pincode || "N/A"} isEditing={false} />
      </div>

      {/* Map Placeholder */}
      <div className="mt-6 h-48 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <MapPin size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Map view coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default ShopAddressTab;