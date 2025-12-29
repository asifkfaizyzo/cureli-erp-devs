// src/pages/settings/components/SubscriptionCard.jsx

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  Calendar,
  GitBranch,
  Users,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

/**
 * SubscriptionCard
 * Displays subscription and plan information
 */
const SubscriptionCard = ({ subscription }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
            <CheckCircle size={12} />
            Active
          </span>
        );
      case "trial":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
            <Clock size={12} />
            Trial
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
            <AlertTriangle size={12} />
            Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
            {status || "Unknown"}
          </span>
        );
    }
  };

  const getUsagePercentage = (used, limit) => {
    if (!limit) return 0;
    return Math.min(100, (used / limit) * 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  // No subscription
  if (!subscription) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <CreditCard size={20} className="text-[#000060]" />
            <h2 className="text-lg font-semibold text-gray-900">Subscription & Plan</h2>
          </div>
        </div>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Subscription</h3>
          <p className="text-gray-500 mb-4">Choose a plan to unlock all features</p>
          <button
            onClick={() => navigate("/settings/upgrade")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#000060] text-white rounded-lg hover:bg-[#000080] transition-colors"
          >
            View Plans
            <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>
    );
  }

  const branchPercentage = getUsagePercentage(subscription.branches_used, subscription.branch_limit);
  const userPercentage = getUsagePercentage(subscription.users_used, subscription.user_limit);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard size={20} className="text-[#000060]" />
          <h2 className="text-lg font-semibold text-gray-900">Subscription & Plan</h2>
        </div>
        <button
          onClick={() => navigate("/settings/upgrade")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#000060] hover:bg-[#000060]/10 rounded-lg transition-colors"
        >
          Upgrade Plan
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Plan Info Row */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm text-gray-500 mb-1">Current Plan</p>
            <p className="text-xl font-bold text-[#000060]">{subscription.plan_name}</p>
          </div>
          <div>
            {getStatusBadge(subscription.status)}
          </div>
        </div>

        {/* Dates Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Calendar size={14} />
              Billing Cycle
            </div>
            <p className="font-medium text-gray-900 capitalize">{subscription.billing_cycle}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Calendar size={14} />
              Valid Until
            </div>
            <p className="font-medium text-gray-900">{formatDate(subscription.end_date)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Clock size={14} />
              Days Remaining
            </div>
            <p className="font-medium text-gray-900">{subscription.days_remaining} days</p>
          </div>
        </div>

        {/* Usage Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Usage</h3>

          {/* Branches Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <GitBranch size={14} />
                Branches
              </div>
              <span className="text-sm font-medium text-gray-900">
                {subscription.branches_used} of {subscription.branch_limit}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getUsageColor(branchPercentage)}`}
                style={{ width: `${branchPercentage}%` }}
              />
            </div>
          </div>

          {/* Users Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users size={14} />
                Users
              </div>
              <span className="text-sm font-medium text-gray-900">
                {subscription.users_used} of {subscription.user_limit}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getUsageColor(userPercentage)}`}
                style={{ width: `${userPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SubscriptionCard;