// frontend/src/pages/settings/plans/comps/FinalConfirmationModal.jsx

import { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  AlertTriangle,
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  Users,
  Building2,
  Calendar,
  TrendingDown,
  Shield,
  XCircle,
  Lock,
  RefreshCw,
} from "lucide-react";
import { formatPrice } from "../../../../config/planConfig";

/**
 * FinalConfirmationModal
 * Step C: Final acknowledgement before executing downgrade
 */
const FinalConfirmationModal = ({
  currentPlan,
  targetPlan,
  complianceData,
  hasImpact,
  onConfirm,
  onBack,
  onClose,
  loading = false,
  error = null,
}) => {
  const [acknowledgements, setAcknowledgements] = useState({
    disabledUsers: false,
    deactivatedBranches: false,
    noAutoRestore: false,
    finalConfirm: false,
  });

  const { usersToDisable = [], branchesToDeactivate = [] } = complianceData;

  // Determine which acknowledgements are required
  const requiredAcks = [];
  
  if (usersToDisable.length > 0) {
    requiredAcks.push("disabledUsers");
  }
  if (branchesToDeactivate.length > 0) {
    requiredAcks.push("deactivatedBranches");
  }
  if (hasImpact) {
    requiredAcks.push("noAutoRestore");
  }
  requiredAcks.push("finalConfirm");

  const allAcknowledged = requiredAcks.every((key) => acknowledgements[key]);

  const handleAckChange = (key) => {
    setAcknowledgements((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConfirm = () => {
    if (!allAcknowledged || loading) return;
    onConfirm();
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  // Calculate new subscription dates
  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);

  const formatDate = (date) => {
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Accent */}
        <div className="h-1.5 bg-gradient-to-r from-red-500 to-orange-500" />

        {/* Close Button */}
        <button
          className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-all z-10 disabled:opacity-50"
          onClick={handleClose}
          disabled={loading}
        >
          <X size={16} />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-5">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Confirm Downgrade
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              This action takes effect immediately
            </p>
          </div>

          {/* Summary Card */}
          <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Summary of Changes
            </h3>

            {/* Plan Change */}
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">Plan</span>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">{currentPlan?.name}</span>
                <TrendingDown size={14} className="text-orange-500" />
                <span className="font-semibold text-orange-600">{targetPlan.name}</span>
              </div>
            </div>

            {/* Price Change */}
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">Price</span>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">{formatPrice(currentPlan?.price || 0)}</span>
                <TrendingDown size={14} className="text-emerald-500" />
                <span className="font-semibold text-emerald-600">{formatPrice(targetPlan.price)}</span>
              </div>
            </div>

            {/* New Subscription Period */}
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">New Period</span>
              <span className="text-sm font-medium text-gray-900">
                {formatDate(startDate)} - {formatDate(endDate)}
              </span>
            </div>

            {/* Users to Disable */}
            {usersToDisable.length > 0 && (
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-red-500" />
                  <span className="text-sm text-gray-600">Users to Disable</span>
                </div>
                <span className="text-sm font-semibold text-red-600">
                  {usersToDisable.length}
                </span>
              </div>
            )}

            {/* Branches to Deactivate */}
            {branchesToDeactivate.length > 0 && (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-red-500" />
                  <span className="text-sm text-gray-600">Branches to Deactivate</span>
                </div>
                <span className="text-sm font-semibold text-red-600">
                  {branchesToDeactivate.length}
                </span>
              </div>
            )}
          </div>

          {/* Acknowledgement Checkboxes */}
          <div className="space-y-3 mb-5">
            {usersToDisable.length > 0 && (
              <AcknowledgementCheckbox
                checked={acknowledgements.disabledUsers}
                onChange={() => handleAckChange("disabledUsers")}
                disabled={loading}
                icon={XCircle}
                iconColor="text-red-500"
                title="Disabled users cannot log in"
                description={`${usersToDisable.length} user${usersToDisable.length > 1 ? "s" : ""} will immediately lose access to the system`}
              />
            )}

            {branchesToDeactivate.length > 0 && (
              <AcknowledgementCheckbox
                checked={acknowledgements.deactivatedBranches}
                onChange={() => handleAckChange("deactivatedBranches")}
                disabled={loading}
                icon={Lock}
                iconColor="text-orange-500"
                title="Deactivated branches become read-only"
                description={`${branchesToDeactivate.length} branch${branchesToDeactivate.length > 1 ? "es" : ""} will be accessible in read-only mode only`}
              />
            )}

            {hasImpact && (
              <AcknowledgementCheckbox
                checked={acknowledgements.noAutoRestore}
                onChange={() => handleAckChange("noAutoRestore")}
                disabled={loading}
                icon={RefreshCw}
                iconColor="text-blue-500"
                title="No automatic restoration"
                description="Re-upgrading later will NOT automatically re-enable disabled users or branches"
              />
            )}

            <AcknowledgementCheckbox
              checked={acknowledgements.finalConfirm}
              onChange={() => handleAckChange("finalConfirm")}
              disabled={loading}
              icon={Shield}
              iconColor="text-gray-500"
              title="I confirm this downgrade"
              description="I understand all implications and wish to proceed with the plan change"
              highlight
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onBack}
              disabled={loading}
              className="flex items-center justify-center gap-2 flex-1 py-2.5 rounded-lg font-semibold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={!allAcknowledged || loading}
              className="flex-[2] py-2.5 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Confirm Downgrade
                </>
              )}
            </button>
          </div>

          {/* Final Warning */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800 text-center">
              ⚠️ This action is immediate and cannot be undone automatically.
              Contact support if you need assistance after downgrading.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * AcknowledgementCheckbox Component
 */
const AcknowledgementCheckbox = ({
  checked,
  onChange,
  disabled,
  icon: Icon,
  iconColor,
  title,
  description,
  highlight = false,
}) => {
  return (
    <label
      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
        highlight
          ? checked
            ? "bg-red-50 border-2 border-red-300"
            : "bg-gray-50 border-2 border-gray-200 hover:border-red-300"
          : checked
            ? "bg-gray-100 border border-gray-300"
            : "bg-gray-50 border border-gray-200 hover:border-gray-300"
      } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={`mt-0.5 w-4 h-4 border-gray-300 rounded focus:ring-2 ${
          highlight
            ? "text-red-600 focus:ring-red-500"
            : "text-gray-600 focus:ring-gray-500"
        }`}
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Icon size={14} className={iconColor} />
          <span className={`text-sm font-medium ${highlight ? "text-red-900" : "text-gray-900"}`}>
            {title}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </label>
  );
};

export default FinalConfirmationModal;