// frontend/src/pages/plans/comps/PlanConfirmModal.jsx

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
  Gift,
  Clock,
  Tag,
} from "lucide-react";
import {
  BILLING,
  formatPrice,
  generateFeatures,
  getCardTheme,
  calculateDisplayDates,
  formatDate,
  calculateDiscountPercent,
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

  // Determine if plan is effectively free
  const isEffectivelyFree = plan.price === 0 || plan.is_promo_active;
  const hasPromoWithPrice = plan.is_promo_active && plan.price > 0;

  // Get theme and features
  const theme = getCardTheme(plan);
  const features = generateFeatures(plan);

  // Calculate dates
  const dates = calculateDisplayDates(plan);

  // Calculate discount if applicable
  const discountPercent = calculateDiscountPercent(
    plan.compare_at_price,
    plan.price,
  );

  const handleConfirm = () => {
    if (!termsAccepted || loading) return;
    onConfirm();
  };

  const handleClose = () => {
    if (loading) return;
    setTermsAccepted(false);
    onClose();
  };

  // Get header accent color based on theme
  const getHeaderAccent = () => {
    if (plan.is_featured) return "bg-violet-500";
    if (plan.price === 0) return "bg-emerald-500";
    return "bg-[#000060]";
  };

  // Get card background based on theme
  const getCardBg = () => {
    if (plan.is_featured) return "bg-violet-50 border-violet-200";
    if (plan.price === 0 && !plan.is_promo_active)
      return "bg-emerald-50 border-emerald-200";
    return "bg-blue-50 border-blue-200";
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
        <div className={`h-1.5 ${getHeaderAccent()}`} />

        {/* Close Button */}
        <button
          className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-300 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleClose}
          disabled={loading}
        >
          <X size={16} />
        </button>

        <div className="p-5">
          {/* Header */}
          <div className="text-center mb-4">
            
            <h2 className="text-xl font-bold text-[#000060]">
              Confirm Your Plan
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">
              Review the details before{" "}
              {isEffectivelyFree ? "activating" : "purchasing"}
            </p>
          </div>

          {/* Main Content - Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* LEFT COLUMN - Plan Details */}
            <div className="space-y-3">
              {/* Plan Name & Price Card */}
              <div className={`rounded-xl p-4 border-2 ${getCardBg()}`}>
                {/* Title + Badges Row */}
                <div className="flex items-center flex-wrap gap-2 mb-0.5">
                  <h3 className="text-base font-bold text-gray-800">
                    {plan.name}
                  </h3>

                  {/* Badges */}
                  {plan.is_featured && (
                    <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-semibold rounded-full flex items-center gap-1">
                      <Sparkles size={10} />
                      POPULAR
                    </span>
                  )}
                  {plan.is_promo_active && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded-full flex items-center gap-1">
                      <Clock size={10} />
                      PROMO ACTIVE
                    </span>
                  )}
                  {plan.price === 0 && !plan.is_promo_active && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded-full">
                      FREE
                    </span>
                  )}
                  {discountPercent && !plan.is_promo_active && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-semibold rounded-full flex items-center gap-1">
                      <Tag size={10} />
                      {discountPercent}% OFF
                    </span>
                  )}
                  {plan.bonus_months > 0 && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded-full flex items-center gap-1">
                      <Gift size={10} />+{plan.bonus_months} MONTHS
                    </span>
                  )}
                </div>

                <p className="text-gray-600 text-xs mb-2">
                  {plan.description || "Perfect for your business needs"}
                </p>

                {/* Price Display */}
                <div className="flex flex-col">
                  {/* Strike-through price (non-promo discount) */}
                  {plan.compare_at_price &&
                    plan.compare_at_price > plan.price &&
                    !isEffectivelyFree && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 line-through">
                          {formatPrice(plan.compare_at_price)}
                        </span>
                        <span className="text-xs font-medium text-green-600">
                          Save {formatPrice(plan.compare_at_price - plan.price)}
                        </span>
                      </div>
                    )}

                  {/* Main price */}
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-2xl font-bold ${
                        isEffectivelyFree
                          ? "text-emerald-600"
                          : "text-[#000060]"
                      }`}
                    >
                      {isEffectivelyFree ? "FREE" : formatPrice(plan.price)}
                    </span>
                    {!isEffectivelyFree && (
                      <span className="text-gray-500 text-sm">
                        {BILLING.displayText}
                      </span>
                    )}
                  </div>

                  {/* Promo context with bold price */}
                  {hasPromoWithPrice && (
                    <p className="text-xs text-gray-500 mt-1">
                      Then{" "}
                      <span className="font-bold text-gray-700">
                        {formatPrice(plan.price)}
                      </span>
                      /year after {formatDate(new Date(plan.promo_free_until))}
                    </p>
                  )}
                </div>
              </div>

              

              {/* Subscription Period */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <Calendar size={12} className="text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">
                    Subscription Period
                  </span>
                </div>

                {/* Timeline */}
                <div className="flex items-center justify-between text-xs mb-3">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400">Start</p>
                    <p className="font-semibold text-gray-800">
                      {formatDate(dates.startDate)}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-gray-300" />
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400">Valid Until</p>
                    <p className="font-semibold text-gray-800">
                      {formatDate(dates.endDate)}
                    </p>
                  </div>
                </div>

                {/* Duration Breakdown */}
                <div className="border-t border-gray-200 pt-2 space-y-1">
                  {/* Promo Period */}
                  {dates.isPromoActive && dates.promoEndDate && (
                    <div className="flex justify-between text-[10px]">
                      <span className="text-blue-600 font-medium flex items-center gap-1">
                        <Clock size={10} />
                        Free Promo Access
                      </span>
                      <span className="text-blue-600 font-medium">
                        Until {formatDate(dates.promoEndDate)}
                      </span>
                    </div>
                  )}

                  {/* Base Plan */}
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>Base Plan Duration</span>
                    <span>{dates.billingCycleMonths} Months</span>
                  </div>

                  {/* Bonus Months */}
                  {dates.bonusMonths > 0 && (
                    <div className="flex justify-between text-[10px]">
                      <span className="text-amber-600 font-medium flex items-center gap-1">
                        <Gift size={10} />
                        Bonus Months
                      </span>
                      <span className="text-amber-600 font-medium">
                        +{dates.bonusMonths} Months Free
                      </span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex justify-between text-xs font-semibold text-gray-800 pt-1 border-t border-dashed border-gray-200">
                    <span>Total Access</span>
                    <span>{dates.totalMonths} Months</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Features & Payment */}
            <div className="space-y-3">
              {/* Features */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  What's included:
                </p>
                <ul className="space-y-1.5">
                  {features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span
                        className={`flex-shrink-0 ${
                          feature.highlight
                            ? "text-amber-500"
                            : "text-emerald-500"
                        }`}
                      >
                        {feature.highlight ? (
                          <Gift size={12} />
                        ) : (
                          <Check size={12} />
                        )}
                      </span>
                      <span
                        className={`text-xs ${
                          feature.highlight
                            ? "text-gray-800 font-medium"
                            : "text-gray-600"
                        }`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Billing Summary (for paid plans) */}
              {!isEffectivelyFree && (
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

                    {/* Discount line */}
                    {plan.compare_at_price &&
                      plan.compare_at_price > plan.price && (
                        <div className="flex justify-between items-center text-green-600">
                          <span>Discount ({discountPercent}%)</span>
                          <span>
                            -{formatPrice(plan.compare_at_price - plan.price)}
                          </span>
                        </div>
                      )}

                    {/* Bonus months info */}
                    {plan.bonus_months > 0 && (
                      <div className="flex justify-between items-center text-amber-600">
                        <span>Bonus: +{plan.bonus_months} months</span>
                        <span>FREE</span>
                      </div>
                    )}

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

              {/* Free Plan / Promo Info */}
              {isEffectivelyFree && (
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Check size={12} className="text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-800">
                      No Payment Required
                    </span>
                  </div>
                  <p className="text-emerald-700 text-xs">
                    {hasPromoWithPrice
                      ? `This plan is free during the promo period. You'll be reminded before ${formatDate(new Date(plan.promo_free_until))} to renew.`
                      : "This plan is completely free. You can upgrade anytime."}
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
                  isEffectivelyFree
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-[#000060] hover:bg-[#000080]"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Processing...
                  </>
                ) : isEffectivelyFree ? (
                  <>
                    <Check size={14} />
                    Activate {hasPromoWithPrice ? "Promo" : "Free"} Plan
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
            {!isEffectivelyFree && (
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
