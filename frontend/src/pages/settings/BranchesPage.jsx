// src/pages/settings/BranchesPage.jsx

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Plus,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { usePermission } from "../../hooks/usePermission";
import {
  fetchBranches,
  fetchBranchLimits,
} from "../../api/branches";

// Components
import BranchLimitBanner from "./components/BranchLimitBanner";
import BranchListTable from "./components/BranchListTable";
import AddEditBranchModal from "./components/AddEditBranchModal";

/**
 * BranchesPage
 * Branch management page (SA only for full access, BA view-only for own branch)
 */
const BranchesPage = () => {
  const { isSuperAdmin, isBranchAdmin, branchId } = usePermission();

  // ============================================
  // STATE
  // ============================================
  
  // Data
  const [branches, setBranches] = useState([]);
  const [limits, setLimits] = useState(null);

  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);

  // ============================================
  // DATA FETCHING
  // ============================================

  // Fetch branch limits (SA only)
  const loadLimits = useCallback(async () => {
    if (!isSuperAdmin) return;
    
    try {
      const response = await fetchBranchLimits();
      if (response.success) {
        setLimits(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch limits:", err);
    }
  }, [isSuperAdmin]);

  // Fetch branches
  const loadBranches = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchBranches({ include_inactive: isSuperAdmin });

      if (response.success) {
        setBranches(response.data.branches || []);
      }
    } catch (err) {
      console.error("Failed to fetch branches:", err);
      setError("Failed to load branches. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  // Initial load
  useEffect(() => {
    loadLimits();
    loadBranches();
  }, [loadLimits, loadBranches, refreshKey]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleAddBranch = () => {
    setSelectedBranch(null);
    setShowAddEditModal(true);
  };

  const handleEditBranch = (branch) => {
    setSelectedBranch(branch);
    setShowAddEditModal(true);
  };

  const handleModalClose = (shouldRefresh = false) => {
    setShowAddEditModal(false);
    setSelectedBranch(null);
    
    if (shouldRefresh) {
      handleRefresh();
    }
  };

  // ============================================
  // RENDER
  // ============================================

  // BA sees read-only view
  if (isBranchAdmin) {
    return (
      <div className="h-full flex flex-col gap-4 p-1">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-[#000060] flex items-center gap-2">
            <Building2 size={24} />
            Branch Information
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View your branch details
          </p>
        </div>

        {/* BA Branch Info Card */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={32} className="animate-spin text-gray-400" />
            </div>
          ) : branches.length > 0 ? (
            <BranchInfoCard 
              branch={branches[0]} 
              onEdit={() => handleEditBranch(branches[0])}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No branch information available
            </div>
          )}
        </div>

        {/* Edit Modal for BA (own branch only) */}
        {showAddEditModal && selectedBranch && (
          <AddEditBranchModal
            branch={selectedBranch}
            onClose={handleModalClose}
            isSuperAdmin={false}
          />
        )}
      </div>
    );
  }

  // SA sees full management view
  return (
    <div className="h-full flex flex-col gap-4 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#000060] flex items-center gap-2">
            <Building2 size={24} />
            Branch Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all branches for your business
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </motion.button>

          {/* Add Branch Button */}
          {limits?.can_add && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddBranch}
              className="flex items-center gap-2 px-4 py-2 bg-[#000060] text-white rounded-lg font-medium hover:bg-[#000080] transition-colors shadow-md"
            >
              <Plus size={18} />
              Add Branch
            </motion.button>
          )}
        </div>
      </div>

      {/* Limit Banner */}
      {limits && (
        <BranchLimitBanner limits={limits} />
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
        >
          <AlertCircle size={20} />
          <span>{error}</span>
          <button
            onClick={handleRefresh}
            className="ml-auto text-sm font-medium hover:underline"
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* Branch Table */}
      <div className="flex-1 min-h-0">
        <BranchListTable
          branches={branches}
          loading={loading}
          onEdit={handleEditBranch}
          onRefresh={handleRefresh}
        />
      </div>

      {/* Add/Edit Modal */}
      {showAddEditModal && (
        <AddEditBranchModal
          branch={selectedBranch}
          onClose={handleModalClose}
          isSuperAdmin={true}
        />
      )}
    </div>
  );
};

/**
 * BranchInfoCard - Read-only branch info for BA
 */
const BranchInfoCard = ({ branch, onEdit }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#000060]/10 rounded-xl flex items-center justify-center">
            <Building2 size={28} className="text-[#000060]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{branch.branch_name}</h2>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              branch.is_main
                ? "bg-emerald-100 text-emerald-700"
                : "bg-blue-100 text-blue-700"
            }`}>
              {branch.is_main ? "Main Branch" : "Branch"}
            </span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onEdit}
          className="px-4 py-2 text-[#000060] border border-[#000060] rounded-lg font-medium hover:bg-[#000060]/5 transition-colors"
        >
          Edit Details
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Address */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Address</h3>
          <p className="text-gray-900">
            {[
              branch.address_line_1,
              branch.address_line_2,
              branch.city,
              branch.state,
              branch.pincode,
            ].filter(Boolean).join(", ") || "Not provided"}
          </p>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Contact</h3>
          <p className="text-gray-900">
            {branch.contact_number || "Not provided"}
          </p>
          {branch.alternate_number && (
            <p className="text-gray-600 text-sm mt-1">
              Alt: {branch.alternate_number}
            </p>
          )}
        </div>

        {/* User Count */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Team Members</h3>
          <p className="text-gray-900">
            {branch.user_count || 0} user{branch.user_count !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Status */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            branch.is_active
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-600"
          }`}>
            {branch.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default BranchesPage;