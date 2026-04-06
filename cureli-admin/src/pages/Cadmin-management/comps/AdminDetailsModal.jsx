//cureli-admin\src\pages\Cadmin-management\comps\AdminDetailsModal.jsx
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
  AlertCircle,
} from "lucide-react";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DetailRow from "../../../components/common/DetailRow";
import AdminActivityTab from "./AdminActivityTab";
import { getAdminById, updateAdmin, toggleAdminAccess } from "../../../api/cadminAdmins";

const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ANALYST", label: "Analyst" },
  { value: "ACCOUNTING", label: "Accounting" },
];

const AdminDetailsModal = ({ adminId, isOpen, onClose, mode, onAdminUpdate }) => {
  // DATA STATE
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI STATE
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);

  // FORM STATE
  const [formData, setFormData] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // STATUS TOGGLE STATE
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState(null);

  // FETCH ADMIN DETAILS
  useEffect(() => {
    if (!isOpen || !adminId) return;

    const fetchAdmin = async () => {
      setLoading(true);
      setError(null);
      setActiveTab("profile");
      setIsEditing(false);

      try {
        const response = await getAdminById(adminId);
        const data = response.data.data;
        setAdmin(data);
        setFormData({
          name: data.name || "",
          username: data.username || "",
          phone: data.phone || "",
          email: data.email || "",
          role: data.rawRole || "SUPER_ADMIN",
        });
      } catch (err) {
        console.error("Failed to fetch admin:", err);
        setError(err.response?.data?.message || "Failed to load admin details");
      } finally {
        setLoading(false);
      }
    };

    fetchAdmin();
  }, [isOpen, adminId]);

  // SET EDIT MODE BASED ON PROP
  useEffect(() => {
    if (!loading && admin) {
      setIsEditing(mode === "edit");
    }
  }, [mode, loading, admin]);

  // ESC KEY + BODY LOCK
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e) => {
      if (e.key === "Escape" && !saveLoading && !statusLoading) {
        onClose(false);
      }
    };

    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, saveLoading, statusLoading]);

  if (!isOpen) return null;

  // SAVE HANDLER
  const handleSave = async () => {
    setSaveLoading(true);
    setSaveError(null);

    try {
      // Build payload with only changed fields
      const payload = {};
      if (formData.name !== admin.name) payload.name = formData.name;
      if (formData.username !== admin.username) payload.username = formData.username;
      if (formData.phone !== admin.phone) payload.phone = formData.phone;
      if (formData.email !== admin.email) payload.email = formData.email;
      if (formData.role !== admin.rawRole) payload.role = formData.role;

      // No changes
      if (Object.keys(payload).length === 0) {
        setIsEditing(false);
        return;
      }

      const response = await updateAdmin(adminId, payload);
      const updated = response.data.data;

      // Update local admin state
      setAdmin((prev) => ({
        ...prev,
        name: updated.name,
        username: updated.username,
        phone: updated.phone,
        email: updated.email,
        role: updated.role,
        rawRole: payload.role || prev.rawRole,
        updatedAt: updated.updatedAt,
      }));

      // Notify parent to update table
      onAdminUpdate?.(adminId, {
        name: updated.name,
        username: updated.username,
        phone: updated.phone,
        email: updated.email,
        role: updated.role,
      });

      setIsEditing(false);
      onClose(true);
    } catch (err) {
      console.error("Failed to update admin:", err);
      setSaveError(err.response?.data?.message || "Failed to save changes");
    } finally {
      setSaveLoading(false);
    }
  };

  // STATUS TOGGLE HANDLER
  const handleToggleStatus = async () => {
    setStatusLoading(true);
    setStatusError(null);

    try {
      const newIsActive = admin.status !== "Active";
      await toggleAdminAccess(adminId, newIsActive);

      const newStatus = newIsActive ? "Active" : "Inactive";

      // Update local state
      setAdmin((prev) => ({
        ...prev,
        status: newStatus,
        isActive: newIsActive,
      }));

      // Notify parent
      onAdminUpdate?.(adminId, { status: newStatus });

      setShowStatusConfirm(false);
    } catch (err) {
      console.error("Failed to toggle status:", err);
      setStatusError(err.response?.data?.message || "Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  // CANCEL EDIT
  const handleCancelEdit = () => {
    setFormData({
      name: admin.name || "",
      username: admin.username || "",
      phone: admin.phone || "",
      email: admin.email || "",
      role: admin.rawRole || "SUPER_ADMIN",
    });
    setSaveError(null);
    setIsEditing(false);
  };

  // RENDER LOADING STATE
  const renderLoading = () => (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="text-[#05015A] animate-spin" />
    </div>
  );

  // RENDER ERROR STATE
  const renderError = () => (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <AlertCircle size={48} className="text-red-400 mb-4" />
      <p className="text-red-600 mb-4">{error}</p>
      <button
        onClick={() => onClose(false)}
        className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        Close
      </button>
    </div>
  );

  // RENDER PROFILE TAB
  const renderProfile = () => (
    <div className="space-y-6">
      {/* SAVE ERROR */}
      {saveError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

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
            onChange={(v) => setFormData({ ...formData, username: v.toLowerCase() })}
          />

          <DetailRow
            label="Phone"
            value={formData.phone}
            isEditing={isEditing}
            fieldName="phone"
            onChange={(v) => setFormData({ ...formData, phone: v.replace(/\D/g, "").slice(0, 10) })}
          />

          <DetailRow
            label="Email"
            value={formData.email}
            isEditing={isEditing}
            fieldName="email"
            onChange={(v) => setFormData({ ...formData, email: v })}
          />

          <DetailRow
            label="Role"
            value={isEditing ? formData.role : admin?.role}
            type="select"
            options={ROLE_OPTIONS}
            isEditing={isEditing}
            onChange={(v) => setFormData({ ...formData, role: v })}
          />

          <DetailRow
            label="Status"
            value={admin?.status}
            isEditing={false}
            disabled
          />

          <DetailRow
            label="Last Login"
            value={admin?.lastLogin || "Never"}
            isEditing={false}
            disabled
          />

          <DetailRow
            label="Created At"
            value={admin?.createdAt}
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
        onClick={() => !saveLoading && !statusLoading && onClose(false)}
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
                {loading ? (
                  <div className="h-12 flex items-center">
                    <Loader2 size={20} className="text-white animate-spin" />
                  </div>
                ) : error ? (
                  <div className="text-white">
                    <h2 className="text-lg font-semibold">Error</h2>
                  </div>
                ) : (
                  <>
                    <h2 className="text-white text-lg font-semibold">{admin?.name}</h2>
                    <p className="text-white/70 text-sm">@{admin?.username}</p>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                {/* EDIT/SAVE BUTTON */}
                {activeTab === "profile" && !loading && !error && (
                  <>
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleCancelEdit}
                          disabled={saveLoading}
                          className="px-4 py-2 rounded-lg text-sm font-medium bg-white/20 text-white hover:bg-white/30 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saveLoading}
                          className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 text-white flex items-center gap-2 hover:bg-emerald-600 disabled:opacity-50"
                        >
                          {saveLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Save size={16} />
                          )}
                          Save
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-white/20 text-white flex items-center gap-2 hover:bg-white/30"
                      >
                        <Pencil size={16} />
                        Edit
                      </button>
                    )}
                  </>
                )}

                {/* CLOSE BUTTON */}
                <button
                  onClick={() => !saveLoading && !statusLoading && onClose(false)}
                  disabled={saveLoading || statusLoading}
                  className="p-2 rounded-lg bg-white/20 text-white hover:bg-red-500/30 disabled:opacity-50 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* TABS */}
          {!loading && !error && (
            <div className="flex gap-2 px-6 pt-4 border-b">
              <button
                onClick={() => {
                  setActiveTab("profile");
                  if (isEditing) handleCancelEdit();
                }}
                className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                  activeTab === "profile"
                    ? "text-[#05015A] border-b-2 border-[#05015A]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <User size={14} className="inline mr-1" />
                Profile
              </button>

              <button
                onClick={() => {
                  setActiveTab("activity");
                  if (isEditing) handleCancelEdit();
                }}
                className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                  activeTab === "activity"
                    ? "text-[#05015A] border-b-2 border-[#05015A]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <History size={14} className="inline mr-1" />
                Activity
              </button>
            </div>
          )}

          {/* CONTENT */}
          <div className="p-4 h-[60vh] overflow-auto bg-gray-50">
            {loading ? (
              renderLoading()
            ) : error ? (
              renderError()
            ) : activeTab === "profile" ? (
              renderProfile()
            ) : (
              <AdminActivityTab activities={admin?.activityLogs || []} />
            )}
          </div>

          {/* FOOTER */}
          {!loading && !error && (
            <div className="px-6 py-4 bg-white border-t flex justify-between items-center">
              <p className="text-xs text-gray-400">Admin ID: {admin?.id}</p>

              <button
                onClick={() => {
                  setStatusError(null);
                  setShowStatusConfirm(true);
                }}
                disabled={isEditing}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                  ${
                    admin?.status === "Active"
                      ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                      : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                  }`}
              >
                {admin?.status === "Active" ? (
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
          )}
        </div>
      </div>

      {/* CONFIRM STATUS TOGGLE */}
      <ConfirmDialog
        isOpen={showStatusConfirm}
        onClose={() => {
          setShowStatusConfirm(false);
          setStatusError(null);
        }}
        onConfirm={handleToggleStatus}
        loading={statusLoading}
        title={admin?.status === "Active" ? "Suspend Admin?" : "Activate Admin?"}
        message={
          statusError ? (
            <span className="text-red-600">{statusError}</span>
          ) : (
            `Are you sure you want to ${
              admin?.status === "Active" ? "suspend" : "activate"
            } "${admin?.name}"?`
          )
        }
        confirmText={admin?.status === "Active" ? "Suspend" : "Activate"}
        type={admin?.status === "Active" ? "warning" : "success"}
      />
    </>
  );
};

export default AdminDetailsModal;