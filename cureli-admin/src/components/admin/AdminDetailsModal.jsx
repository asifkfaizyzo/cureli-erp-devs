//Q:\YourZeroesAndOnes\cureli\curely_erp\cureli-admin\src\components\admin\AdminDetailsModal.jsx
import { useEffect, useState } from "react";
import {
  X,
  Pencil,
  Save,
  User,
  History,
  Ban,
  CheckCircle,
  Loader2,
} from "lucide-react";
import ConfirmDialog from "../common/ConfirmDialog";
import DetailRow from "../User/DetailRow";
import AdminActivityTab from "./AdminActivityTab";

const AdminDetailsModal = ({ admin, isOpen, onClose, mode }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);

  const [showStatusConfirm, setShowStatusConfirm] = useState(false);

  // initialize form
  useEffect(() => {
    if (admin) {
      setFormData({
        name: admin.name || "",
        username: admin.username || "",
        phone: admin.phone || "",
        email: admin.email || "",
        status: admin.status || "Active",
      });
    }
  }, [admin]);

  // mode-based edit
  useEffect(() => {
    setIsEditing(mode === "edit");
  }, [mode]);

  // esc + body lock
  useEffect(() => {
    if (!isOpen) return;
    const esc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !admin) return null;

  const handleSave = async () => {
    setSaveLoading(true);
    // dummy save delay
    setTimeout(() => {
      setSaveLoading(false);
      setIsEditing(false);
      onClose(true);
    }, 600);
  };

  const statusOptions = [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
  ];

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <User size={16} />
          Admin Profile
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <DetailRow
            label="Name"
            value={formData.name}
            isEditing={isEditing}
            fieldName="name"
            onChange={(v) => setFormData({ ...formData, name: v })}
          />

          <DetailRow
            label="Username"
            value={formData.username}
            isEditing={isEditing}
            fieldName="username"
            onChange={(v) => setFormData({ ...formData, username: v })}
          />

          <DetailRow
            label="Phone"
            value={formData.phone}
            isEditing={isEditing}
            fieldName="phone"
            onChange={(v) => setFormData({ ...formData, phone: v })}
          />

          <DetailRow
            label="Email"
            value={formData.email}
            isEditing={isEditing}
            fieldName="email"
            onChange={(v) => setFormData({ ...formData, email: v })}
          />

          <DetailRow
            label="Status"
            value={formData.status}
            type="select"
            options={statusOptions}
            isEditing={isEditing}
            onChange={(v) => setFormData({ ...formData, status: v })}
          />

          <DetailRow
            label="Last Login"
            value={admin.lastLogin}
            isEditing={false}
            disabled
          />

          <DetailRow
            label="Created At"
            value={admin.createdAt}
            isEditing={false}
            disabled
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={() => onClose(false)}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <div
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-white text-lg font-semibold">
                  {admin.name}
                </h2>
                <p className="text-white/70 text-sm">@{admin.username}</p>
              </div>

              <div className="flex gap-2">
                {activeTab === "profile" && (
                  <button
                    onClick={() =>
                      isEditing ? handleSave() : setIsEditing(true)
                    }
                    disabled={saveLoading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2
                      ${
                        isEditing
                          ? "bg-emerald-500 text-white"
                          : "bg-white/20 text-white"
                      }`}
                  >
                    {saveLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : isEditing ? (
                      <Save size={16} />
                    ) : (
                      <Pencil size={16} />
                    )}
                    {isEditing ? "Save" : "Edit"}
                  </button>
                )}

                <button
                  onClick={() => onClose(false)}
                  className="p-2 rounded-lg bg-white/20 text-white hover:bg-red-500/30"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div className="flex gap-2 px-6 pt-4 border-b">
            <button
              onClick={() => {
                setActiveTab("profile");
                setIsEditing(false);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-t-md ${
                activeTab === "profile"
                  ? "text-[#05015A] border-b-2 border-[#05015A]"
                  : "text-gray-500"
              }`}
            >
              <User size={14} className="inline mr-1" />
              Profile
            </button>

            <button
              onClick={() => {
                setActiveTab("activity");
                setIsEditing(false);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-t-md ${
                activeTab === "activity"
                  ? "text-[#05015A] border-b-2 border-[#05015A]"
                  : "text-gray-500"
              }`}
            >
              <History size={14} className="inline mr-1" />
              Activity
            </button>
          </div>

          {/* CONTENT */}
          <div className="p-4 h-[60vh] overflow-auto bg-gray-50">
            {activeTab === "profile" ? renderProfile() : (
              <AdminActivityTab activities={admin.activityLogs || []} />
            )}
          </div>

          {/* FOOTER */}
          <div className="px-6 py-4 bg-white border-t flex justify-between">
            <p className="text-xs text-gray-400">
              Admin ID: {admin.id}
            </p>

            <button
              onClick={() => setShowStatusConfirm(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2
                ${
                  admin.status === "Active"
                    ? "bg-orange-50 text-orange-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}
            >
              {admin.status === "Active" ? (
                <>
                  <Ban size={16} /> Suspend
                </>
              ) : (
                <>
                  <CheckCircle size={16} /> Activate
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRM STATUS */}
      <ConfirmDialog
        isOpen={showStatusConfirm}
        onClose={() => setShowStatusConfirm(false)}
        onConfirm={() => {
          setShowStatusConfirm(false);
          onClose(true);
        }}
        title={
          admin.status === "Active"
            ? "Suspend Admin?"
            : "Activate Admin?"
        }
        message={`Are you sure you want to ${
          admin.status === "Active" ? "suspend" : "activate"
        } "${admin.name}"?`}
        confirmText={admin.status === "Active" ? "Suspend" : "Activate"}
        type={admin.status === "Active" ? "warning" : "success"}
      />
    </>
  );
};

export default AdminDetailsModal;
