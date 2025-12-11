// src/components/Shops/tabs/ShopEditAddressTab.jsx

import { MapPin } from "lucide-react";
import DetailRow from "../../User/DetailRow";

// Indian states for dropdown
const INDIAN_STATES = [
  { value: "Andhra Pradesh", label: "Andhra Pradesh" },
  { value: "Arunachal Pradesh", label: "Arunachal Pradesh" },
  { value: "Assam", label: "Assam" },
  { value: "Bihar", label: "Bihar" },
  { value: "Chhattisgarh", label: "Chhattisgarh" },
  { value: "Goa", label: "Goa" },
  { value: "Gujarat", label: "Gujarat" },
  { value: "Haryana", label: "Haryana" },
  { value: "Himachal Pradesh", label: "Himachal Pradesh" },
  { value: "Jharkhand", label: "Jharkhand" },
  { value: "Karnataka", label: "Karnataka" },
  { value: "Kerala", label: "Kerala" },
  { value: "Madhya Pradesh", label: "Madhya Pradesh" },
  { value: "Maharashtra", label: "Maharashtra" },
  { value: "Manipur", label: "Manipur" },
  { value: "Meghalaya", label: "Meghalaya" },
  { value: "Mizoram", label: "Mizoram" },
  { value: "Nagaland", label: "Nagaland" },
  { value: "Odisha", label: "Odisha" },
  { value: "Punjab", label: "Punjab" },
  { value: "Rajasthan", label: "Rajasthan" },
  { value: "Sikkim", label: "Sikkim" },
  { value: "Tamil Nadu", label: "Tamil Nadu" },
  { value: "Telangana", label: "Telangana" },
  { value: "Tripura", label: "Tripura" },
  { value: "Uttar Pradesh", label: "Uttar Pradesh" },
  { value: "Uttarakhand", label: "Uttarakhand" },
  { value: "West Bengal", label: "West Bengal" },
  { value: "Delhi", label: "Delhi" },
];

const ShopEditAddressTab = ({ shop, formData, onFormChange }) => {
  if (!shop) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <MapPin size={16} />
        Business Address
        <span className="text-xs text-indigo-500 font-normal ml-2">(Editing)</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <div className="md:col-span-2">
          <DetailRow
            label="Address"
            value={formData.address_line_1}
            isEditing={true}
            fieldName="address_line_1"
            onChange={(val) => onFormChange("address_line_1", val)}
          />
        </div>
        
        <DetailRow
          label="City"
          value={formData.city}
          isEditing={true}
          fieldName="city"
          onChange={(val) => onFormChange("city", val)}
        />
        
        <DetailRow
          label="State"
          value={formData.state}
          isEditing={true}
          fieldName="state"
          type="select"
          options={INDIAN_STATES}
          onChange={(val) => onFormChange("state", val)}
        />
        
        <DetailRow
          label="Pincode"
          value={formData.pincode}
          isEditing={true}
          fieldName="pincode"
          onChange={(val) => onFormChange("pincode", val)}
        />
      </div>
    </div>
  );
};

export default ShopEditAddressTab;