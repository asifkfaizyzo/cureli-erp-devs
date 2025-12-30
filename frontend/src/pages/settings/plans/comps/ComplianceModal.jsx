// frontend/src/pages/settings/plans/comps/ComplianceModal.jsx

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  X,
  Users,
  Building2,
  ArrowLeft,
  ArrowRight,
  Check,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Info,
  User,
  Store,
} from "lucide-react";
import { getDowngradeCompliance } from "../../../../api/subscription";

/**
 * ComplianceModal
 * Step B: Select users to disable and branches to deactivate
 */
const ComplianceModal = ({
  targetPlan,
  analysis,
  onComplete,
  onBack,
  onClose,
}) => {
  // Data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [counts, setCounts] = useState(null);

  // Selection state
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);

  // Load compliance data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getDowngradeCompliance(targetPlan.plan_id);
      const data = response.data;

      setUsers(data.users || []);
      setBranches(data.branches || []);
      setCounts(data.counts || {});
    } catch (err) {
      console.error("Failed to load compliance data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [targetPlan.plan_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate compliance status
  const calculateCompliance = () => {
    if (!counts) return { users: false, branches: false, overall: false };

    const activeUsersAfter = counts.activeUsers - selectedUsers.length;
    const activeBranchesAfter = counts.activeBranches - selectedBranches.length;

    const userLimit = counts.userLimit === -1 ? Infinity : counts.userLimit;
    const branchLimit = counts.branchLimit === -1 ? Infinity : counts.branchLimit;

    const usersCompliant = activeUsersAfter <= userLimit;
    const branchesCompliant = activeBranchesAfter <= branchLimit && activeBranchesAfter >= 1;

    return {
      users: usersCompliant,
      branches: branchesCompliant,
      overall: usersCompliant && branchesCompliant,
      activeUsersAfter,
      activeBranchesAfter,
      userLimit: counts.userLimit,
      branchLimit: counts.branchLimit,
    };
  };

  const compliance = calculateCompliance();

  // Toggle user selection
  const toggleUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Toggle branch selection
  const toggleBranch = (branchId) => {
    // Check if this would leave no branches
    const branch = branches.find((b) => b.branch_id === branchId);
    const isSelected = selectedBranches.includes(branchId);

    if (!isSelected) {
      // Trying to select (deactivate) this branch
      const activeBranchesAfter = counts.activeBranches - selectedBranches.length - 1;
      if (activeBranchesAfter < 1) {
        alert("You must keep at least one active branch.");
        return;
      }
    }

    setSelectedBranches((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId]
    );
  };

  // Handle continue
  const handleContinue = () => {
    if (!compliance.overall) return;
    onComplete({
      usersToDisable: selectedUsers,
      branchesToDeactivate: selectedBranches,
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-[#000060]" />
          <p className="text-gray-600">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <p className="text-gray-900 font-semibold">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-[#000060] text-white rounded-lg hover:bg-[#000080]"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const needsUserAction = analysis.excessUsers > 0;
  const needsBranchAction = analysis.excessBranches > 0;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Compliance Review</h2>
              <p className="text-white/80 text-sm mt-1">
                Select users and branches to disable/deactivate
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Compliance Status Bar */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-6">
            {/* Users Status */}
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                compliance.users ? "bg-emerald-100" : "bg-red-100"
              }`}>
                {compliance.users ? (
                  <CheckCircle size={18} className="text-emerald-600" />
                ) : (
                  <XCircle size={18} className="text-red-600" />
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">Users</p>
                <p className={`text-sm font-medium ${compliance.users ? "text-emerald-600" : "text-red-600"}`}>
                  {compliance.activeUsersAfter} / {compliance.userLimit === -1 ? "∞" : compliance.userLimit}
                </p>
              </div>
            </div>

            {/* Branches Status */}
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                compliance.branches ? "bg-emerald-100" : "bg-red-100"
              }`}>
                {compliance.branches ? (
                  <CheckCircle size={18} className="text-emerald-600" />
                ) : (
                  <XCircle size={18} className="text-red-600" />
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">Branches</p>
                <p className={`text-sm font-medium ${compliance.branches ? "text-emerald-600" : "text-red-600"}`}>
                  {compliance.activeBranchesAfter} / {compliance.branchLimit === -1 ? "∞" : compliance.branchLimit}
                </p>
              </div>
            </div>
          </div>

          {/* Overall Status */}
          <div className={`px-4 py-1.5 rounded-full text-sm font-medium ${
            compliance.overall 
              ? "bg-emerald-100 text-emerald-700" 
              : "bg-red-100 text-red-700"
          }`}>
            {compliance.overall ? "✓ Ready to proceed" : "Action required"}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Users Section */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Users</h3>
                  <span className="text-xs text-gray-500">
                    ({users.length} available)
                  </span>
                </div>
                {needsUserAction && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    Disable {analysis.excessUsers} more
                  </span>
                )}
              </div>

              <div className="p-3 max-h-[300px] overflow-y-auto">
                {users.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <User size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No users to manage</p>
                    <p className="text-xs text-gray-400 mt-1">
                      (Shop owner is excluded)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {users.map((user) => {
                      const isSelected = selectedUsers.includes(user.user_id);
                      return (
                        <label
                          key={user.user_id}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? "bg-red-50 border border-red-200"
                              : "bg-gray-50 border border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleUser(user.user_id)}
                            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm ${isSelected ? "text-red-700 line-through" : "text-gray-900"}`}>
                              {user.full_name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              @{user.username} • {user.branch_name}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            user.role === "branch_admin"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {user.role === "branch_admin" ? "Admin" : "Staff"}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selection summary */}
              {selectedUsers.length > 0 && (
                <div className="px-4 py-2 bg-red-50 border-t border-red-100 text-sm text-red-700">
                  {selectedUsers.length} user{selectedUsers.length > 1 ? "s" : ""} will be disabled
                </div>
              )}
            </div>

            {/* Branches Section */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Branches</h3>
                  <span className="text-xs text-gray-500">
                    ({branches.length} available)
                  </span>
                </div>
                {needsBranchAction && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    Deactivate {analysis.excessBranches} more
                  </span>
                )}
              </div>

              <div className="p-3 max-h-[300px] overflow-y-auto">
                {branches.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <Store size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No branches to manage</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {branches.map((branch) => {
                      const isSelected = selectedBranches.includes(branch.branch_id);
                      const canDeactivate = counts.activeBranches - selectedBranches.length > 1 || isSelected;
                      
                      return (
                        <label
                          key={branch.branch_id}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                            !canDeactivate && !isSelected
                              ? "opacity-50 cursor-not-allowed bg-gray-50 border border-gray-100"
                              : isSelected
                                ? "bg-red-50 border border-red-200 cursor-pointer"
                                : "bg-gray-50 border border-gray-100 hover:border-gray-200 cursor-pointer"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => canDeactivate && toggleBranch(branch.branch_id)}
                            disabled={!canDeactivate && !isSelected}
                            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 disabled:opacity-50"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`font-medium text-sm ${isSelected ? "text-red-700 line-through" : "text-gray-900"}`}>
                                {branch.branch_name}
                              </p>
                              {branch.is_main && (
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                                  Main
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {branch.user_count} user{branch.user_count !== 1 ? "s" : ""} assigned
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selection summary */}
              {selectedBranches.length > 0 && (
                <div className="px-4 py-2 bg-red-50 border-t border-red-100 text-sm text-red-700">
                  {selectedBranches.length} branch{selectedBranches.length > 1 ? "es" : ""} will be deactivated
                </div>
              )}

              {/* Minimum branch warning */}
              <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 text-xs text-blue-700 flex items-center gap-2">
                <Info size={14} />
                At least 1 branch must remain active
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <button
            onClick={handleContinue}
            disabled={!compliance.overall}
            className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
            <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ComplianceModal;