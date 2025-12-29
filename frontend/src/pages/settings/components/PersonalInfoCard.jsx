// src/pages/settings/components/PersonalInfoCard.jsx

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Lock,
  Calendar,
  Edit3,
} from "lucide-react";

import ChangeEmailModal from "./ChangeEmailModal";
import ChangePhoneModal from "./ChangePhoneModal";
import ChangePasswordModal from "./ChangePasswordModal";

/**
 * PersonalInfoCard
 * Displays personal information with edit options
 */
const PersonalInfoCard = ({ user, onUpdate }) => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPhone = (phone) => {
    if (!phone) return "Not set";
    // Format as +91 98765 43210
    return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
  };

  const handleModalClose = (updated) => {
    setShowEmailModal(false);
    setShowPhoneModal(false);
    setShowPasswordModal(false);
    if (updated) {
      onUpdate();
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <User size={20} className="text-[#000060]" />
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name - View Only */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">Full Name</label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User size={18} className="text-gray-400" />
                <span className="text-gray-900 font-medium">{user.full_name}</span>
              </div>
            </div>

            {/* Username - View Only */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">Username</label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-400">@</span>
                <span className="text-gray-900 font-medium">{user.username}</span>
              </div>
            </div>

            {/* Email - Editable */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">Email Address</label>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-gray-400" />
                  <span className="text-gray-900">{user.email || "Not set"}</span>
                </div>
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#000060] hover:bg-[#000060]/10 rounded-lg transition-colors"
                >
                  <Edit3 size={14} />
                  Change
                </button>
              </div>
            </div>

            {/* Phone - Editable */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">Phone Number</label>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-gray-400" />
                  <span className="text-gray-900">{formatPhone(user.phone_number)}</span>
                </div>
                <button
                  onClick={() => setShowPhoneModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#000060] hover:bg-[#000060]/10 rounded-lg transition-colors"
                >
                  <Edit3 size={14} />
                  Change
                </button>
              </div>
            </div>

            {/* Password - Editable */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">Password</label>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Lock size={18} className="text-gray-400" />
                  <span className="text-gray-900">••••••••••••</span>
                </div>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#000060] hover:bg-[#000060]/10 rounded-lg transition-colors"
                >
                  <Edit3 size={14} />
                  Change
                </button>
              </div>
            </div>

            {/* Member Since - View Only */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">Member Since</label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar size={18} className="text-gray-400" />
                <span className="text-gray-900">{formatDate(user.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      {showEmailModal && (
        <ChangeEmailModal
          currentEmail={user.email}
          onClose={handleModalClose}
        />
      )}

      {showPhoneModal && (
        <ChangePhoneModal
          currentPhone={user.phone_number}
          onClose={handleModalClose}
        />
      )}

      {showPasswordModal && (
        <ChangePasswordModal onClose={handleModalClose} />
      )}
    </>
  );
};

export default PersonalInfoCard;