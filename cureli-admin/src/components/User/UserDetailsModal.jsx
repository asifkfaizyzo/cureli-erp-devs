import { useState, useEffect } from "react";
import { X, Pencil, Save, User, Store, FileText, Trash2 } from "lucide-react";
import { ProfileDetails, ShopDetails, DocumentsTab } from "./UserDetailsTabs";
import ConfirmDialog from "../common/ConfirmDialog";

const UserDetailsModal = ({ user, isOpen, onClose, mode }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    // RESET tab every open
    setActiveTab("profile");

    // AUTO-ENTER EDIT MODE IF REQUESTED
    if (mode === "edit") {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [isOpen, mode]);
  // Close on Escape key
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

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "shop", label: "Shop Details", icon: Store },
    { id: "documents", label: "Documents", icon: FileText },
  ];

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      // TODO: Call your delete API here
      console.log("Deleting user:", user.id);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setDeleteLoading(false);
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
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4">
            <div className="flex items-center justify-between">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">
                    {user.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2) || "U"}
                  </span>
                </div>
                <div>
                  <h2 className="text-white text-lg font-semibold">
                    {user.name}
                  </h2>
                  <p className="text-white/70 text-sm">@{user.username}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* EDIT button ALWAYS visible */}
                <button
                  onClick={() => setIsEditing(!isEditing)}
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

                {/* DELETE BUTTON ONLY IN VIEW MODE */}
                {mode === "view" && !isEditing && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 rounded-lg bg-white/20 text-red-200 hover:bg-red-500/30 transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                )}

                {/* CLOSE */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-white/20 text-white hover:bg-red-500/30 transition-all"
                >
                  <X size={20} className="text-red-200" />
                </button>
              </div>
            </div>
          </div>

          {/* TABS — moved here */}
          <div className="flex gap-1 px-6 pt-4  bg-white border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                  flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-md transition-all
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

          {/* CONTENT */}
          <div className="p-6 h-[60vh] overflow-hidden bg-gray-50">
            {activeTab === "profile" && (
              <ProfileDetails user={user} isEditing={isEditing} />
            )}
            {activeTab === "shop" && (
              <ShopDetails user={user} isEditing={isEditing} />
            )}
            {activeTab === "documents" && <DocumentsTab user={user} />}
          </div>

          {/* FOOTER */}
          <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              User ID: {user.userId || user.id || "N/A"} • Last updated:{" "}
              {user.lastLogin}
            </p>
          </div>
        </div>
      </div>
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete User?"
        message={`Are you sure you want to delete "${user.name}"? This action cannot be undone and all associated data will be permanently removed.`}
        confirmText="Delete User"
        cancelText="Cancel"
        type="danger"
        loading={deleteLoading}
      />
    </>
  );
};

export default UserDetailsModal;
