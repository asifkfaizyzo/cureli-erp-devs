// frontend/src/pages/settings/plans/comps/ComplianceModal.jsx

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Users,
  Building2,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Info,
  User,
  Store,
  AlertTriangle,
  UserMinus,
  ArrowRightLeft,
} from "lucide-react";
import { getDowngradeCompliance } from "../../../../api/subscription";

/**
 * ComplianceModal
 * Step B: Select users to disable and branches to deactivate
 * Horizontal layout for better space utilization
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

  // Branch user handling state
  const [branchUserActions, setBranchUserActions] = useState({});

  // Load compliance data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getDowngradeCompliance(targetPlan.plan_id);
      const payload = response.data?.data || response.data;

      setUsers(payload.users || []);
      setBranches(payload.branches || []);
      setCounts(payload.counts || null);
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

  // Get users for a specific branch
  const getUsersForBranch = useCallback(
    (branchId) => {
      const branch = branches.find((b) => b.branch_id === branchId);
      if (!branch) return [];
      return users.filter((user) => user.branch_name === branch.branch_name);
    },
    [users, branches]
  );

  // Get all users that will be disabled
  const allUsersToDisable = useMemo(() => {
    const directlySelected = new Set(selectedUsers);

    selectedBranches.forEach((branchId) => {
      const action = branchUserActions[branchId];
      if (!action || action.action === "disable") {
        const branchUsers = getUsersForBranch(branchId);
        branchUsers.forEach((u) => directlySelected.add(u.user_id));
      }
    });

    return Array.from(directlySelected);
  }, [selectedUsers, selectedBranches, branchUserActions, getUsersForBranch]);

  // Get user reassignments
  const userReassignments = useMemo(() => {
    const reassignments = [];

    selectedBranches.forEach((branchId) => {
      const action = branchUserActions[branchId];
      if (action?.action === "reassign" && action.targetBranchId) {
        const branchUsers = getUsersForBranch(branchId);
        branchUsers.forEach((user) => {
          reassignments.push({
            userId: user.user_id,
            fromBranchId: branchId,
            toBranchId: action.targetBranchId,
          });
        });
      }
    });

    return reassignments;
  }, [selectedBranches, branchUserActions, getUsersForBranch]);

  // Get available branches for reassignment
  const availableBranchesForReassign = useMemo(() => {
    return branches.filter((b) => !selectedBranches.includes(b.branch_id));
  }, [branches, selectedBranches]);

  // Check if all branch user actions are resolved
  const allBranchActionsResolved = useMemo(() => {
    return selectedBranches.every((branchId) => {
      const branchUsers = getUsersForBranch(branchId);
      if (branchUsers.length === 0) return true;

      const action = branchUserActions[branchId];
      if (!action) return false;

      if (action.action === "reassign" && !action.targetBranchId) {
        return false;
      }

      return true;
    });
  }, [selectedBranches, branchUserActions, getUsersForBranch]);

  // Calculate compliance status
  const calculateCompliance = () => {
    if (!counts || typeof counts.activeUsers !== "number") {
      return {
        users: false,
        branches: false,
        overall: false,
        activeUsersAfter: 0,
        activeBranchesAfter: 0,
        userLimit: 0,
        branchLimit: 0,
      };
    }

    const activeUsersAfter = counts.activeUsers - allUsersToDisable.length;
    const activeBranchesAfter = counts.activeBranches - selectedBranches.length;

    const userLimit = counts.userLimit === -1 ? Infinity : counts.userLimit;
    const branchLimit = counts.branchLimit === -1 ? Infinity : counts.branchLimit;

    const usersCompliant = activeUsersAfter <= userLimit;
    const branchesCompliant =
      activeBranchesAfter <= branchLimit && activeBranchesAfter >= 1;

    return {
      users: usersCompliant,
      branches: branchesCompliant,
      overall: usersCompliant && branchesCompliant && allBranchActionsResolved,
      activeUsersAfter,
      activeBranchesAfter,
      userLimit: counts.userLimit,
      branchLimit: counts.branchLimit,
    };
  };

  const compliance = calculateCompliance();

  // Toggle user selection
  const toggleUser = (userId) => {
    const user = users.find((u) => u.user_id === userId);
    if (user) {
      const userBranch = branches.find((b) => b.branch_name === user.branch_name);
      if (userBranch && selectedBranches.includes(userBranch.branch_id)) {
        return;
      }
    }

    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Toggle branch selection
  const toggleBranch = (branchId) => {
    const isSelected = selectedBranches.includes(branchId);

    if (!isSelected) {
      const activeBranchesAfter = counts.activeBranches - selectedBranches.length - 1;
      if (activeBranchesAfter < 1) {
        alert("You must keep at least one active branch.");
        return;
      }

      const branchUsers = getUsersForBranch(branchId);
      if (branchUsers.length > 0) {
        setBranchUserActions((prev) => ({
          ...prev,
          [branchId]: { action: "disable" },
        }));
      }
    } else {
      setBranchUserActions((prev) => {
        const newActions = { ...prev };
        delete newActions[branchId];
        return newActions;
      });
    }

    setSelectedBranches((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId]
    );
  };

  // Set branch user action
  const setBranchAction = (branchId, action, targetBranchId = null) => {
    setBranchUserActions((prev) => ({
      ...prev,
      [branchId]: {
        action,
        targetBranchId: action === "reassign" ? targetBranchId : null,
      },
    }));
  };

  // Handle continue
  const handleContinue = () => {
    if (!compliance.overall) return;

    onComplete({
      usersToDisable: allUsersToDisable,
      branchesToDeactivate: selectedBranches,
      userReassignments: userReassignments,
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

  // Get selected branch with users for the action panel
  const selectedBranchesWithUsers = selectedBranches
    .map((branchId) => {
      const branch = branches.find((b) => b.branch_id === branchId);
      const branchUsers = getUsersForBranch(branchId);
      return { branch, users: branchUsers, action: branchUserActions[branchId] };
    })
    .filter((item) => item.branch && item.users.length > 0);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl relative overflow-hidden max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold">Compliance Review</h2>
              <span className="text-white/70 text-sm">
                Downgrading to {targetPlan?.name}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Inline Status Bar */}
        <div className="px-6 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Users Status */}
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  compliance.users ? "bg-emerald-100" : "bg-red-100"
                }`}
              >
                {compliance.users ? (
                  <CheckCircle size={14} className="text-emerald-600" />
                ) : (
                  <XCircle size={14} className="text-red-600" />
                )}
              </div>
              <span className="text-sm text-gray-600">Users:</span>
              <span
                className={`text-sm font-semibold ${
                  compliance.users ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {compliance.activeUsersAfter}/
                {compliance.userLimit === -1 ? "∞" : compliance.userLimit}
              </span>
            </div>

            <div className="w-px h-4 bg-gray-300" />

            {/* Branches Status */}
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  compliance.branches ? "bg-emerald-100" : "bg-red-100"
                }`}
              >
                {compliance.branches ? (
                  <CheckCircle size={14} className="text-emerald-600" />
                ) : (
                  <XCircle size={14} className="text-red-600" />
                )}
              </div>
              <span className="text-sm text-gray-600">Branches:</span>
              <span
                className={`text-sm font-semibold ${
                  compliance.branches ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {compliance.activeBranchesAfter}/
                {compliance.branchLimit === -1 ? "∞" : compliance.branchLimit}
              </span>
            </div>

            {/* Info hint */}
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Info size={12} />
              <span>Min 1 branch required</span>
            </div>
          </div>

          {/* Overall Status */}
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              compliance.overall
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {compliance.overall ? "✓ Ready" : "Action required"}
          </div>
        </div>

        {/* Main Content - Horizontal Layout */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left: Users Panel */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-gray-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Users</h3>
                <span className="text-xs text-gray-500">({users.length})</span>
              </div>
              {needsUserAction && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                  -{analysis.excessUsers}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {users.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <User size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No users to manage</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {users.map((user) => {
                    const isDirectlySelected = selectedUsers.includes(user.user_id);
                    const isFromDeactivatedBranch =
                      allUsersToDisable.includes(user.user_id) && !isDirectlySelected;
                    const isBeingReassigned = userReassignments.some(
                      (r) => r.userId === user.user_id
                    );
                    const isSelected = isDirectlySelected || isFromDeactivatedBranch;
                    const isDisabled = isFromDeactivatedBranch || isBeingReassigned;

                    return (
                      <div
                        key={user.user_id}
                        onClick={() => !isDisabled && toggleUser(user.user_id)}
                        className={`flex items-center gap-2 p-2 rounded-lg transition-all text-sm ${
                          isBeingReassigned
                            ? "bg-blue-50 border border-blue-200"
                            : isSelected
                            ? "bg-red-50 border border-red-200"
                            : "bg-white border border-gray-100 hover:border-gray-300"
                        } ${isDisabled ? "cursor-default" : "cursor-pointer"}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected && !isBeingReassigned}
                          onChange={() => {}}
                          disabled={isDisabled}
                          className="w-3.5 h-3.5 text-red-600 border-gray-300 rounded focus:ring-red-500 disabled:opacity-50"
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium text-xs truncate ${
                              isBeingReassigned
                                ? "text-blue-700"
                                : isSelected
                                ? "text-red-700 line-through"
                                : "text-gray-900"
                            }`}
                          >
                            {user.full_name}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate">
                            {user.branch_name}
                          </p>
                        </div>
                        {isBeingReassigned && (
                          <ArrowRightLeft size={10} className="text-blue-500" />
                        )}
                        {isFromDeactivatedBranch && !isBeingReassigned && (
                          <span className="text-[9px] bg-orange-100 text-orange-700 px-1 rounded">
                            branch
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Users Summary */}
            {allUsersToDisable.length > 0 && (
              <div className="px-3 py-2 bg-red-50 border-t border-red-100 text-xs text-red-700">
                {allUsersToDisable.length} disabled
                {userReassignments.length > 0 && (
                  <span className="text-blue-700"> • {userReassignments.length} reassigned</span>
                )}
              </div>
            )}
          </div>

          {/* Middle: Branches Panel */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-gray-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Branches</h3>
                <span className="text-xs text-gray-500">({branches.length})</span>
              </div>
              {needsBranchAction && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                  -{analysis.excessBranches}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {branches.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Store size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No branches to manage</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {branches.map((branch) => {
                    const isSelected = selectedBranches.includes(branch.branch_id);
                    const canDeactivate =
                      (counts?.activeBranches || 0) - selectedBranches.length > 1 ||
                      isSelected;
                    const branchUsers = getUsersForBranch(branch.branch_id);
                    const hasUsers = branchUsers.length > 0;
                    const currentAction = branchUserActions[branch.branch_id];

                    return (
                      <div
                        key={branch.branch_id}
                        onClick={() => canDeactivate && toggleBranch(branch.branch_id)}
                        className={`p-2 rounded-lg transition-all ${
                          !canDeactivate && !isSelected
                            ? "opacity-50 cursor-not-allowed bg-gray-50"
                            : isSelected
                            ? "bg-red-50 border border-red-200 cursor-pointer"
                            : "bg-white border border-gray-100 hover:border-gray-300 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            disabled={!canDeactivate && !isSelected}
                            className="w-3.5 h-3.5 text-red-600 border-gray-300 rounded focus:ring-red-500 disabled:opacity-50"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <p
                                className={`font-medium text-xs ${
                                  isSelected ? "text-red-700 line-through" : "text-gray-900"
                                }`}
                              >
                                {branch.branch_name}
                              </p>
                              {branch.is_main && (
                                <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1 rounded">
                                  Main
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500">
                              {branch.user_count} user{branch.user_count !== 1 ? "s" : ""}
                            </p>
                          </div>
                          {isSelected && hasUsers && (
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded ${
                                currentAction?.action === "reassign"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {currentAction?.action === "reassign" ? "→" : "×"}{" "}
                              {branchUsers.length}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Branches Summary */}
            {selectedBranches.length > 0 && (
              <div className="px-3 py-2 bg-red-50 border-t border-red-100 text-xs text-red-700">
                {selectedBranches.length} branch{selectedBranches.length > 1 ? "es" : ""}{" "}
                deactivating
              </div>
            )}
          </div>

          {/* Right: Branch User Actions Panel */}
          <div className="w-1/3 flex flex-col bg-gray-50">
            <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Branch Users</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {selectedBranchesWithUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <UserMinus size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Select a branch with users</p>
                  <p className="text-[10px] mt-1">to configure user actions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedBranchesWithUsers.map(({ branch, users: branchUsers, action }) => (
                    <div
                      key={branch.branch_id}
                      className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                    >
                      {/* Branch Header */}
                      <div className="px-3 py-2 bg-red-50 border-b border-red-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 size={12} className="text-red-600" />
                          <span className="text-xs font-medium text-red-700">
                            {branch.branch_name}
                          </span>
                        </div>
                        <span className="text-[10px] text-red-600">
                          {branchUsers.length} user{branchUsers.length > 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Action Options - Inline */}
                      <div className="p-2 space-y-1.5">
                        {/* Disable Option */}
                        <label
                          className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-all ${
                            action?.action === "disable"
                              ? "border-red-300 bg-red-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`action-${branch.branch_id}`}
                            checked={action?.action === "disable"}
                            onChange={() => setBranchAction(branch.branch_id, "disable")}
                            className="w-3 h-3 text-red-600 focus:ring-red-500"
                          />
                          <UserMinus size={12} className="text-red-600" />
                          <span className="text-xs text-gray-700">Disable all</span>
                        </label>

                        {/* Reassign Option */}
                        {availableBranchesForReassign.length > 0 && (
                          <div
                            className={`rounded border transition-all ${
                              action?.action === "reassign"
                                ? "border-blue-300 bg-blue-50"
                                : "border-gray-200"
                            }`}
                          >
                            <label className="flex items-center gap-2 p-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`action-${branch.branch_id}`}
                                checked={action?.action === "reassign"}
                                onChange={() => setBranchAction(branch.branch_id, "reassign")}
                                className="w-3 h-3 text-blue-600 focus:ring-blue-500"
                              />
                              <ArrowRightLeft size={12} className="text-blue-600" />
                              <span className="text-xs text-gray-700">Reassign to</span>
                            </label>

                            {action?.action === "reassign" && (
                              <div className="px-2 pb-2">
                                <select
                                  value={action.targetBranchId || ""}
                                  onChange={(e) =>
                                    setBranchAction(
                                      branch.branch_id,
                                      "reassign",
                                      e.target.value
                                    )
                                  }
                                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="">Select branch...</option>
                                  {availableBranchesForReassign.map((b) => (
                                    <option key={b.branch_id} value={b.branch_id}>
                                      {b.branch_name}
                                      {b.is_main ? " (Main)" : ""}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Affected Users Preview */}
                      <div className="px-2 pb-2">
                        <div className="flex flex-wrap gap-1">
                          {branchUsers.slice(0, 3).map((user) => (
                            <span
                              key={user.user_id}
                              className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                            >
                              {user.full_name}
                            </span>
                          ))}
                          {branchUsers.length > 3 && (
                            <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                              +{branchUsers.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Required Warning */}
            {selectedBranches.length > 0 && !allBranchActionsResolved && (
              <div className="px-3 py-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-700 flex items-center gap-2">
                <AlertTriangle size={12} />
                <span>Configure all branch user actions</span>
              </div>
            )}
          </div>
        </div>

        {/* Compact Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          <div className="flex items-center gap-3">
            {!compliance.overall && (
              <span className="text-xs text-red-600">
                {!allBranchActionsResolved
                  ? "Configure branch actions"
                  : "Complete required actions"}
              </span>
            )}
            <button
              onClick={handleContinue}
              disabled={!compliance.overall}
              className="flex items-center gap-1.5 px-5 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ComplianceModal;