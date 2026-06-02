// cadmin-web/src/pages/marketplace/Users/comps/UserDetailPanel.jsx

import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Shield,
  ShieldOff,
  ShieldCheck,
  Smartphone,
  Trash2,
  Edit2,
  LogOut,
  CheckCircle2,
  XCircle,
  Home,
  Loader2,
} from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────
const fmt = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const fmtTime = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// ── Status badge ───────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    active: {
      label: "Active",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-100",
      dot: "bg-emerald-500",
    },
    suspended: {
      label: "Suspended",
      cls: "bg-red-50 text-red-700 border-red-100",
      dot: "bg-red-500",
    },
  }[status] || {
    label: status,
    cls: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border ${cfg.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ── Detail row ─────────────────────────────────────────────────
const Row = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon size={13} className="text-gray-400" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm text-gray-700 mt-0.5 break-all">{value || "—"}</p>
    </div>
  </div>
);

// ── Main ───────────────────────────────────────────────────────
const UserDetailPanel = ({
  user,
  detailData,
  detailLoading,
  onClose,
  onEdit,
  onBlock,
  onRevokeSessions,
  onDelete,
}) => {
  if (!user) return null;

  const initials = user.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const isSuspended = user.status === "suspended";

  return (
    <div className="w-80 xl:w-96 border-l border-gray-100 bg-white flex flex-col flex-shrink-0 h-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
        <h3 className="text-sm font-semibold text-gray-800">User Details</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">
        {detailLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-gray-300 mb-2" />
            <p className="text-xs text-gray-400">Loading...</p>
          </div>
        ) : (
          <>
            {/* Avatar + name */}
            <div className="flex flex-col items-center text-center px-5 pt-6 pb-4 border-b border-gray-50">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#000060] to-[#0a0280] flex items-center justify-center text-white font-bold text-xl mb-3 flex-shrink-0">
                {initials}
              </div>
              <p className="font-semibold text-gray-900 text-base">
                {user.full_name || "No name"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{user.phone}</p>
              <div className="mt-2">
                <StatusBadge status={user.status} />
              </div>

              {/* Suspension info */}
              {isSuspended && detailData?.suspended_by && (
                <div className="mt-2 text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5 w-full text-left">
                  <p>
                    <span className="font-medium">Suspended by:</span>{" "}
                    {detailData.suspended_by}
                  </p>
                  {detailData.suspension_reason && (
                    <p className="mt-0.5">
                      <span className="font-medium">Reason:</span>{" "}
                      {detailData.suspension_reason}
                    </p>
                  )}
                  <p className="mt-0.5">
                    <span className="font-medium">On:</span>{" "}
                    {fmtTime(detailData.suspended_at)}
                  </p>
                </div>
              )}
            </div>

            {/* Info rows */}
            <div className="px-5 py-4 space-y-3 border-b border-gray-50">
              <Row
                icon={Phone}
                label="Phone"
                value={
                  <span className="flex items-center gap-1.5">
                    {user.phone}
                    {user.phone_verified ? (
                      <CheckCircle2 size={12} className="text-emerald-500" />
                    ) : (
                      <XCircle size={12} className="text-gray-300" />
                    )}
                  </span>
                }
              />
              <Row icon={Mail} label="Email" value={user.email} />
              <Row icon={Calendar} label="Joined" value={fmt(user.created_at)} />
              <Row
                icon={Clock}
                label="Last seen"
                value={fmtTime(user.last_seen_at)}
              />
            </div>

            {/* Addresses */}
            {detailData?.addresses?.length > 0 && (
              <div className="px-5 py-4 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Addresses ({detailData.addresses.length})
                </p>
                <div className="space-y-2">
                  {detailData.addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <Home
                        size={12}
                        className="text-gray-400 mt-0.5 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-medium text-gray-700">
                            {addr.custom_label || addr.label}
                          </span>
                          {addr.is_default && (
                            <span className="text-[9px] bg-[#05015A]/10 text-[#05015A] px-1.5 py-0.5 rounded font-medium">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                          {addr.address_line_1}
                          {addr.address_line_2
                            ? `, ${addr.address_line_2}`
                            : ""}
                          , {addr.city}, {addr.state} — {addr.pincode}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Sessions */}
            {detailData?.sessions?.length > 0 && (
              <div className="px-5 py-4 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Active Sessions ({detailData.sessions.length})
                </p>
                <div className="space-y-2">
                  {detailData.sessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <Smartphone
                        size={12}
                        className="text-gray-400 mt-0.5 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-700">
                          {s.device_name || s.device_platform || "Unknown device"}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          v{s.app_version || "—"} · {s.ip_address || "—"}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          Last active: {fmtTime(s.last_active_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Action buttons ── */}
      <div className="border-t border-gray-100 p-4 space-y-2 flex-shrink-0 bg-gray-50/30">
        {/* Edit */}
        <button
          onClick={onEdit}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Edit2 size={15} className="text-gray-400" />
          Edit Profile / Phone
        </button>

        {/* Block / Unblock */}
        <button
          onClick={onBlock}
          className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            isSuspended
              ? "text-emerald-700 hover:bg-emerald-50"
              : "text-amber-700 hover:bg-amber-50"
          }`}
        >
          {isSuspended ? (
            <ShieldCheck size={15} className="text-emerald-500" />
          ) : (
            <ShieldOff size={15} className="text-amber-500" />
          )}
          {isSuspended ? "Reactivate User" : "Suspend User"}
        </button>

        {/* Revoke sessions */}
        <button
          onClick={onRevokeSessions}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <LogOut size={15} className="text-blue-500" />
          Force Logout All Devices
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={15} className="text-red-400" />
          Delete Account
        </button>
      </div>
    </div>
  );
};

export default UserDetailPanel;