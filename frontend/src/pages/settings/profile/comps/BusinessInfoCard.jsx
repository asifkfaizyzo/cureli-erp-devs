// src/pages/settings/components/BusinessInfoCard.jsx

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  MapPin,
  FileText,
  Edit3,
} from "lucide-react";

import EditBusinessModal from "./EditBusinessModal";

/**
 * BusinessInfoCard
 * Displays business information with edit option
 */
const BusinessInfoCard = ({ shop, onUpdate }) => {
  const [showEditModal, setShowEditModal] = useState(false);

  const handleModalClose = (updated) => {
    setShowEditModal(false);
    if (updated) {
      onUpdate();
    }
  };

  const formatAddress = () => {
    const parts = [
      shop.address_line_1,
      shop.address_line_2,
      shop.city,
      shop.state,
      shop.pincode,
    ].filter(Boolean);
    return parts.join(", ");
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 size={20} className="text-[#000060]" />
            <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#000060] hover:bg-[#000060]/10 rounded-lg transition-colors"
          >
            <Edit3 size={14} />
            Edit
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shop Name */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">Shop Name</label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Building2 size={18} className="text-gray-400" />
                <span className="text-gray-900 font-medium">{shop.business_name}</span>
              </div>
            </div>

            {/* GST Number - View Only */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">
                GST Number
                <span className="ml-2 text-xs text-gray-400">(Cannot be changed)</span>
              </label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText size={18} className="text-gray-400" />
                <span className="text-gray-900 font-mono">
                  {shop.gst_number || "Not provided"}
                </span>
              </div>
            </div>

            {/* Address - Full Width */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-500">Business Address</label>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin size={18} className="text-gray-400 mt-0.5" />
                <span className="text-gray-900">{formatAddress()}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditBusinessModal shop={shop} onClose={handleModalClose} />
      )}
    </>
  );
};

export default BusinessInfoCard;