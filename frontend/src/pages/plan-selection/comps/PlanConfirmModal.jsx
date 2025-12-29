//Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\frontend\src\components\plans\PlanConfirmModal.jsx
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
} from "lucide-react";
import {
  BILLING,
  formatPrice,
  generateFeatures,
  getCardTheme,
} from "../../../config/planConfig";

export default function PlanConfirmModal({
  isOpen,
  onClose,
  plan,
  onConfirm,
  loading = false,
  error = null,
}) {
  const [termsAccepted, setTermsAccepted] = useState(false);

  if (!isOpen || !plan) return null;

  const isFree = plan.price === 0;
  const theme = getCardTheme(plan);
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

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl relative overflow-hidden animate-[fadeIn_0.2s_ease-out] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Accent */}
        <div
          className={`h-1.5 ${
            isFree
              ? "bg-emerald-500"
              : plan.is_highlighted
              ? "bg-violet-500"
              : "bg-[#000060]"
          }`}
        />

        {/* Close Button */}
        <button
          className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-300 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleClose}
          disabled={loading}
        >
          <X size={16} />
        </button>

        <div className="p-5">
          {/* Header - More Compact */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              {plan.is_highlighted && (
                <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-semibold rounded-full flex items-center gap-1">
                  <Sparkles size={10} />
                  POPULAR
                </span>
              )}
              {isFree && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded-full">
                  FREE
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-[#000060]">
              Confirm Your Plan
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">
              Review the details before {isFree ? "activating" : "purchasing"}
            </p>
          </div>

          {/* Main Content - Horizontal Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* LEFT COLUMN - Plan Details */}
            <div className="space-y-3">
              {/* Plan Name & Price Card */}
              <div
                className={`rounded-xl p-4 border-2 ${
                  isFree
                    ? "bg-emerald-50 border-emerald-200"
                    : plan.is_highlighted
                    ? "bg-violet-50 border-violet-200"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <h3 className="text-base font-bold text-gray-800 mb-0.5">
                  {plan.name}
                </h3>
                <p className="text-gray-600 text-xs mb-2">
                  {plan.description || "Perfect for your business needs"}
                </p>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-2xl font-bold ${
                      isFree ? "text-emerald-600" : "text-[#000060]"
                    }`}
                  >
                    {formatPrice(plan.price)}
                  </span>
                  {!isFree && (
                    <span className="text-gray-500 text-sm">{BILLING.displayText}</span>
                  )}
                </div>
              </div>

              {/* Plan Limits */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="p-1 bg-blue-100 rounded-md">
                      <Users size={12} className="text-blue-600" />
                    </div>
                    <span className="text-[10px] text-gray-500">Users Limit</span>
                  </div>
                  <p className="font-bold text-gray-800 text-sm">
                    {plan.max_users === -1 ? "Unlimited" : plan.max_users}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="p-1 bg-purple-100 rounded-md">
                      <Building2 size={12} className="text-purple-600" />
                    </div>
                    <span className="text-[10px] text-gray-500">Branches Limit</span>
                  </div>
                  <p className="font-bold text-gray-800 text-sm">
                    {plan.max_branches === -1 ? "Unlimited" : plan.max_branches}
                  </p>
                </div>
              </div>

              {/* Subscription Period - Compact */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <Calendar size={12} className="text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">
                    Subscription Period
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400">Start</p>
                    <p className="font-semibold text-gray-800">
                      {formatDate(startDate)}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-gray-300" />
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400">End</p>
                    <p className="font-semibold text-gray-800">
                      {formatDate(endDate)}
                    </p>
                  </div>
                  <div className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded-full">
                    1 Year
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Features & Payment */}
            <div className="space-y-3">
              {/* Features - Compact */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  What's included:
                </p>
                <ul className="space-y-1.5">
                  {features.slice(0, 5).map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="text-emerald-500 flex-shrink-0">
                        <Check size={12} />
                      </span>
                      <span className="text-gray-600 text-xs">{feature}</span>
                    </li>
                  ))}
                  {features.length > 5 && (
                    <li className="text-xs text-gray-400 pl-5">
                      +{features.length - 5} more features
                    </li>
                  )}
                </ul>
              </div>

              {/* Billing Summary (for paid plans) */}
              {!isFree && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CreditCard size={12} className="text-blue-600" />
                    <span className="text-xs font-medium text-blue-800">
                      Billing Summary
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{plan.name} Plan</span>
                      <span className="text-gray-800">
                        {formatPrice(plan.price)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Billing Cycle</span>
                      <span className="text-gray-800">Annual</span>
                    </div>
                    <div className="border-t border-blue-200 my-1.5" />
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800 text-sm">
                        Total Due Today
                      </span>
                      <span className="font-bold text-lg text-[#000060]">
                        {formatPrice(plan.price)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Free Plan Info */}
              {isFree && (
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Check size={12} className="text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-800">
                      No Payment Required
                    </span>
                  </div>
                  <p className="text-emerald-700 text-xs">
                    This plan is completely free. You can upgrade anytime.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle
                size={14}
                className="text-red-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-red-700 text-xs">{error}</p>
            </div>
          )}

          {/* Bottom Section - Terms & Actions */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            {/* Terms & Conditions */}
            <div className="mb-3">
              <label className="flex items-start gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  disabled={loading}
                  className="mt-0.5 w-3.5 h-3.5 text-[#000060] border-gray-300 rounded focus:ring-[#000060] disabled:opacity-50"
                />
                <span className="text-xs text-gray-600 group-hover:text-gray-800">
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    target="_blank"
                    className="text-[#000060] font-medium hover:underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    target="_blank"
                    className="text-[#000060] font-medium hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg text-xs font-semibold border-2 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!termsAccepted || loading}
                className={`flex-[2] py-2.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 ${
                  isFree
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-[#000060] hover:bg-[#000080]"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Processing...
                  </>
                ) : isFree ? (
                  <>
                    <Check size={14} />
                    Activate Free Plan
                  </>
                ) : (
                  <>
                    <Shield size={14} />
                    Pay {formatPrice(plan.price)} Securely
                  </>
                )}
              </button>
            </div>

            {/* Security Note */}
            {!isFree && (
              <div className="mt-3 flex items-center justify-center gap-1.5 text-gray-400 text-[10px]">
                <Shield size={12} />
                <span>Secured by Razorpay • 256-bit SSL encryption</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}