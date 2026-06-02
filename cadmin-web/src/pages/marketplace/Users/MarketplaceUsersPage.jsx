// cadmin-web/src/pages/marketplace/Users/MarketplaceUsersPage.jsx

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  RefreshCw,
  Users,
  User,
  Phone,
  Mail,
  Calendar,
  ChevronRight,
  X,
  Filter,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  getMobileUsers,
  getMobileUserById,
  editMobileUser,
  editMobileUserPhone,
  blockMobileUser,
  revokeMobileUserSessions,
  deleteMobileUser,
} from "../../../api/cadminMobileUsers";
import UserDetailPanel from "./comps/UserDetailPanel";
import EditUserModal from "./comps/EditUserModal";
import BlockUserModal from "./comps/BlockUserModal";
import DeleteUserModal from "./comps/DeleteUserModal";

// ── Helpers ────────────────────────────────────────────────────
const fmt = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const fmtRelative = (dateStr) => {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return fmt(dateStr);
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
      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${cfg.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ── Table skeleton ─────────────────────────────────────────────
const TableSkeleton = ({ rows = 10 }) => (
  <tbody>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} className="border-b border-gray-50">
        {Array.from({ length: 6 }).map((__, j) => (
          <td key={j} className="px-4 py-3">
            <div className="h-4 bg-gray-100 rounded animate-pulse" />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

// ── Empty state ────────────────────────────────────────────────
const EmptyState = ({ query }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <Users size={40} className="text-gray-200 mb-3" />
    <p className="text-sm font-medium text-gray-500">
      {query ? `No users found for "${query}"` : "No marketplace users yet"}
    </p>
    <p className="text-xs text-gray-400 mt-1">
      {query
        ? "Try a different search term"
        : "Users registered on the mobile app will appear here"}
    </p>
  </div>
);

// ── Toast (lightweight inline) ─────────────────────────────────
const useToast = () => {
  const [toast, setToast] = useState(null);

  const show = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  return { toast, show };
};

const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
        toast.type === "error"
          ? "bg-red-600 text-white"
          : toast.type === "warning"
          ? "bg-amber-500 text-white"
          : "bg-[#05015A] text-white"
      }`}
    >
      {toast.message}
    </div>
  );
};

// ── STATUS FILTER TABS ─────────────────────────────────────────
const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "active", label: "Active" },
  { key: "suspended", label: "Suspended" },
];

// ── MAIN PAGE ──────────────────────────────────────────────────
const MarketplaceUsersPage = () => {
  // ── State ──
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 20;

  // Selected user + detail
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const { toast, show: showToast } = useToast();

  // ── Debounce search ──
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  // ── Fetch list ──
  const fetchUsers = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      try {
        const res = await getMobileUsers({
          page,
          limit: PAGE_SIZE,
          search: debouncedSearch,
          status: statusFilter,
        });

        const d = res.data?.data;
        setUsers(d?.users || []);
        setTotalPages(d?.total_pages || 1);
        setTotalCount(d?.total || 0);
      } catch (err) {
        console.error("Failed to fetch mobile users:", err);
        showToast("Failed to load users", "error");
        setUsers([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, debouncedSearch, statusFilter]
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Fetch user detail ──
  const fetchDetail = useCallback(async (userId) => {
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await getMobileUserById(userId);
      setDetailData(res.data?.data || null);
    } catch (err) {
      console.error("Failed to fetch user detail:", err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleSelectUser = (user) => {
    if (selectedUser?.id === user.id) {
      setSelectedUser(null);
      setDetailData(null);
      return;
    }
    setSelectedUser(user);
    fetchDetail(user.id);
  };

  // ── Edit ──
  const handleEditConfirm = async (type, data) => {
    setActionLoading(true);
    try {
      if (type === "profile") {
        await editMobileUser(selectedUser.id, data);
        showToast("Profile updated successfully");
      } else {
        await editMobileUserPhone(selectedUser.id, data.phone);
        showToast("Phone number updated");
      }
      setShowEditModal(false);
      fetchUsers({ silent: true });
      fetchDetail(selectedUser.id);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to update user";
      showToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Block ──
  const handleBlockConfirm = async (block, reason) => {
    setActionLoading(true);
    try {
      const res = await blockMobileUser(selectedUser.id, block, reason);
      const updated = res.data?.data;
      showToast(
        block ? "User suspended successfully" : "User reactivated"
      );
      setShowBlockModal(false);

      // Update local state immediately
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, status: updated.status } : u
        )
      );
      setSelectedUser((prev) =>
        prev ? { ...prev, status: updated.status } : prev
      );
      fetchDetail(selectedUser.id);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to update user status";
      showToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Revoke sessions ──
  const handleRevokeSessions = async () => {
    setActionLoading(true);
    try {
      const res = await revokeMobileUserSessions(selectedUser.id);
      const count = res.data?.data?.sessions_revoked || 0;
      showToast(
        count > 0
          ? `Revoked ${count} active session(s)`
          : "No active sessions to revoke",
        count > 0 ? "success" : "warning"
      );
      fetchDetail(selectedUser.id);
    } catch (err) {
      showToast("Failed to revoke sessions", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Delete ──
  const handleDeleteConfirm = async (reason) => {
    setActionLoading(true);
    try {
      await deleteMobileUser(selectedUser.id, reason);
      showToast("Account deleted permanently");
      setShowDeleteModal(false);
      setSelectedUser(null);
      setDetailData(null);
      fetchUsers({ silent: true });
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to delete account";
      showToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Render ──
  return (
    <div className="flex h-full">
      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 p-6">
        {/* Page header */}
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Marketplace Users
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading
                ? "Loading..."
                : `${totalCount.toLocaleString()} registered app user${
                    totalCount !== 1 ? "s" : ""
                  }`}
            </p>
          </div>

          <button
            onClick={() => fetchUsers({ silent: true })}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={refreshing ? "animate-spin" : ""}
            />
            <span className="hidden sm:block">Refresh</span>
          </button>
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit flex-shrink-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
                statusFilter === tab.key
                  ? "bg-white text-[#05015A] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4 max-w-sm flex-shrink-0">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search name, phone or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]/40 bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-0">
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  {[
                    "User",
                    "Phone",
                    "Email",
                    "Status",
                    "Last Seen",
                    "Joined",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              {loading ? (
                <TableSkeleton rows={10} />
              ) : users.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={7}>
                      <EmptyState query={debouncedSearch} />
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  {users.map((user) => {
                    const isSelected = selectedUser?.id === user.id;
                    const initials =
                      user.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || "?";

                    return (
                      <tr
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className={`border-b border-gray-50 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-[#05015A]/[0.03]"
                            : "hover:bg-gray-50/70"
                        }`}
                      >
                        {/* Name + avatar */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#000060] to-[#0a0280] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                              {initials}
                            </div>
                            <span className="font-medium text-gray-800 truncate max-w-[140px]">
                              {user.full_name || (
                                <span className="text-gray-400 italic">
                                  No name
                                </span>
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="px-4 py-3 text-gray-600">
                          <div className="flex items-center gap-1.5">
                            {user.phone}
                            {user.phone_verified ? (
                              <CheckCircle2
                                size={12}
                                className="text-emerald-400 flex-shrink-0"
                              />
                            ) : (
                              <XCircle
                                size={12}
                                className="text-gray-300 flex-shrink-0"
                              />
                            )}
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-4 py-3 text-gray-500 truncate max-w-[160px]">
                          {user.email || (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <StatusBadge status={user.status} />
                        </td>

                        {/* Last seen */}
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {fmtRelative(user.last_seen_at)}
                        </td>

                        {/* Joined */}
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {fmt(user.created_at)}
                        </td>

                        {/* Chevron */}
                        <td className="px-4 py-3">
                          <ChevronRight
                            size={14}
                            className={`transition-colors ${
                              isSelected
                                ? "text-[#05015A]"
                                : "text-gray-300"
                            }`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              )}
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
              <p className="text-xs text-gray-500">
                Page {page} of {totalPages} · {totalCount} total
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail panel ── */}
      {selectedUser && (
        <UserDetailPanel
          user={selectedUser}
          detailData={detailData}
          detailLoading={detailLoading}
          onClose={() => {
            setSelectedUser(null);
            setDetailData(null);
          }}
          onEdit={() => setShowEditModal(true)}
          onBlock={() => setShowBlockModal(true)}
          onRevokeSessions={handleRevokeSessions}
          onDelete={() => setShowDeleteModal(true)}
        />
      )}

      {/* ── Modals ── */}
      {showEditModal && (
        <EditUserModal
          user={detailData || selectedUser}
          onConfirm={handleEditConfirm}
          onClose={() => setShowEditModal(false)}
          loading={actionLoading}
        />
      )}

      {showBlockModal && (
        <BlockUserModal
          user={selectedUser}
          onConfirm={handleBlockConfirm}
          onClose={() => setShowBlockModal(false)}
          loading={actionLoading}
        />
      )}

      {showDeleteModal && (
        <DeleteUserModal
          user={selectedUser}
          onConfirm={handleDeleteConfirm}
          onClose={() => setShowDeleteModal(false)}
          loading={actionLoading}
        />
      )}

      {/* ── Toast ── */}
      <Toast toast={toast} />
    </div>
  );
};

export default MarketplaceUsersPage;