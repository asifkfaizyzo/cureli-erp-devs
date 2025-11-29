import { useState,useEffect } from "react";
import { X, Pencil } from "lucide-react";
import { ProfileDetails, ShopDetails, DocumentsTab } from "./UserDetailsTabs";

const UserDetailsModal = ({ user, isOpen, onClose, mode }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Reset editing state whenever modal opens
    setIsEditing(false);
  }, [isOpen]);

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

        {/* ✅ Show edit button ONLY in edit mode */}
        {mode === "edit" && (
          <button
            className="absolute top-4 right-16 border px-3 py-1 rounded-lg flex items-center gap-2"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Pencil size={16} />
            {isEditing ? "Save" : "Edit Details"}
          </button>
        )}

        {/* TABS */}
        <div className="flex pt-2 pl-4 pb-2 text-lg font-semibold ">
          <button className={`px-4 py-2 rounded-t-lg ${activeTab === "profile" ? "bg-[#05015A] text-white" : "bg-[#E2E4E5] text-black"}`} onClick={() => setActiveTab("profile")}>Profile Details</button>
          <button className={`px-4 py-2 rounded-t-lg ${activeTab === "shop" ? "bg-[#05015A] text-white" : "bg-[#E2E4E5] text-black"}`} onClick={() => setActiveTab("shop")}>Shop Details</button>
          <button className={`px-4 py-2 rounded-t-lg ${activeTab === "documents" ? "bg-[#05015A] text-white" : "bg-[#E2E4E5] text-black"}`} onClick={() => setActiveTab("documents")}>Documents</button>
        </div>

        {/* TAB CONTENT */}
        <div className="mt-4 flex flex-col gap-6 min-h-[300px] min-[1366px]:min-h-[360px] min-[1440px]:min-h-[420px] min-[1920px]:min-h-[520px] min-[2560px]:min-h-[620px] p-3 min-[1440px]:p-4 min-[1920px]:p-6 min-[2560px]:p-8 overflow-y-hidden">
          {activeTab === "profile" && <ProfileDetails user={user} isEditing={isEditing} />}
          {activeTab === "shop" && <ShopDetails user={user} isEditing={isEditing} />}
          {activeTab === "documents" && <DocumentsTab user={user} />}
        </div>

      </div>
    </div>
  );
};


export default UserDetailsModal;
