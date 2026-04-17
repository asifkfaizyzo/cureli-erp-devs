// frontend/src/pages/Cadmin-management/comps/AdminDetailsModal.jsx

import { useEffect, useState, useCallback } from "react";
import {
  X, Pencil, Save, User, History, Ban, CheckCircle,
  Loader2, AlertCircle, Shield, Plus, MoreVertical,
  Star, Trash2,
} from "lucide-react";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DetailRow from "../../../components/common/DetailRow";
import AdminActivityTab from "./AdminActivityTab";
import AssignRolesModal from "./AssignRolesModal";
import {
  getAdminById,
  updateAdmin,
  toggleAdminAccess,
  getAdminRoles,
  assignAdminRoles,
} from "../../../api/cadminAdmins";
import { getRoleBadgeStyle } from "../../../config/tableConfig";

// ─────────────────────────────────────────────────────────────────────────────
// ROLES TAB
// ─────────────────────────────────────────────────────────────────────────────

function RoleAssignmentRow({ assignment, isSuperAdmin, onSetPrimary, onRemove }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100
                    hover:border-indigo-100 transition-colors group">
      {/* Badge */}
      <span className={getRoleBadgeStyle(assignment.name)}>
        {assignment.name}
      </span>

      {/* Primary tag */}
      {assignment.is_primary && (
        <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5
                         bg-yellow-50 text-yellow-700 rounded-full border border-yellow-200">
          <Star size={10} fill="currentColor" /> Primary
        </span>
      )}

      <div className="flex-1" />

      {/* Kebab menu — only for non-super admins */}
      {!isSuperAdmin && (
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((p) => !p); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <MoreVertical size={15} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-44 bg-white rounded-xl
                              border border-gray-200 shadow-lg overflow-hidden">
                {!assignment.is_primary && (
                  <button
                    onClick={() => { setMenuOpen(false); onSetPrimary(assignment.role_id); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm
                               text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  >
                    <Star size={14} /> Set as Primary
                  </button>
                )}
                <button
                  onClick={() => { setMenuOpen(false); onRemove(assignment.role_id); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm
                             text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} /> Remove Role
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AdminRolesTab({ admin, onRolesChanged }) {
  const [roles, setRoles]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [saving, setSaving]         = useState(false);

  const fetchRoles = useCallback(async () => {
    if (!admin?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminRoles(admin.id);
      setRoles(res.data.data.roles ?? []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, [admin?.id]);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  // Re-build and save the assignment list
  const saveAssignments = async (newRoles, primaryId) => {
    setSaving(true);
    try {
      await assignAdminRoles(admin.id, {
        role_ids:        newRoles.map((r) => r.role_id),
        primary_role_id: primaryId,
      });
      await fetchRoles();
      onRolesChanged?.();
    } catch (err) {
      throw err; // Let AssignRolesModal handle the error display
    } finally {
      setSaving(false);
    }
  };

  const handleSetPrimary = async (roleId) => {
    const newRoles   = roles.map((r) => r.role_id);
    await saveAssignments(roles, roleId);
  };

  const handleRemove = async (roleId) => {
    const newRoles = roles.filter((r) => r.role_id !== roleId);
    if (newRoles.length === 0) {
      // Edge case: removing last role — clear all
      await assignAdminRoles(admin.id, {
        role_ids:        [],
        primary_role_id: null,
      }).catch(() => {});
      await fetchRoles();
      onRolesChanged?.();
      return;
    }
    const primaryId = newRoles.find((r) => r.is_primary)?.role_id ?? newRoles[0].role_id;
    await saveAssignments(newRoles, primaryId);
  };

  if (admin?.is_super_cadmin) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-6">
        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-3">
          <Shield size={24} className="text-purple-500" />
        </div>
        <h4 className="font-semibold text-gray-700 mb-1">Super Admin</h4>
        <p className="text-sm text-gray-500 max-w-xs">
          Super Admins have full access to everything. Custom role
          assignments do not apply.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {loading ? "Loading…" : `${roles.length} role${roles.length !== 1 ? "s" : ""} assigned`}
        </p>
        <button
          onClick={() => setAssignOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600
                     border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          <Plus size={14} /> Manage Roles
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={24} className="animate-spin text-indigo-400" />
        </div>
      ) : error ? (
        <div className="text-sm text-red-600 flex items-center gap-2 bg-red-50 p-3 rounded-xl">
          <AlertCircle size={15} /> {error}
        </div>
      ) : roles.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <Shield size={28} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No roles assigned</p>
          <button
            onClick={() => setAssignOpen(true)}
            className="mt-3 text-sm text-indigo-600 font-medium hover:underline"
          >
            Assign a role
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {roles.map((r) => (
            <RoleAssignmentRow
              key={r.role_id}
              assignment={r}
              isSuperAdmin={admin?.is_super_cadmin}
              onSetPrimary={handleSetPrimary}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {/* Assign Roles Modal */}
      <AssignRolesModal
        isOpen={assignOpen}
        adminId={admin?.id}
        currentRoles={roles}
        onClose={() => setAssignOpen(false)}
        onSave={saveAssignments}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODAL
// ─────────────────────────────────────────────────────────────────────────────

const TABS = ["profile", "roles", "activity"];

const AdminDetailsModal = ({ adminId, isOpen, onClose, mode, onAdminUpdate }) => {
  const [admin, setAdmin]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const [activeTab, setActiveTab]   = useState("profile");
  const [isEditing, setIsEditing]   = useState(false);

  const [formData, setFormData]     = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError]   = useState(null);

  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [statusLoading, setStatusLoading]         = useState(false);
  const [statusError, setStatusError]             = useState(null);

  // Fetch admin
  useEffect(() => {
    if (!isOpen || !adminId) return;
    setLoading(true);
    setError(null);
    setActiveTab("profile");
    setIsEditing(false);

    getAdminById(adminId)
      .then((res) => {
        const data = res.data.data;
        setAdmin(data);
        setFormData({
          name:     data.name     ?? "",
          username: data.username ?? "",
          phone:    data.phone    ?? "",
          email:    data.email    ?? "",
        });
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to load admin"))
      .finally(() => setLoading(false));
  }, [isOpen, adminId]);

  useEffect(() => {
    if (!loading && admin) setIsEditing(mode === "edit");
  }, [mode, loading, admin]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape" && !saveLoading && !statusLoading) onClose(false);
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, saveLoading, statusLoading]);

  if (!isOpen) return null;

  // ── Save handler ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaveLoading(true);
    setSaveError(null);
    try {
      const payload = {};
      if (formData.name     !== admin.name)     payload.name     = formData.name;
      if (formData.username !== admin.username) payload.username = formData.username;
      if (formData.phone    !== admin.phone)    payload.phone    = formData.phone;
      if (formData.email    !== admin.email)    payload.email    = formData.email;

      if (Object.keys(payload).length === 0) { setIsEditing(false); return; }

      const res     = await updateAdmin(adminId, payload);
      const updated = res.data.data;

      setAdmin((p) => ({ ...p, ...updated }));
      onAdminUpdate?.(adminId, updated);
      setIsEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.message || "Failed to save");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      name:     admin.name     ?? "",
      username: admin.username ?? "",
      phone:    admin.phone    ?? "",
      email:    admin.email    ?? "",
    });
    setSaveError(null);
    setIsEditing(false);
  };

  // ── Status toggle ─────────────────────────────────────────────────────────
  const handleToggleStatus = async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const newActive = admin.status !== "Active";
      await toggleAdminAccess(adminId, newActive);
      const newStatus = newActive ? "Active" : "Inactive";
      setAdmin((p) => ({ ...p, status: newStatus, isActive: newActive }));
      onAdminUpdate?.(adminId, { status: newStatus });
      setShowStatusConfirm(false);
    } catch (err) {
      setStatusError(err.response?.data?.message || "Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  // ── Profile tab content ───────────────────────────────────────────────────
  const renderProfile = () => (
    <div className="space-y-5">
      {saveError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl
                        flex items-center gap-2 text-sm">
          <AlertCircle size={15} /> {saveError}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4
                       flex items-center gap-2">
          <User size={14} /> Admin Profile
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <DetailRow label="Name"     value={formData.name}     isEditing={isEditing} fieldName="name"
            onChange={(v) => setFormData((p) => ({ ...p, name: v }))} />
          <DetailRow label="Username" value={formData.username} isEditing={isEditing} fieldName="username"
            onChange={(v) => setFormData((p) => ({ ...p, username: v.toLowerCase() }))} />
          <DetailRow label="Phone"    value={formData.phone}    isEditing={isEditing} fieldName="phone"
            onChange={(v) => setFormData((p) => ({ ...p, phone: v.replace(/\D/g, "").slice(0, 10) }))} />
          <DetailRow label="Email"    value={formData.email}    isEditing={isEditing} fieldName="email"
            onChange={(v) => setFormData((p) => ({ ...p, email: v }))} />

          {/* Read-only fields */}
          <DetailRow label="Primary Role" value={admin?.role ?? "—"}      isEditing={false} disabled />
          <DetailRow label="Status"       value={admin?.status ?? "—"}    isEditing={false} disabled />
          <DetailRow label="Last Login"   value={admin?.lastLogin ?? "Never"} isEditing={false} disabled />
          <DetailRow label="Created"      value={admin?.createdAt ?? "—"} isEditing={false} disabled />
        </div>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  const tabLabel = { profile: "Profile", roles: "Roles", activity: "Activity" };
  const tabIcon  = { profile: User, roles: Shield, activity: History };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={() => !saveLoading && !statusLoading && onClose(false)}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <div
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl
                     flex flex-col overflow-hidden animate-in zoom-in-95 duration-200
                     max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4 flex-shrink-0">
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                {loading ? (
                  <div className="h-5 w-40 bg-white/20 rounded animate-pulse" />
                ) : error ? (
                  <h2 className="text-white font-semibold">Error</h2>
                ) : (
                  <>
                    <h2 className="text-white text-lg font-semibold truncate">
                      {admin?.name}
                    </h2>
                    <p className="text-white/60 text-sm">@{admin?.username}</p>
                  </>
                )}
              </div>

              <div className="flex gap-2 flex-shrink-0">
                {activeTab === "profile" && !loading && !error && (
                  isEditing ? (
                    <>
                      <button onClick={handleCancelEdit} disabled={saveLoading}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/15
                                   text-white hover:bg-white/25 disabled:opacity-50">
                        Cancel
                      </button>
                      <button onClick={handleSave} disabled={saveLoading}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-500
                                   text-white flex items-center gap-1.5 hover:bg-emerald-600 disabled:opacity-50">
                        {saveLoading
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Save size={14} />
                        }
                        Save
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setIsEditing(true)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/15
                                 text-white flex items-center gap-1.5 hover:bg-white/25">
                      <Pencil size={14} /> Edit
                    </button>
                  )
                )}
                <button
                  onClick={() => !saveLoading && !statusLoading && onClose(false)}
                  disabled={saveLoading || statusLoading}
                  className="p-2 rounded-lg bg-white/15 text-white hover:bg-red-500/30
                             disabled:opacity-50 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            {!loading && !error && (
              <div className="flex gap-1 mt-4">
                {TABS.map((t) => {
                  const Icon = tabIcon[t];
                  return (
                    <button
                      key={t}
                      onClick={() => {
                        setActiveTab(t);
                        if (isEditing) handleCancelEdit();
                      }}
                      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                                  rounded-t-lg transition-colors
                                  ${activeTab === t
                                    ? "bg-white text-indigo-700"
                                    : "text-white/60 hover:text-white hover:bg-white/10"
                                  }`}
                    >
                      <Icon size={14} />
                      {tabLabel[t]}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 bg-gray-50 min-h-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 size={28} className="animate-spin text-indigo-400" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <AlertCircle size={40} className="text-red-400" />
                <p className="text-red-600 text-sm">{error}</p>
                <button onClick={() => onClose(false)}
                  className="text-sm text-gray-500 underline">Close</button>
              </div>
            ) : activeTab === "profile" ? (
              renderProfile()
            ) : activeTab === "roles" ? (
              <AdminRolesTab
                admin={admin}
                onRolesChanged={() => {
                  // refresh the admin row in table to update displayed role
                  onAdminUpdate?.(adminId, {});
                }}
              />
            ) : (
              <AdminActivityTab activities={admin?.activityLogs ?? []} />
            )}
          </div>

          {/* Footer */}
          {!loading && !error && (
            <div className="px-6 py-3 bg-white border-t flex justify-between items-center flex-shrink-0">
              <p className="text-xs text-gray-400 truncate">
                ID: {admin?.id}
              </p>
              <button
                onClick={() => { setStatusError(null); setShowStatusConfirm(true); }}
                disabled={isEditing}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2
                            transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                            ${admin?.status === "Active"
                              ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                              : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            }`}
              >
                {admin?.status === "Active"
                  ? <><Ban size={15} /> Suspend</>
                  : <><CheckCircle size={15} /> Activate</>
                }
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showStatusConfirm}
        onClose={() => { setShowStatusConfirm(false); setStatusError(null); }}
        onConfirm={handleToggleStatus}
        loading={statusLoading}
        title={admin?.status === "Active" ? "Suspend Admin?" : "Activate Admin?"}
        message={
          statusError
            ? <span className="text-red-600">{statusError}</span>
            : `Are you sure you want to ${admin?.status === "Active" ? "suspend" : "activate"} "${admin?.name}"?`
        }
        confirmText={admin?.status === "Active" ? "Suspend" : "Activate"}
        type={admin?.status === "Active" ? "warning" : "success"}
      />
    </>
  );
};

export default AdminDetailsModal;