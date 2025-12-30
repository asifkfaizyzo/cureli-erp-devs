// frontend/src/pages/settings/plans/comps/DowngradeWarningModal.jsx

import { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  AlertTriangle,
  TrendingDown,
  Users,
  Building2,
  ArrowRight,
  ArrowDown,
  Shield,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";
import { formatPrice, formatLimit } from "../../../../config/planConfig";

/**
 * DowngradeWarningModal
 * Step A: Initial warning before downgrade
 * Shows what will change and requires consent
 */
const DowngradeWarningModal = ({
  currentPlan,
  targetPlan,
  analysis,
  onAccept,
  onClose,
}) => {
  const [consents, setConsents] = useState({
    understand: false,
    backup: false,
  });

  const allConsented = consents.understand && consents.backup;

  const handleConsentChange = (key) => {
    setConsents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAccept = () => {
    if (!allConsented) return;
    onAccept();
  };

  // Calculate changes
  const changes = [];
  
  if (currentPlan.max_users !== targetPlan.max_users) {
    const currentDisplay = currentPlan.max_users === -1 ? "Unlimited" : currentPlan.max_users;
    const targetDisplay = targetPlan.max_users === -1 ? "Unlimited" : targetPlan.max_users;
    changes.push({
      type: "users",
      label: "User Limit",
      icon: Users,
      from: currentDisplay,
      to: targetDisplay,
      isDecrease: (targetPlan.max_users !== -1) && 
        (currentPlan.max_users === -1 || targetPlan.max_users < currentPlan.max_users),
    });
  }
  
  if (currentPlan.max_branches !== targetPlan.max_branches) {
    const currentDisplay = currentPlan.max_branches === -1 ? "Unlimited" : currentPlan.max_branches;
    const targetDisplay = targetPlan.max_branches === -1 ? "Unlimited" : targetPlan.max_branches;
    changes.push({
      type: "branches",
      label: "Branch Limit",
      icon: Building2,
      from: currentDisplay,
      to: targetDisplay,
      isDecrease: (targetPlan.max_branches !== -1) && 
        (currentPlan.max_branches === -1 || targetPlan.max_branches < currentPlan.max_branches),
    });
  }

  if (currentPlan.price !== targetPlan.price) {
    changes.push({
      type: "price",
      label: "Annual Price",
      from: formatPrice(currentPlan.price),
      to: formatPrice(targetPlan.price),
      isDecrease: targetPlan.price < currentPlan.price,
    });
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Accent */}
        <div className="h-1.5 bg-gradient-to-r from-orange-500 to-red-500" />

        {/* Close Button */}
        <button
          className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-all z-10"
          onClick={onClose}
        >
          <X size={16} />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Downgrade to {targetPlan.name}?
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              Please review the following changes carefully before proceeding
            </p>
          </div>

          {/* Plan Comparison */}
          <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center flex-1">
                <p className="text-xs text-gray-500 mb-1">Current Plan</p>
                <p className="font-semibold text-gray-900">{currentPlan.name}</p>
                <p className="text-sm text-gray-600">{formatPrice(currentPlan.price)}/year</p>
              </div>
              <div className="px-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <ArrowRight size={20} className="text-orange-600" />
                </div>
              </div>
              <div className="text-center flex-1">
                <p className="text-xs text-gray-500 mb-1">New Plan</p>
                <p className="font-semibold text-orange-600">{targetPlan.name}</p>
                <p className="text-sm text-gray-600">{formatPrice(targetPlan.price)}/year</p>
              </div>
            </div>

            {/* Changes List */}
            <div className="border-t border-gray-200 pt-4 space-y-3">
              {changes.map((change, idx) => {
                const Icon = change.icon;
                return (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {Icon && <Icon size={16} className="text-gray-500" />}
                      <span className="text-sm text-gray-600">{change.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{change.from}</span>
                      <ArrowDown size={14} className={change.isDecrease ? "text-orange-500" : "text-emerald-500"} />
                      <span className={`text-sm font-medium ${change.isDecrease ? "text-orange-600" : "text-emerald-600"}`}>
                        {change.to}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Impact Warning */}
          {analysis.hasImpact ? (
            <div className="bg-red-50 rounded-xl p-4 mb-5 border border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800 mb-1">Action Required</h4>
                  <p className="text-sm text-red-700 mb-2">
                    Your current usage exceeds the new plan limits. You will need to:
                  </p>
                  <ul className="text-sm text-red-700 space-y-1">
                    {analysis.excessUsers > 0 && (
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        Disable <strong>{analysis.excessUsers}</strong> user{analysis.excessUsers > 1 ? "s" : ""}
                      </li>
                    )}
                    {analysis.excessBranches > 0 && (
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        Deactivate <strong>{analysis.excessBranches}</strong> branch{analysis.excessBranches > 1 ? "es" : ""}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 rounded-xl p-4 mb-5 border border-blue-200">
              <div className="flex items-start gap-3">
                <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-800 mb-1">No Immediate Action Required</h4>
                  <p className="text-sm text-blue-700">
                    Your current usage fits within the new plan limits. However, you will lose 
                    access to higher limits and some features.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning Points */}
          <div className="bg-amber-50 rounded-xl p-4 mb-5 border border-amber-200">
            <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
              <AlertTriangle size={16} />
              Important Information
            </h4>
            <ul className="space-y-2 text-sm text-amber-800">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0" />
                <span>The downgrade takes effect <strong>immediately</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0" />
                <span>A new 1-year subscription will start from today</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0" />
                <span>Disabled users will <strong>not</strong> be able to log in</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0" />
                <span>Deactivated branches become <strong>read-only</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0" />
                <span>No data will be deleted, but access will be restricted</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0" />
                <span>Re-upgrading later will <strong>not</strong> auto-enable disabled users/branches</span>
              </li>
            </ul>
          </div>

          {/* Consent Checkboxes */}
          <div className="space-y-3 mb-6">
            <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all">
              <input
                type="checkbox"
                checked={consents.understand}
                onChange={() => handleConsentChange("understand")}
                className="mt-0.5 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  I understand the downgrade implications
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  I acknowledge that limits will decrease and access may be restricted
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all">
              <input
                type="checkbox"
                checked={consents.backup}
                onChange={() => handleConsentChange("backup")}
                className="mt-0.5 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  I have backed up important data
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  I recommend exporting any critical data before proceeding
                </p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg font-semibold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleAccept}
              disabled={!allConsented}
              className="flex-[2] py-2.5 rounded-lg font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <TrendingDown size={16} />
              {analysis.hasImpact ? "Continue to Selection" : "Continue"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DowngradeWarningModal;