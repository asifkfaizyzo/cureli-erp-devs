// components/User/UserDetailsModal.jsx

import { useState, useEffect } from "react";
import {
  X,
  Pencil,
  Save,
  User,
  Store,
  FileText,
  KeyRound,
  Ban,
  CheckCircle,
  GitBranch,
  Users,
  History,
} from "lucide-react";
import {
  ProfileDetails,
  ShopDetails,
  DocumentsTab,
  BranchesTab,
  UsersTab,
  ActivityTab,
} from "./UserDetailsTabs";
import ConfirmDialog from "../common/ConfirmDialog";

const UserDetailsModal = ({ user, isOpen, onClose, mode }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);

  // Confirm dialogs state
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [suspendLoading, setSuspendLoading] = useState(false);

  const [showResetPasswordConfirm, setShowResetPasswordConfirm] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  // Determine user role
  const isOwner = user?.role === "Super Admin";
  const isBranchAdmin = user?.role === "Branch Admin";
  const isStaff = user?.role === "staff";

  // Dynamic tabs based on role
  const getTabs = () => {
    const baseTabs = [
      { id: "profile", label: "Profile", icon: User },
    ];

    if (isOwner) {
      return [
        ...baseTabs,
        { id: "shop", label: "Shop Details", icon: Store },
        { id: "documents", label: "Documents", icon: FileText },
        { id: "branches", label: "Branches", icon: GitBranch },
        { id: "users", label: "Users", icon: Users },
        { id: "activity", label: "Activity", icon: History },
      ];
    }

    if (isBranchAdmin) {
      return [
        ...baseTabs,
        { id: "shop", label: "Branch Details", icon: Store },
        { id: "documents", label: "Documents", icon: FileText },
        { id: "activity", label: "Activity", icon: History },
      ];
    }

    // Staff
    return [
      ...baseTabs,
      { id: "shop", label: "Workplace", icon: Store },
      { id: "activity", label: "Activity", icon: History },
    ];
  };

  const tabs = getTabs();

  useEffect(() => {
    setActiveTab("profile");
    setIsEditing(mode === "edit");
  }, [isOpen, mode]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  // Get role display name
  const getRoleDisplayName = (role) => {
    switch (role) {
      case "Super Admin":
        return "Shop Owner";
      case "Branch Admin":
        return "Branch Admin";
      case "staff":
        return "Staff";
      default:
        return role;
    }
  };

  // ═══════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════
  const handleSuspendConfirm = async () => {
    setSuspendLoading(true);
    try {
      const action = user.status === "Active" ? "suspend" : "activate";

      // TODO: Call API
      console.log(`${action} user:`, user.user_id);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setShowSuspendConfirm(false);
      onClose();
    } catch (error) {
      console.error("Suspend/Activate failed:", error);
    } finally {
      setSuspendLoading(false);
    }
  };

  const handleResetPasswordConfirm = async () => {
    setResetPasswordLoading(true);
    try {
      // TODO: Call API
      console.log("Reset password for:", user.user_id);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setShowResetPasswordConfirm(false);
      alert(`Password reset link sent to ${user.email}`);
    } catch (error) {
      console.error("Reset password failed:", error);
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    // TODO: Implement save logic - collect form data
    console.log("Saving changes...");
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsEditing(false);
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER CONTENT
  // ═══════════════════════════════════════════════════════════
  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileDetails user={user} isEditing={isEditing} />;
      case "shop":
        return <ShopDetails user={user} isEditing={false} />; // Shop details not editable
      case "documents":
        return <DocumentsTab user={user} />;
      case "branches":
        return isOwner ? <BranchesTab user={user} /> : null;
      case "users":
        return isOwner ? <UsersTab user={user} /> : null;
      case "activity":
        return <ActivityTab user={user} />;
      default:
        return null;
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Modal Container */}
        <div
          className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ═══════════════════════════════════════════════════════
              HEADER
          ═══════════════════════════════════════════════════════ */}
          <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4">
            <div className="flex items-center justify-between">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">
                    {user.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2) || "U"}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-white text-lg font-semibold">
                      {user.full_name}
                    </h2>
                    {/* Role Badge */}
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                      {getRoleDisplayName(user.role)}
                    </span>
                    {/* Status Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.status === "Active"
                          ? "bg-emerald-500/20 text-emerald-200"
                          : user.status === "Suspended"
                          ? "bg-red-500/20 text-red-200"
                          : "bg-orange-500/20 text-orange-200"
                      }`}
                    >
                      {user.status}
                    </span>
                  </div>
                  <p className="text-white/70 text-sm">@{user.username}</p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2">
                {/* Edit / Save Toggle - Only for Profile tab */}
                {activeTab === "profile" && (
                  <button
                    onClick={() => {
                      if (isEditing) {
                        handleSaveChanges();
                      } else {
                        setIsEditing(true);
                      }
                    }}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                      ${
                        isEditing
                          ? "bg-emerald-500 text-white hover:bg-emerald-600"
                          : "bg-white/20 text-white hover:bg-white/30"
                      }
                    `}
                  >
                    {isEditing ? <Save size={16} /> : <Pencil size={16} />}
                    {isEditing ? "Save Changes" : "Edit Details"}
                  </button>
                )}

                {/* Close */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-white/20 text-white hover:bg-red-500/30 transition-all"
                >
                  <X size={20} className="text-red-200" />
                </button>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════
              TABS
          ═══════════════════════════════════════════════════════ */}
          <div className="flex gap-1 px-6 pt-4 bg-white border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    // Turn off editing when switching tabs
                    if (tab.id !== "profile") {
                      setIsEditing(false);
                    }
                  }}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-md transition-all whitespace-nowrap
                    ${
                      isActive
                        ? "text-[#05015A] border-b-2 border-[#05015A] bg-white"
                        : "text-gray-500 hover:text-gray-700"
                    }
                  `}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ═══════════════════════════════════════════════════════
              CONTENT
          ═══════════════════════════════════════════════════════ */}
          <div className="p-4 h-[60vh] overflow-auto bg-gray-50">
            {renderTabContent()}
          </div>

          {/* ═══════════════════════════════════════════════════════
              FOOTER - Admin Actions
          ═══════════════════════════════════════════════════════ */}
          <div className="px-6 py-4 bg-white border-t border-gray-100">
            <div className="flex items-center justify-between">
              {/* Left: User Meta Info */}
              <p className="text-xs text-gray-400">
                User ID: {user.user_id?.slice(0, 8)}... • Last login:{" "}
                {user.lastLogin || "Never"}
              </p>

              {/* Right: Admin Actions */}
              <div className="flex items-center gap-2">
                {/* Reset Password Button */}
                <button
                  onClick={() => setShowResetPasswordConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium 
                             bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                >
                  <KeyRound size={16} />
                  Reset Password
                </button>

                {/* Suspend / Activate Button */}
                <button
                  onClick={() => setShowSuspendConfirm(true)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${
                      user.status === "Active"
                        ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    }
                  `}
                >
                  {user.status === "Active" ? (
                    <>
                      <Ban size={16} />
                      Suspend Account
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Activate Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          CONFIRMATION DIALOGS
      ═══════════════════════════════════════════════════════ */}

      {/* Suspend/Activate Confirmation */}
      <ConfirmDialog
        isOpen={showSuspendConfirm}
        onClose={() => setShowSuspendConfirm(false)}
        onConfirm={handleSuspendConfirm}
        title={user.status === "Active" ? "Suspend User?" : "Activate User?"}
        message={
          user.status === "Active"
            ? `Are you sure you want to suspend "${user.full_name}"? They will not be able to log in until reactivated.`
            : `Are you sure you want to activate "${user.full_name}"? They will regain access to their account.`
        }
        confirmText={user.status === "Active" ? "Suspend" : "Activate"}
        cancelText="Cancel"
        type={user.status === "Active" ? "warning" : "success"}
        loading={suspendLoading}
      />

      {/* Reset Password Confirmation */}
      <ConfirmDialog
        isOpen={showResetPasswordConfirm}
        onClose={() => setShowResetPasswordConfirm(false)}
        onConfirm={handleResetPasswordConfirm}
        title="Reset Password?"
        message={
          <span>
            Send a password reset link to <strong>{user.email}</strong>?
            <br />
            <span className="text-gray-400 text-sm mt-1 block">
              The user will receive an email with instructions to create a new
              password.
            </span>
          </span>
        }
        confirmText="Send Reset Link"
        cancelText="Cancel"
        type="info"
        loading={resetPasswordLoading}
      />
    </>
  );
};

export default UserDetailsModal;