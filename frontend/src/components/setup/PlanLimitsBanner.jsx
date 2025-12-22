// src/components/setup/PlanLimitsBanner.jsx
import { motion } from "framer-motion";
import { Building2, Users, Crown, AlertCircle } from "lucide-react";
import { useSetupStore } from "../../store/useSetupStore";

/**
 * PlanLimitsBanner
 * Displays current plan info and usage vs limits
 * Always visible during setup to help users understand their limits
 */

const PlanLimitsBanner = () => {
  const { planLimits, branches, users, superAdmin } = useSetupStore();

  const branchesUsed = branches.length;
  const usersUsed = users.length; // SA not counted
  
  const maxBranches = planLimits.max_branches;
  const maxUsers = planLimits.max_users;
  
  // Check if limits are reached
  const branchLimitReached = maxBranches !== -1 && branchesUsed >= maxBranches;
  const userLimitReached = maxUsers !== -1 && usersUsed >= maxUsers;

  // Format limit display
  const formatLimit = (used, max) => {
    if (max === -1) return `${used} / Unlimited`;
    return `${used} / ${max}`;
  };

  // Calculate percentage for progress bars
  const getPercentage = (used, max) => {
    if (max === -1) return Math.min(used * 10, 100); // Cap at 100 for unlimited
    return Math.min((used / max) * 100, 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl"
    >
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Plan Name */}
          <div className="flex items-center gap-3 sm:border-r sm:border-gray-200 sm:pr-6">
            <div className="w-10 h-10 bg-[#000060]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Crown size={20} className="text-[#000060]" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Current Plan</p>
              <p className="font-semibold text-[#000060]">
                {planLimits.plan_name || "Loading..."}
              </p>
            </div>
          </div>

          {/* Branches Usage */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-gray-500" />
                <span className="text-xs font-medium text-gray-600">Branches</span>
              </div>
              <span
                className={`text-xs font-semibold ${
                  branchLimitReached ? "text-amber-600" : "text-gray-700"
                }`}
              >
                {formatLimit(branchesUsed, maxBranches)}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${getPercentage(branchesUsed, maxBranches)}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  branchLimitReached
                    ? "bg-amber-500"
                    : "bg-gradient-to-r from-[#000060] to-[#0000a0]"
                }`}
              />
            </div>
            {branchLimitReached && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] text-amber-600 mt-1 flex items-center gap-1"
              >
                <AlertCircle size={10} />
                Branch limit reached
              </motion.p>
            )}
          </div>

          {/* Users Usage */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-gray-500" />
                <span className="text-xs font-medium text-gray-600">
                  Users
                  <span className="text-gray-400 ml-1">(excl. you)</span>
                </span>
              </div>
              <span
                className={`text-xs font-semibold ${
                  userLimitReached ? "text-amber-600" : "text-gray-700"
                }`}
              >
                {formatLimit(usersUsed, maxUsers)}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${getPercentage(usersUsed, maxUsers)}%` }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                className={`h-full rounded-full ${
                  userLimitReached
                    ? "bg-amber-500"
                    : "bg-gradient-to-r from-emerald-500 to-emerald-600"
                }`}
              />
            </div>
            {userLimitReached && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] text-amber-600 mt-1 flex items-center gap-1"
              >
                <AlertCircle size={10} />
                User limit reached
              </motion.p>
            )}
          </div>

          {/* Super Admin Info */}
          <div className="hidden lg:flex items-center gap-2 sm:border-l sm:border-gray-200 sm:pl-6">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-700 font-semibold text-sm">
                {superAdmin.name?.charAt(0)?.toUpperCase() || "S"}
              </span>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                Super Admin
              </p>
              <p className="text-xs font-medium text-gray-700 truncate max-w-[100px]">
                {superAdmin.name || "You"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PlanLimitsBanner;