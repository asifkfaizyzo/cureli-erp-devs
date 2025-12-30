// frontend/src/pages/settings/plans/comps/UpgradeConfirmModal.jsx

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  X,
  Check,
  Users,
  Building2,
  Calendar,
  CreditCard,
  Loader2,
  AlertCircle,
  Shield,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { formatPrice, generateFeatures, BILLING } from "../../../../config/planConfig";

/**
 * UpgradeConfirmModal
 * Confirmation modal for upgrading plan (before Razorpay)
 */
const UpgradeConfirmModal = ({
  plan,
  currentPlan,
  onConfirm,
  onClose,
  loading = false,
  error = null,
}) => {
  const [termsAccepted, setTermsAccepted] = useState(false);

  if (!plan) return null;

  const features = generateFeatures(plan);

  // Calculate dates
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

  const handleConfirm = () => {
    if (!termsAccepted || loading) return;
    onConfirm();
  };

  const handleClose = () => {
    if (loading) return;
    setTermsAccepted(false);
    onClose();
  };

  // Calculate what's changing
  const changes = [];
  if (currentPlan) {
    if (plan.max_users !== currentPlan.max_users) {
      const currentDisplay = currentPlan.max_users === -1 ? "Unlimited" : currentPlan.max_users;
      const newDisplay = plan.max_users === -1 ? "Unlimited" : plan.max_users;
      changes.push({ label: "User Limit", from: currentDisplay, to: newDisplay });
    }
    if (plan.max_branches !== currentPlan.max_branches) {
      const currentDisplay = currentPlan.max_branches === -1 ? "Unlimited" : currentPlan.max_branches;
      const newDisplay = plan.max_branches === -1 ? "Unlimited" : plan.max_branches;
      changes.push({ label: "Branch Limit", from: currentDisplay, to: newDisplay });
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden animate-[fadeIn_0.2s_ease-out] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Accent */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />

        {/* Close Button */}
        <button
          className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-all z-10 disabled:opacity-50"
          onClick={handleClose}
          disabled={loading}
        >
          <X size={16} />
        </button>

        <div className="p-5">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp size={28} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Upgrade to {plan.name}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Unlock more features and higher limits
            </p>
          </div>

          {/* What's Changing */}
          {changes.length > 0 && (
            <div className="bg-emerald-50 rounded-xl p-4 mb-4 border border-emerald-100">
              <h3 className="text-sm font-semibold text-emerald-800 mb-2">What's changing:</h3>
              <div className="space-y-2">
                {changes.map((change, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{change.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">{change.from}</span>
                      <ArrowRight size={14} className="text-emerald-500" />
                      <span className="font-semibold text-emerald-700">{change.to}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plan Summary */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600">Plan</span>
              <span className="font-semibold text-gray-900">{plan.name}</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600">Billing</span>
              <span className="text-gray-900">Annual (1 year)</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600">Valid Until</span>
              <span className="text-gray-900">{formatDate(endDate)}</span>
            </div>
            <div className="border-t border-gray-200 my-3" />
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">Total</span>
              <span className="text-2xl font-bold text-emerald-600">
                {formatPrice(plan.price)}
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Terms */}
          <div className="mb-4">
            <label className="flex items-start gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                disabled={loading}
                className="mt-0.5 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-600">
                I agree to the{" "}
                <Link to="/terms" target="_blank" className="text-[#000060] font-medium hover:underline">
                  Terms of Service
                </Link>{" "}
                and understand this will create a new 1-year subscription
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg font-semibold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!termsAccepted || loading}
              className="flex-[2] py-2.5 rounded-lg font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Shield size={16} />
                  Pay {formatPrice(plan.price)} Securely
                </>
              )}
            </button>
          </div>

          {/* Security Note */}
          <div className="mt-3 flex items-center justify-center gap-1.5 text-gray-400 text-xs">
            <Shield size={12} />
            <span>Secured by Razorpay • 256-bit SSL encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeConfirmModal;