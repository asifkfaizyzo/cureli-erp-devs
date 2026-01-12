import { 
  X, 
  CreditCard, 
  DollarSign, 
  FileText, 
  Users, 
  Building2,
  Sparkles,
  AlertTriangle,
  Lock,
  Loader2,
  ChevronDown,
  Tag,
  Calendar,
  Gift,
  Percent,
  Info
} from "lucide-react";
import { useState, useEffect } from "react";
import { 
  PLAN_STATUS, 
  STATUS_CONFIG, 
  BILLING,
  isNameAvailable 
} from "../../../config/modules/subscriptionConfig";
import StyledDateFilter from "../../../components/common/StyledDateFilter";

export default function PlanModal({ 
  isOpen, 
  onClose, 
  plan, 
  onSave,
  allPlans = [],
  mode = "view",
  loading = false
}) {
  const [formData, setFormData] = useState(null);
  const [errors, setErrors] = useState({});
  const [promoSectionOpen, setPromoSectionOpen] = useState(false);

  useEffect(() => {
    if (plan) {
      setFormData({ 
        ...plan,
        // Ensure promo fields have default values
        compare_at_price: plan.compare_at_price ?? "",
        bonus_months: plan.bonus_months ?? 0,
        billing_cycle_months: plan.billing_cycle_months ?? 12,
        promo_free_until: plan.promo_free_until 
          ? new Date(plan.promo_free_until).toISOString().split("T")[0] 
          : "",
      });
      
      // Auto-open promo section if any promo values exist
      const hasPromoValues = plan.compare_at_price || plan.bonus_months > 0 || plan.promo_free_until;
      setPromoSectionOpen(hasPromoValues);
    }
  }, [plan]);

  if (!isOpen || !formData) return null;

  const isEditable = mode === "edit" && formData.status === PLAN_STATUS.DRAFT;
  const statusConfig = STATUS_CONFIG[formData.status];

  const handleChange = (field, value) => {
    if (!isEditable) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Plan name is required";
    }

    if (!formData.description?.trim()) {
      newErrors.description = "Description is required";
    }

    if (formData.price === "" || isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      newErrors.price = "Valid price is required";
    }

    // Compare at price validation
    if (formData.compare_at_price !== "" && formData.compare_at_price !== null) {
      const comparePrice = Number(formData.compare_at_price);
      const actualPrice = Number(formData.price);
      
      if (isNaN(comparePrice) || comparePrice <= 0) {
        newErrors.compare_at_price = "Compare price must be a positive number";
      } else if (comparePrice <= actualPrice) {
        newErrors.compare_at_price = "Compare price must be greater than actual price";
      }
    }

    if (!formData.max_users || Number(formData.max_users) < 1) {
      newErrors.max_users = "At least 1 user required";
    }

    if (!formData.max_branches || Number(formData.max_branches) < 1) {
      newErrors.max_branches = "At least 1 branch required";
    }

    // Bonus months validation
    if (formData.bonus_months !== "" && formData.bonus_months !== null) {
      const bonus = Number(formData.bonus_months);
      if (isNaN(bonus) || bonus < 0) {
        newErrors.bonus_months = "Bonus months must be 0 or more";
      } else if (bonus > 12) {
        newErrors.bonus_months = "Bonus months cannot exceed 12";
      }
    }

    // Promo free until validation
    if (formData.promo_free_until) {
      const promoDate = new Date(formData.promo_free_until);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      if (promoDate <= now) {
        newErrors.promo_free_until = "Promo date must be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate() || loading) return;
    
    const saveData = {
      ...formData,
      price: Number(formData.price),
      max_users: Number(formData.max_users),
      max_branches: Number(formData.max_branches),
      billing_cycle_months: Number(formData.billing_cycle_months) || 12,
    };

    // Handle optional promo fields
    if (formData.compare_at_price !== "" && formData.compare_at_price !== null) {
      saveData.compare_at_price = Number(formData.compare_at_price);
    } else {
      saveData.compare_at_price = null;
    }

    if (formData.bonus_months !== "" && formData.bonus_months !== null) {
      saveData.bonus_months = Number(formData.bonus_months);
    } else {
      saveData.bonus_months = 0;
    }

    if (formData.promo_free_until) {
      const promoDate = new Date(formData.promo_free_until);
      promoDate.setHours(23, 59, 59, 999);
      saveData.promo_free_until = promoDate.toISOString();
    } else {
      saveData.promo_free_until = null;
    }

    onSave(saveData);
  };

  const handleClose = () => {
    if (loading) return;
    setFormData(null);
    setErrors({});
    setPromoSectionOpen(false);
    onClose();
  };

  const hasNameConflict = !isNameAvailable(formData.name, allPlans, formData.plan_id);

  // Check if any promo field has a value
  const hasPromoValues = formData.compare_at_price || (formData.bonus_months && formData.bonus_months > 0) || formData.promo_free_until;

  // Format date for display in view mode
  const formatPromoDate = (dateStr) => {
    if (!dateStr) return "Not set";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div 
        className="
          bg-white w-full max-w-4xl rounded-2xl shadow-2xl 
          relative overflow-hidden animate-[fadeIn_0.2s_ease-out]
          max-h-[90vh] overflow-y-auto
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Accent - Color based on status */}
        <div 
          className={`h-1.5 ${
            formData.status === PLAN_STATUS.DRAFT ? "bg-amber-500" :
            formData.status === PLAN_STATUS.ACTIVE ? "bg-emerald-500" :
            formData.status === PLAN_STATUS.DEPRECATED ? "bg-orange-500" :
            "bg-red-500"
          }`} 
        />

        {/* Close Button */}
        <button 
          className="
            absolute top-4 right-4 p-1.5 rounded-full 
            bg-gray-100 hover:bg-[#05015A] hover:text-white 
            transition-all duration-300 group z-10
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          onClick={handleClose}
          disabled={loading}
        >
          <X size={18} className="transition-transform duration-300 group-hover:rotate-90" />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-[#05015A]">
                {isEditable ? "Edit Plan" : "Plan Details"}
              </h2>
              <span 
                className={`
                  px-2 py-0.5 rounded-full text-[10px] font-semibold 
                  border ${statusConfig.badgeColor}
                `}
              >
                {statusConfig.label}
              </span>
              {formData.is_promo_active && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                  Promo Active
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{statusConfig.description}</p>
          </div>

          {/* Warnings */}
          {!isEditable && formData.status !== PLAN_STATUS.DRAFT && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg mb-5 text-xs border border-amber-200">
              <Lock size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-amber-800">
                <strong>This plan is {statusConfig.label.toLowerCase()}</strong> and cannot be edited. 
                Clone this plan to create a new draft with the same settings.
              </p>
            </div>
          )}

          {isEditable && hasNameConflict && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg mb-5 text-xs border border-red-200">
              <AlertTriangle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-800">
                An active plan with this name already exists. Rename before activating.
              </p>
            </div>
          )}

          {/* Form Fields - Horizontal Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Column */}
            <div className="space-y-4">
              {/* Plan Name */}
              <div>
                <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
                  <CreditCard size={14} />
                  Plan Name
                </label>
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                  disabled={!isEditable || loading}
                  className={`
                    w-full border-2 rounded-lg p-2.5 text-sm
                    transition-all duration-300 outline-none
                    ${!isEditable 
                      ? "bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed" 
                      : errors.name 
                        ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200" 
                        : "border-gray-200 focus:border-[#05015A] focus:ring-2 focus:ring-[#05015A]/20"
                    }
                  `}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
                  <FileText size={14} />
                  Description
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  disabled={!isEditable || loading}
                  rows={4}
                  className={`
                    w-full border-2 rounded-lg p-2.5 text-sm resize-none
                    transition-all duration-300 outline-none
                    ${!isEditable 
                      ? "bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed" 
                      : errors.description 
                        ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200" 
                        : "border-gray-200 focus:border-[#05015A] focus:ring-2 focus:ring-[#05015A]/20"
                    }
                  `}
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">{errors.description}</p>
                )}
              </div>

              {/* Subscriber Info (for Active/Deprecated) */}
              {(formData.status === PLAN_STATUS.ACTIVE || formData.status === PLAN_STATUS.DEPRECATED) && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-blue-600" />
                    <p className="text-sm font-medium text-blue-900">
                      {formData.subscriber_count || 0} Active Subscribers
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Price */}
              <div>
                <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
                  <DollarSign size={14} />
                  Price (per year)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05015A] font-medium">
                    {BILLING.currency}
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={formData.price || 0}
                    onChange={(e) => handleChange("price", e.target.value)}
                    disabled={!isEditable || loading}
                    className={`
                      w-full border-2 rounded-lg p-2.5 pl-8 text-sm
                      transition-all duration-300 outline-none
                      ${!isEditable 
                        ? "bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed" 
                        : errors.price 
                          ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200" 
                          : "border-gray-200 focus:border-[#05015A] focus:ring-2 focus:ring-[#05015A]/20"
                      }
                    `}
                  />
                </div>
                {errors.price && (
                  <p className="text-red-500 text-xs mt-1">{errors.price}</p>
                )}
              </div>

              {/* Users & Branches */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
                    <Users size={14} />
                    Users Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_users || ""}
                    onChange={(e) => handleChange("max_users", e.target.value)}
                    disabled={!isEditable || loading}
                    className={`
                      w-full border-2 rounded-lg p-2.5 text-sm
                      transition-all duration-300 outline-none
                      ${!isEditable 
                        ? "bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed" 
                        : errors.max_users 
                          ? "border-red-300 focus:border-red-500" 
                          : "border-gray-200 focus:border-[#05015A]"
                      }
                    `}
                  />
                  {errors.max_users && (
                    <p className="text-red-500 text-xs mt-1">{errors.max_users}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
                    <Building2 size={14} />
                    Branches Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_branches || ""}
                    onChange={(e) => handleChange("max_branches", e.target.value)}
                    disabled={!isEditable || loading}
                    className={`
                      w-full border-2 rounded-lg p-2.5 text-sm
                      transition-all duration-300 outline-none
                      ${!isEditable 
                        ? "bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed" 
                        : errors.max_branches 
                          ? "border-red-300 focus:border-red-500" 
                          : "border-gray-200 focus:border-[#05015A]"
                      }
                    `}
                  />
                  {errors.max_branches && (
                    <p className="text-red-500 text-xs mt-1">{errors.max_branches}</p>
                  )}
                </div>
              </div>

              {/* Featured Toggle */}
              <div 
                className={`
                  flex items-center justify-between p-3 rounded-lg 
                  ${isEditable ? "bg-violet-50 border border-violet-100" : "bg-gray-50 border border-gray-200"}
                `}
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className={isEditable ? "text-violet-600" : "text-gray-400"} />
                  <div>
                    <p className={`text-sm font-medium ${isEditable ? "text-violet-900" : "text-gray-600"}`}>
                      Featured Plan
                    </p>
                    <p className={`text-xs ${isEditable ? "text-violet-600" : "text-gray-500"}`}>
                      {formData.is_featured ? "This plan is featured" : "Not featured"}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured || false}
                    onChange={(e) => handleChange("is_featured", e.target.checked)}
                    disabled={!isEditable || loading}
                    className="sr-only peer"
                  />
                  <div 
                    className={`
                      w-10 h-5 rounded-full 
                      ${!isEditable 
                        ? "bg-gray-200 cursor-not-allowed" 
                        : "bg-gray-200 peer-checked:bg-violet-600"
                      }
                      after:content-[''] after:absolute after:top-0.5 after:left-0.5
                      after:bg-white after:rounded-full after:h-4 after:w-4
                      after:transition-all peer-checked:after:translate-x-5
                      transition-all
                    `}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* PROMOTIONAL OPTIONS ACCORDION */}
          {/* ============================================ */}
          <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden">
            {/* Accordion Header */}
            <button
              type="button"
              onClick={() => setPromoSectionOpen(!promoSectionOpen)}
              className={`
                w-full flex items-center justify-between p-4
                transition-colors duration-200
                ${promoSectionOpen ? "bg-amber-50" : "bg-gray-50 hover:bg-gray-100"}
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`
                  p-2 rounded-lg
                  ${promoSectionOpen ? "bg-amber-100" : "bg-gray-200"}
                `}>
                  <Tag size={18} className={promoSectionOpen ? "text-amber-600" : "text-gray-500"} />
                </div>
                <div className="text-left">
                  <p className={`text-sm font-semibold ${promoSectionOpen ? "text-amber-900" : "text-gray-700"}`}>
                    Promotional Options
                  </p>
                  <p className="text-xs text-gray-500">
                    {isEditable ? "Configure discounts, bonus months, and launch promotions" : "View promotional configuration"}
                  </p>
                </div>
                {hasPromoValues && !promoSectionOpen && (
                  <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    Configured
                  </span>
                )}
              </div>
              <ChevronDown 
                size={20} 
                className={`
                  text-gray-400 transition-transform duration-300
                  ${promoSectionOpen ? "rotate-180" : ""}
                `}
              />
            </button>

            {/* Accordion Content */}
            <div className={`
              overflow-hidden transition-all duration-300 ease-in-out
              ${promoSectionOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}
            `}>
              <div className="p-4 bg-white border-t border-gray-100 space-y-4">
                {/* Promo Info */}
                {isEditable && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-xs">
                    <Info size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-amber-800">
                      These promotional settings help you run marketing campaigns. 
                      All promo fields are optional and can be left empty.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Compare At Price (Strike-through) */}
                  <div>
                    <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
                      <Percent size={14} />
                      Compare-at Price
                    </label>
                    {isEditable ? (
                      <>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                            {BILLING.currency}
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={formData.compare_at_price || ""}
                            onChange={(e) => handleChange("compare_at_price", e.target.value)}
                            placeholder="Original price (shown struck)"
                            disabled={loading}
                            className={`
                              w-full border-2 rounded-lg p-2.5 pl-8 text-sm
                              focus:ring-2 focus:ring-amber-500/20 outline-none
                              transition-all duration-300
                              disabled:bg-gray-100 disabled:cursor-not-allowed
                              ${errors.compare_at_price 
                                ? "border-red-300 focus:border-red-500" 
                                : "border-gray-200 focus:border-amber-500 hover:border-amber-300"
                              }
                            `}
                          />
                        </div>
                        {errors.compare_at_price && (
                          <p className="text-red-500 text-xs mt-1">{errors.compare_at_price}</p>
                        )}
                      </>
                    ) : (
                      <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                        {formData.compare_at_price 
                          ? `${BILLING.currency}${Number(formData.compare_at_price).toLocaleString("en-IN")}`
                          : "Not set"
                        }
                      </div>
                    )}
                  </div>

                  {/* Bonus Months */}
                  <div>
                    <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
                      <Gift size={14} />
                      Bonus Months
                    </label>
                    {isEditable ? (
                      <>
                        <input
                          type="number"
                          min="0"
                          max="12"
                          step="1"
                          value={formData.bonus_months || ""}
                          onChange={(e) => handleChange("bonus_months", e.target.value)}
                          placeholder="e.g., 2 for +2 months free"
                          disabled={loading}
                          className={`
                            w-full border-2 rounded-lg p-2.5 text-sm
                            focus:ring-2 focus:ring-amber-500/20 outline-none
                            transition-all duration-300
                            disabled:bg-gray-100 disabled:cursor-not-allowed
                            ${errors.bonus_months 
                              ? "border-red-300 focus:border-red-500" 
                              : "border-gray-200 focus:border-amber-500 hover:border-amber-300"
                            }
                          `}
                        />
                        {errors.bonus_months && (
                          <p className="text-red-500 text-xs mt-1">{errors.bonus_months}</p>
                        )}
                      </>
                    ) : (
                      <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                        {formData.bonus_months > 0 
                          ? `+${formData.bonus_months} months free`
                          : "Not set"
                        }
                      </div>
                    )}
                  </div>
                </div>

                {/* Promo Free Until Date */}
                <div>
                  <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
                    <Calendar size={14} />
                    Free Until Date
                  </label>
                  {isEditable ? (
                    <>
                      <div className="max-w-xs">
                        <StyledDateFilter
                          date={formData.promo_free_until || ""}
                          setDate={(date) => handleChange("promo_free_until", date)}
                        />
                      </div>
                      {errors.promo_free_until && (
                        <p className="text-red-500 text-xs mt-1">{errors.promo_free_until}</p>
                      )}
                    </>
                  ) : (
                    <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 max-w-xs">
                      {formatPromoDate(formData.promo_free_until)}
                      {formData.is_promo_active && (
                        <span className="ml-2 text-xs text-blue-600 font-medium">(Active)</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Total Duration Display */}
                {(formData.billing_cycle_months || formData.bonus_months > 0) && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-700">
                      <strong>Total Duration:</strong>{" "}
                      {formData.total_duration_months || (formData.billing_cycle_months || 12) + (formData.bonus_months || 0)} months
                      <span className="text-blue-500 ml-1">
                        ({formData.billing_cycle_months || 12} base + {formData.bonus_months || 0} bonus)
                      </span>
                    </p>
                  </div>
                )}

                {/* Preview Section (View Mode) */}
                {!isEditable && hasPromoValues && (
                  <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                    <p className="text-xs font-semibold text-amber-800 mb-2">Display Preview:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.compare_at_price && Number(formData.compare_at_price) > Number(formData.price || 0) && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs border border-amber-200">
                          <span className="line-through text-gray-400">
                            {BILLING.currency}{Number(formData.compare_at_price).toLocaleString("en-IN")}
                          </span>
                          <span className="font-semibold text-green-600">
                            {BILLING.currency}{Number(formData.price || 0).toLocaleString("en-IN")}
                          </span>
                        </span>
                      )}
                      {formData.bonus_months > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                          <Gift size={12} />
                          +{formData.bonus_months} months free
                        </span>
                      )}
                      {formData.is_promo_active && formData.promo_free_until && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          <Calendar size={12} />
                          Free until {formatPromoDate(formData.promo_free_until)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Preview Section (Edit Mode) */}
                {isEditable && hasPromoValues && (
                  <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                    <p className="text-xs font-semibold text-amber-800 mb-2">Preview:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.compare_at_price && Number(formData.compare_at_price) > Number(formData.price || 0) && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs border border-amber-200">
                          <span className="line-through text-gray-400">
                            {BILLING.currency}{Number(formData.compare_at_price).toLocaleString("en-IN")}
                          </span>
                          <span className="font-semibold text-green-600">
                            {BILLING.currency}{Number(formData.price || 0).toLocaleString("en-IN")}
                          </span>
                        </span>
                      )}
                      {formData.bonus_months && Number(formData.bonus_months) > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                          <Gift size={12} />
                          +{formData.bonus_months} months free
                        </span>
                      )}
                      {formData.promo_free_until && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          <Calendar size={12} />
                          Free until {formatPromoDate(formData.promo_free_until)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
            <button
              onClick={handleClose}
              disabled={loading}
              className="
                px-6 py-2.5 rounded-lg text-sm font-medium 
                border-2 border-gray-200 text-gray-600
                hover:border-[#05015A] hover:text-[#05015A]
                transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {isEditable ? "Cancel" : "Close"}
            </button>
            {isEditable && (
              <button
                onClick={handleSave}
                disabled={loading}
                className="
                  bg-[#05015A] text-white px-6 py-2.5 rounded-lg font-medium
                  hover:bg-[#0a0280] hover:shadow-lg hover:shadow-[#05015A]/30
                  active:scale-[0.98]
                  transition-all duration-300
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2
                "
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}