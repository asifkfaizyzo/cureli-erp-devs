// cadmin/src/pages/Settings/comps/ProfileCard.jsx

import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Calendar,
  Edit3,
  AtSign,
  Shield,
  Clock,
} from "lucide-react";

import ChangeEmailModal from "./ChangeEmailModal";
import ChangePhoneModal from "./ChangePhoneModal";
import ChangePasswordModal from "./ChangePasswordModal";
import EditFieldModal from "./EditFieldModal";
import { useAuth } from "../../../context/AuthContext";

const ProfileCard = ({ profile, onUpdate }) => {
  const { admin } = useAuth();
  const isSuperAdmin = admin?.role?.toUpperCase() === "SUPER_CADMIN";

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editField, setEditField] = useState(null); // { field, label, value }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPhone = (phone) => {
    if (!phone) return "Not set";
    if (phone.length === 10) return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
    return phone;
  };

  const handleModalClose = (updated) => {
    setShowEmailModal(false);
    setShowPhoneModal(false);
    setShowPasswordModal(false);
    setEditField(null);
    if (updated) onUpdate(typeof updated === "string" ? updated : "Profile updated successfully");
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      SUPER_CADMIN: "bg-purple-100 text-purple-700 border-purple-200",
      ANALYST: "bg-blue-100 text-blue-700 border-blue-200",
      ACCOUNTANT: "bg-green-100 text-green-700 border-green-200",
      SALESMAN: "bg-orange-100 text-orange-700 border-orange-200",
    };
    return colors[role] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const InfoItem = ({ icon: Icon, label, value, editable, onEdit, badge }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 bg-[#000060]/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon size={18} className="text-[#000060]" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          {badge ? (
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeColor(profile.rawRole)}`}
              >
                {value}
              </span>
            </div>
          ) : (
            <p className="text-sm font-semibold text-gray-900 truncate">
              {value}
            </p>
          )}
        </div>
      </div>
      {editable && (
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#000060] bg-[#000060]/5 hover:bg-[#000060]/10 rounded-lg transition-colors flex-shrink-0 ml-3"
        >
          <Edit3 size={12} />
          Change
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <User size={20} className="text-[#000060]" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Personal Information
              </h2>
              <p className="text-xs text-gray-500">
                {profile.name} • @{profile.username}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(profile.rawRole)}`}
          >
            {profile.role}
          </span>
        </div>

        {/* Content */}
        <div className="p-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Full Name — SUPER_CADMIN can edit */}
            <InfoItem
              icon={User}
              label="Full Name"
              value={profile.name}
              editable={isSuperAdmin}
              onEdit={() =>
                setEditField({
                  field: "name",
                  label: "Full Name",
                  value: profile.name,
                })
              }
            />

            {/* Username — SUPER_CADMIN can edit */}
            <InfoItem
              icon={AtSign}
              label="Username"
              value={profile.username}
              editable={isSuperAdmin}
              onEdit={() =>
                setEditField({
                  field: "username",
                  label: "Username",
                  value: profile.username,
                })
              }
            />

            {/* Email — all roles can edit */}
            <InfoItem
              icon={Mail}
              label="Email Address"
              value={profile.email || "Not set"}
              editable
              onEdit={() => setShowEmailModal(true)}
            />

            {/* Phone — all roles can edit */}
            <InfoItem
              icon={Phone}
              label="Phone Number"
              value={formatPhone(profile.phone)}
              editable
              onEdit={() => setShowPhoneModal(true)}
            />

            {/* Password — all roles can change */}
            <InfoItem
              icon={Lock}
              label="Password"
              value="••••••••••••"
              editable
              onEdit={() => setShowPasswordModal(true)}
            />

            {/* Role — never self-editable */}
            <InfoItem icon={Shield} label="Role" value={profile.role} badge />

            {/* Last Login — view only */}
            <InfoItem
              icon={Clock}
              label="Last Login"
              value={formatDateTime(profile.lastLogin)}
            />

            {/* Member Since — view only */}
            <InfoItem
              icon={Calendar}
              label="Member Since"
              value={formatDate(profile.createdAt)}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEmailModal && (
        <ChangeEmailModal
          currentEmail={profile.email}
          onClose={handleModalClose}
        />
      )}

      {showPhoneModal && (
        <ChangePhoneModal
          currentPhone={profile.phone}
          onClose={handleModalClose}
        />
      )}

      {showPasswordModal && (
        <ChangePasswordModal onClose={handleModalClose} />
      )}

      {editField && (
        <EditFieldModal
          field={editField.field}
          label={editField.label}
          currentValue={editField.value}
          onClose={handleModalClose}
        />
      )}
    </>
  );
};

export default ProfileCard;