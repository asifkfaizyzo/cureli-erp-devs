// src/pages/settings/components/BranchListTable.jsx

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  MoreVertical,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Users,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { deleteBranch } from "../../../api/branches";

/**
 * ActionMenu Component - Rendered via Portal
 */
const ActionMenu = ({
  branch,
  position,
  onClose,
  onEdit,
  onDelete,
}) => {
  const menuRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Close on scroll
  useEffect(() => {
    const handleScroll = () => onClose();
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [onClose]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!position) return null;

  return createPortal(
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1 }}
      className="fixed w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] py-1"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {/* Edit */}
      <button
        onClick={() => {
          onClose();
          onEdit(branch);
        }}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Edit2 size={14} />
        Edit Branch
      </button>

      {/* Delete (not for main branch) */}
      {!branch.is_main && branch.is_active && (
        <>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => {
              onClose();
              onDelete(branch);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            Deactivate
          </button>
        </>
      )}

      {/* Info for main branch */}
      {branch.is_main && (
        <p className="px-4 py-2 text-xs text-gray-400 italic">
          Main branch cannot be deleted
        </p>
      )}
    </motion.div>,
    document.body
  );
};

/**
 * BranchListTable
 * Displays branches in a table/card view with actions
 */
const BranchListTable = ({
  branches,
  loading,
  onEdit,
  onRefresh,
}) => {
  const [actionMenuState, setActionMenuState] = useState({
    branchId: null,
    position: null,
  });
  const [deletingBranchId, setDeletingBranchId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const actionButtonRefs = useRef({});

  // Calculate dropdown position
  const calculateMenuPosition = useCallback((branchId) => {
    const buttonEl = actionButtonRefs.current[branchId];
    if (!buttonEl) return null;

    const rect = buttonEl.getBoundingClientRect();
    const menuWidth = 160; // w-40 = 10rem = 160px
    const menuHeight = 100; // Approximate height
    const padding = 8;

    let top = rect.bottom + padding;
    let left = rect.right - menuWidth;

    // Check if menu would go below viewport
    if (top + menuHeight > window.innerHeight) {
      top = rect.top - menuHeight - padding;
    }

    // Check if menu would go off left side
    if (left < padding) {
      left = padding;
    }

    // Check if menu would go off right side
    if (left + menuWidth > window.innerWidth - padding) {
      left = window.innerWidth - menuWidth - padding;
    }

    return { top, left };
  }, []);

  const handleActionClick = (branchId) => {
    if (actionMenuState.branchId === branchId) {
      setActionMenuState({ branchId: null, position: null });
    } else {
      const position = calculateMenuPosition(branchId);
      setActionMenuState({ branchId, position });
    }
    setDeleteError(null);
  };

  const handleCloseMenu = () => {
    setActionMenuState({ branchId: null, position: null });
  };

  const handleDelete = async (branch) => {
    // Confirm deletion
    if (!confirm(`Are you sure you want to deactivate "${branch.branch_name}"? This action can be undone by support.`)) {
      return;
    }

    setDeletingBranchId(branch.branch_id);
    setDeleteError(null);

    try {
      await deleteBranch(branch.branch_id);
      onRefresh();
    } catch (err) {
      console.error("Failed to delete branch:", err);
      
      const errorData = err.response?.data;
      
      if (errorData?.data?.code === "BRANCH_HAS_USERS") {
        setDeleteError({
          branchId: branch.branch_id,
          message: errorData.message,
          userCount: errorData.data?.user_count,
        });
      } else {
        setDeleteError({
          branchId: branch.branch_id,
          message: errorData?.message || "Failed to deactivate branch",
        });
      }
    } finally {
      setDeletingBranchId(null);
    }
  };

  // Format address
  const formatAddress = (branch) => {
    const parts = [
      branch.address_line_1,
      branch.city,
      branch.state,
      branch.pincode,
    ].filter(Boolean);
    return parts.join(", ") || "No address";
  };

  // Loading state
  if (loading && branches.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-gray-200">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 size={32} className="animate-spin" />
          <p>Loading branches...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!loading && branches.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-gray-200">
        <div className="flex flex-col items-center gap-3 text-gray-500 py-12">
          <Building2 size={48} className="text-gray-300" />
          <p className="text-lg font-medium">No branches found</p>
          <p className="text-sm">Create your first branch to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="col-span-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Branch
        </div>
        <div className="col-span-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Address
        </div>
        <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Contact
        </div>
        <div className="col-span-1 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">
          Users
        </div>
        <div className="col-span-1 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">
          Status
        </div>
        <div className="col-span-1 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">
          Actions
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-100">
        {branches.map((branch) => {
          const isDeleting = deletingBranchId === branch.branch_id;
          const hasDeleteError = deleteError?.branchId === branch.branch_id;

          return (
            <motion.div
              key={branch.branch_id}
              initial={{ opacity: 0 }}
              animate={{ opacity: isDeleting ? 0.5 : 1 }}
              className="relative"
            >
              {/* Delete Error Banner */}
              {hasDeleteError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="px-6 py-2 bg-red-50 border-b border-red-200"
                >
                  <div className="flex items-center gap-2 text-sm text-red-700">
                    <AlertCircle size={14} />
                    <span>{deleteError.message}</span>
                    <button
                      onClick={() => setDeleteError(null)}
                      className="ml-auto text-xs font-medium hover:underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Row Content */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center">
                {/* Branch Info */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    branch.is_main ? "bg-emerald-100" : "bg-[#000060]/10"
                  }`}>
                    <Building2 size={20} className={
                      branch.is_main ? "text-emerald-600" : "text-[#000060]"
                    } />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{branch.branch_name}</p>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                      branch.is_main
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {branch.is_main ? "Main" : "Branch"}
                    </span>
                  </div>
                </div>

                {/* Address */}
                <div className="col-span-3">
                  <div className="flex items-start gap-1.5 text-sm text-gray-600">
                    <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{formatAddress(branch)}</span>
                  </div>
                </div>

                {/* Contact */}
                <div className="col-span-2">
                  {branch.contact_number ? (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Phone size={14} className="text-gray-400" />
                      {branch.contact_number}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </div>

                {/* User Count */}
                <div className="col-span-1 text-center">
                  <div className="inline-flex items-center gap-1 text-sm text-gray-600">
                    <Users size={14} className="text-gray-400" />
                    {branch.user_count || 0}
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-1 text-center">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    branch.is_active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-600"
                  }`}>
                    {branch.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex justify-end">
                  {isDeleting ? (
                    <Loader2 size={18} className="animate-spin text-gray-400" />
                  ) : (
                    <button
                      ref={(el) => (actionButtonRefs.current[branch.branch_id] = el)}
                      onClick={() => handleActionClick(branch.branch_id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Action Menu (Portal) */}
      <AnimatePresence>
        {actionMenuState.branchId && (
          <ActionMenu
            branch={branches.find((b) => b.branch_id === actionMenuState.branchId)}
            position={actionMenuState.position}
            onClose={handleCloseMenu}
            onEdit={onEdit}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BranchListTable;