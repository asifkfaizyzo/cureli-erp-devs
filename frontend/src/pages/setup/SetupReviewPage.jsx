// src/pages/setup/SetupReviewPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Building2,
  Users,
  UserCog,
  ChevronLeft,
  Loader2,
  AlertCircle,
  ArrowRight,
  Crown,
  Shield,
  User,
  Phone,
  MapPin,
  RefreshCw,
} from "lucide-react";

import { useSetupStore } from "../../store/useSetupStore";
import { mockSubmitSetup } from "../../api/setup";
// When backend is ready, replace with:
// import { submitSetup } from "../../api/setup";

/**
 * SetupReviewPage
 * Step 4: Review all setup data and submit
 * 
 * Requirements:
 * - Show summary of branches, users, and operators
 * - Validate minimum requirements (≥1 branch)
 * - Submit all data to backend in one transaction
 * - Handle success → clear store → redirect to dashboard
 * - Handle error → show message → allow retry or restart
 */

const SetupReviewPage = () => {
  const navigate = useNavigate();

  // Store
  const {
    branches,
    users,
    operators,
    superAdmin,
    planLimits,
    getSubmissionData,
    completeSetup,
    resetSetup,
    setCurrentStep,
  } = useSetupStore();

  // Local state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Set current step on mount
  useEffect(() => {
    setCurrentStep(4);
  }, [setCurrentStep]);

  // ============================================
  // VALIDATION
  // ============================================

  const validationChecks = [
    {
      id: "branches",
      label: "At least one branch created",
      passed: branches.length >= 1,
      count: branches.length,
    },
    {
      id: "operators",
      label: "Each branch has a billing operator",
      passed: branches.every((b) => operators[b.temp_id]),
      count: branches.length,
    },
    {
      id: "users",
      label: "Login users available",
      passed: true, // SA always exists
      note: users.length === 0 ? "Super Admin only" : `${users.length + 1} users`,
    },
  ];

  const allChecksPassed = validationChecks.every((check) => check.passed);

  // ============================================
  // HELPERS
  // ============================================

  const getOperatorInfo = (branchTempId) => {
    const operatorId = operators[branchTempId] || "sa";

    if (operatorId === "sa") {
      return {
        name: superAdmin.name || "You",
        role: "Super Admin",
        isSuperAdmin: true,
      };
    }

    const user = users.find((u) => u.temp_id === operatorId);
    if (user) {
      return {
        name: user.full_name,
        role: user.role === "branch_admin" ? "Branch Admin" : "Staff",
        isSuperAdmin: false,
      };
    }

    return {
      name: superAdmin.name || "You",
      role: "Super Admin",
      isSuperAdmin: true,
    };
  };

  const getRoleIcon = (role) => {
    if (role === "Super Admin") return Crown;
    if (role === "Branch Admin") return Shield;
    return User;
  };

  const getUsersForBranch = (branchTempId) => {
    return users.filter((u) => u.branch_temp_id === branchTempId);
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleBack = () => {
    navigate("/setup/branch-operator");
  };

  const handleSubmit = async () => {
    if (!allChecksPassed || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const data = getSubmissionData();
      
      console.log("📤 Submitting setup data:", data);

      // Use mock for now - replace with real API when ready
      await mockSubmitSetup(data);
      // await submitSetup(data);

      // Success!
      setShowSuccess(true);

      // Wait a moment for animation, then redirect
      setTimeout(() => {
        completeSetup();
        navigate("/dashboard", { replace: true });
      }, 2000);

    } catch (err) {
      console.error("Setup submission failed:", err);
      setSubmitError(
        err.response?.data?.message ||
        "Failed to complete setup. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  const handleStartOver = () => {
    if (window.confirm("Are you sure you want to start over? All your setup data will be lost.")) {
      resetSetup();
      navigate("/setup/branches", { replace: true });
    }
  };

  // ============================================
  // SUCCESS STATE
  // ============================================

  if (showSuccess) {
    return (
      <div className="w-full max-w-3xl mx-auto py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <CheckCircle2 size={48} className="text-emerald-600" />
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-[#000060] mb-3"
          >
            Setup Complete!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 mb-6"
          >
            Your pharmacy is ready to go. Redirecting to dashboard...
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2 text-[#000060]"
          >
            <Loader2 size={20} className="animate-spin" />
            <span>Loading dashboard...</span>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className="w-full max-w-3xl mx-auto py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#000060] mb-2">
          Review Your Setup
        </h1>
        <p className="text-gray-600">
          Review your configuration before completing the setup. You can go back to
          make changes if needed.
        </p>
      </div>

      {/* Validation Checklist */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm"
      >
        <h2 className="font-semibold text-gray-800 mb-4">Setup Checklist</h2>
        <div className="space-y-3">
          {validationChecks.map((check, index) => (
            <motion.div
              key={check.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  check.passed
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-red-100 text-red-500"
                }`}
              >
                {check.passed ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
              </div>
              <div className="flex-1">
                <span
                  className={`text-sm font-medium ${
                    check.passed ? "text-gray-800" : "text-red-600"
                  }`}
                >
                  {check.label}
                </span>
                {check.note && (
                  <span className="text-xs text-gray-500 ml-2">({check.note})</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="space-y-4 mb-6">
        {/* Branches Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
        >
          <div className="bg-[#000060]/5 px-5 py-3 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#000060]/10 rounded-lg flex items-center justify-center">
                <Building2 size={18} className="text-[#000060]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Branches</h3>
                <p className="text-xs text-gray-500">
                  {branches.length} of {planLimits.max_branches === -1 ? "∞" : planLimits.max_branches} branches
                </p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {branches.map((branch, index) => {
              const operator = getOperatorInfo(branch.temp_id);
              const branchUsers = getUsersForBranch(branch.temp_id);
              const OperatorIcon = getRoleIcon(operator.role);

              return (
                <div key={branch.temp_id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-800">
                          {branch.branch_name}
                        </h4>
                        {index === 0 && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-medium rounded-full">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                        {branch.address && (
                          <div className="flex items-center gap-1">
                            <MapPin size={12} />
                            <span className="truncate max-w-[200px]">
                              {branch.address}
                            </span>
                          </div>
                        )}
                        {branch.phone && (
                          <div className="flex items-center gap-1">
                            <Phone size={12} />
                            <span>{branch.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-400 mb-1">Billing Operator</p>
                      <div className="flex items-center gap-1.5 justify-end">
                        <OperatorIcon
                          size={12}
                          className={
                            operator.isSuperAdmin
                              ? "text-amber-600"
                              : "text-purple-600"
                          }
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {operator.name}
                        </span>
                      </div>
                      {branchUsers.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          {branchUsers.length} staff member{branchUsers.length > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Users Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
        >
          <div className="bg-emerald-50 px-5 py-3 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Users size={18} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Users</h3>
                <p className="text-xs text-gray-500">
                  {users.length} of {planLimits.max_users === -1 ? "∞" : planLimits.max_users} additional users
                  <span className="text-gray-400 ml-1">(+ Super Admin)</span>
                </p>
              </div>
            </div>
          </div>
          <div className="px-5 py-4">
            {/* Super Admin */}
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Crown size={18} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">
                  {superAdmin.name || "You"}
                  <span className="text-gray-400 font-normal ml-1">(You)</span>
                </p>
                <p className="text-xs text-gray-500">Super Admin • All branches</p>
              </div>
              <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                Owner
              </span>
            </div>

            {/* Other Users */}
            {users.length > 0 ? (
              <div className="divide-y divide-gray-100 mt-3">
                {users.map((user) => {
                  const branch = branches.find(
                    (b) => b.temp_id === user.branch_temp_id
                  );
                  const RoleIcon = user.role === "branch_admin" ? Shield : User;

                  return (
                    <div
                      key={user.temp_id}
                      className="flex items-center gap-3 py-3"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          user.role === "branch_admin"
                            ? "bg-purple-100"
                            : "bg-gray-100"
                        }`}
                      >
                        <RoleIcon
                          size={18}
                          className={
                            user.role === "branch_admin"
                              ? "text-purple-600"
                              : "text-gray-500"
                          }
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {user.full_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.role === "branch_admin" ? "Branch Admin" : "Staff"} •{" "}
                          {branch?.branch_name || "Unknown branch"}
                        </p>
                      </div>
                      <div className="text-right text-xs text-gray-400">
                        <p>{user.phone_number}</p>
                        <p>@{user.username}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 text-center text-gray-500 text-sm">
                No additional users added. You can add them later from settings.
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Error Message */}
      {submitError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-800">Setup Failed</p>
              <p className="text-sm text-red-600 mt-1">{submitError}</p>
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => setSubmitError(null)}
                  className="text-sm font-medium text-red-700 hover:text-red-800"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleStartOver}
                  className="flex items-center gap-1 text-sm font-medium text-red-700 hover:text-red-800"
                >
                  <RefreshCw size={14} />
                  Start Over
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-200">
        <button
          onClick={handleBack}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <ChevronLeft size={18} />
          Back
        </button>

        <button
          onClick={handleSubmit}
          disabled={!allChecksPassed || isSubmitting}
          className={`
            flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-lg
            transition-all duration-200 w-full sm:w-auto justify-center
            ${
              allChecksPassed && !isSubmitting
                ? "bg-[#000060] text-white hover:bg-[#000080] shadow-lg shadow-[#000060]/25"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              Complete Setup
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>

      {/* Help Text */}
      <p className="text-center text-xs text-gray-400 mt-4">
        By completing setup, your branches and users will be created.
        <br />
        You can modify these settings later from the dashboard.
      </p>
    </div>
  );
};

export default SetupReviewPage;