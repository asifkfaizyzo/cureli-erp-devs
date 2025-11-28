import { useState } from "react";
import { X, Pencil } from "lucide-react";
import { ProfileDetails, ShopDetails, DocumentsTab } from "./UserDetailsTabs";

const UserDetailsModal = ({ user, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white w-[90%] max-h-[90%] rounded-xl shadow-xl p-5 overflow-auto relative">

        {/* CLOSE BUTTON */}
        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-red-500"
          onClick={onClose}
        >
          <X size={28} />
        </button>

        {/* EDIT BUTTON */}
        <button
          className="absolute top-4 right-16 border px-3 py-1 rounded-lg flex items-center gap-2"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Pencil size={16} />
          {isEditing ? "Save" : "Edit Details"}
        </button>

        {/* TABS */}
        <div className="flex pt-2 pl-4 pb-2 text-lg font-semibold ml-[-3%] mt-[-2%]">

          <button
            className={`px-4 py-2 rounded-t-lg ${
              activeTab === "profile"
                ? "bg-[#05015A] text-white"
                : "bg-[#E2E4E5] text-black"
            }`}
            onClick={() => setActiveTab("profile")}
          >
            Profile Details
          </button>

          <button
            className={`px-4 py-2 rounded-t-lg ${
              activeTab === "shop"
                ? "bg-[#05015A] text-white"
                : "bg-[#E2E4E5] text-black"
            }`}
            onClick={() => setActiveTab("shop")}
          >
            Shop Details
          </button>

          <button
            className={`px-4 py-2 rounded-t-lg ${
              activeTab === "documents"
                ? "bg-[#05015A] text-white"
                : "bg-[#E2E4E5] text-black"
            }`}
            onClick={() => setActiveTab("documents")}
          >
            Documents
          </button>

        </div>

        {/* TAB CONTENT */}
        <div className="mt-6">
          {activeTab === "profile" && (
            <ProfileDetails user={user} isEditing={isEditing} />
          )}

          {activeTab === "shop" && (
            <ShopDetails user={user} isEditing={isEditing} />
          )}

          {activeTab === "documents" && (
            <DocumentsTab user={user} isEditing={isEditing} />
          )}
        </div>

      </div>
    </div>
  );
};

export default UserDetailsModal;
