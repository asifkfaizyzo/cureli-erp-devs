import { 
  X, 
  CreditCard, 
  DollarSign, 
  FileText, 
  Users, 
  Building2,
  Sparkles,
  Info,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { BILLING } from "../../../config/modules/subscriptionConfig";

const initialFormState = {
  name: "",
  description: "",
  price: "",
  usersLimit: "",
  branchesLimit: "",
  isHighlighted: false,
};

export default function CreatePlanModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  existingNames = [],
  loading = false 
}) {
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Plan name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Plan name must be at least 3 characters";
    } else if (existingNames.some(n => n.toLowerCase() === formData.name.toLowerCase().trim())) {
      newErrors.name = "A plan with this name already exists";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (formData.price === "" || isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      newErrors.price = "Valid price is required (0 for free)";
    }

    if (!formData.usersLimit || isNaN(Number(formData.usersLimit)) || Number(formData.usersLimit) < 1) {
      newErrors.usersLimit = "At least 1 user required";
    }

    if (!formData.branchesLimit || isNaN(Number(formData.branchesLimit)) || Number(formData.branchesLimit) < 1) {
      newErrors.branchesLimit = "At least 1 branch required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate() || loading) return;

    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: Number(formData.price),
      usersLimit: Number(formData.usersLimit),
      branchesLimit: Number(formData.branchesLimit),
      isHighlighted: formData.isHighlighted,
    });
  };

  const handleClose = () => {
    if (loading) return;
    setFormData(initialFormState);
    setErrors({});
    onClose();
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
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Accent */}
        <div className="h-1.5 bg-gradient-to-r from-[#05015A] to-violet-600" />

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
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#05015A]">Create New Plan</h2>
            <p className="text-sm text-gray-500 mt-1">
              New plans are created as <span className="font-medium text-amber-600">DRAFT</span> and can be edited before activation
            </p>
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg mb-6 text-xs">
            <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-blue-700">
              Draft plans can be edited freely. Once activated, plans become immutable and cannot be modified.
            </p>
          </div>

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
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g., Premium Plan"
                  disabled={loading}
                  className={`
                    w-full border-2 rounded-lg p-2.5 text-sm
                    focus:ring-2 focus:ring-[#05015A]/20 outline-none
                    transition-all duration-300
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    ${errors.name 
                      ? "border-red-300 focus:border-red-500" 
                      : "border-gray-200 focus:border-[#05015A] hover:border-[#05015A]/50"
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
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Describe plan features and ideal customers..."
                  rows={4}
                  disabled={loading}
                  className={`
                    w-full border-2 rounded-lg p-2.5 text-sm resize-none
                    focus:ring-2 focus:ring-[#05015A]/20 outline-none
                    transition-all duration-300
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    ${errors.description 
                      ? "border-red-300 focus:border-red-500" 
                      : "border-gray-200 focus:border-[#05015A] hover:border-[#05015A]/50"
                    }
                  `}
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">{errors.description}</p>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Price */}
              <div>
                <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
                  <DollarSign size={14} />
                  Price (per year in Rupees)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05015A] font-medium">
                    {BILLING.currency}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.price}
                    onChange={(e) => handleChange("price", e.target.value)}
                    placeholder="0 for free plan"
                    disabled={loading}
                    className={`
                      w-full border-2 rounded-lg p-2.5 pl-8 text-sm
                      focus:ring-2 focus:ring-[#05015A]/20 outline-none
                      transition-all duration-300
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      ${errors.price 
                        ? "border-red-300 focus:border-red-500" 
                        : "border-gray-200 focus:border-[#05015A] hover:border-[#05015A]/50"
                      }
                    `}
                  />
                </div>
                {errors.price && (
                  <p className="text-red-500 text-xs mt-1">{errors.price}</p>
                )}
              </div>

              {/* Users & Branches - Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
                    <Users size={14} />
                    Users Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usersLimit}
                    onChange={(e) => handleChange("usersLimit", e.target.value)}
                    placeholder="e.g., 10"
                    disabled={loading}
                    className={`
                      w-full border-2 rounded-lg p-2.5 text-sm
                      focus:ring-2 focus:ring-[#05015A]/20 outline-none
                      transition-all duration-300
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      ${errors.usersLimit 
                        ? "border-red-300 focus:border-red-500" 
                        : "border-gray-200 focus:border-[#05015A] hover:border-[#05015A]/50"
                      }
                    `}
                  />
                  {errors.usersLimit && (
                    <p className="text-red-500 text-xs mt-1">{errors.usersLimit}</p>
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
                    value={formData.branchesLimit}
                    onChange={(e) => handleChange("branchesLimit", e.target.value)}
                    placeholder="e.g., 3"
                    disabled={loading}
                    className={`
                      w-full border-2 rounded-lg p-2.5 text-sm
                      focus:ring-2 focus:ring-[#05015A]/20 outline-none
                      transition-all duration-300
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      ${errors.branchesLimit 
                        ? "border-red-300 focus:border-red-500" 
                        : "border-gray-200 focus:border-[#05015A] hover:border-[#05015A]/50"
                      }
                    `}
                  />
                  {errors.branchesLimit && (
                    <p className="text-red-500 text-xs mt-1">{errors.branchesLimit}</p>
                  )}
                </div>
              </div>

              {/* Highlight Toggle */}
              <div 
                className="
                  flex items-center justify-between p-3 rounded-lg 
                  bg-violet-50 border border-violet-100
                "
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-violet-600" />
                  <div>
                    <p className="text-sm font-medium text-violet-900">Featured Plan</p>
                    <p className="text-xs text-violet-600">Highlight this plan for visibility</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isHighlighted}
                    onChange={(e) => handleChange("isHighlighted", e.target.checked)}
                    disabled={loading}
                    className="sr-only peer"
                  />
                  <div 
                    className="
                      w-10 h-5 bg-gray-200 rounded-full peer 
                      peer-checked:bg-violet-600 
                      peer-focus:ring-2 peer-focus:ring-violet-300
                      peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
                      after:content-[''] after:absolute after:top-0.5 after:left-0.5
                      after:bg-white after:rounded-full after:h-4 after:w-4
                      after:transition-all peer-checked:after:translate-x-5
                      transition-all
                    "
                  />
                </label>
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
              Cancel
            </button>
            <button
              onClick={handleSubmit}
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
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Create Draft
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}