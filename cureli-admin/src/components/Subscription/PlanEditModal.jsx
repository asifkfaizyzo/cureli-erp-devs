//Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\cureli-admin\src\components\Subscription\PlanEditModal.jsx
import { X, CreditCard, DollarSign, Clock, FileText, List, MousePointerClick } from "lucide-react";
import { useEffect, useState } from "react";

export default function PlanEditModal({ isOpen, onClose, plan, onSave }) {
  const [values, setValues] = useState(null);

  useEffect(() => {
    if (plan) {
      setValues({
        ...plan,
        duration: plan.duration || "/month",
        buttonText: plan.buttonText || "Get Plan",
        features: plan.features || [],
      });
    }
  }, [plan]);

  if (!isOpen || !values) return null;

  const updateField = (field, newValue) => {
    setValues((prev) => ({ ...prev, [field]: newValue }));
  };

  const handleSave = () => {
    onSave(values);
  };

  return (
    <div 
      className="fixed inset-0 bg-/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white p-8 w-[420px] rounded-2xl shadow-2xl relative overflow-hidden animate-[fadeIn_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Header Bar */}
        <div className="absolute top-0 left-0 "></div>

        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute right-5 top-5 p-1.5 rounded-full bg-gray-100 hover:bg-[#05015A] hover:text-white transition-all duration-300 group"
        >
          <X size={18} className="transition-transform duration-300 group-hover:rotate-90" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#05015A]">Edit Plan</h2>
          <p className="text-sm text-gray-500 mt-1">Modify your subscription plan details</p>
        </div>

        {/* Plan Name & Price Row */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
              <CreditCard size={14} />
              Plan Name
            </label>
            <input
              value={values.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full border-2 border-gray-200 p-2.5 rounded-lg text-sm
                focus:border-[#05015A] focus:ring-2 focus:ring-[#05015A]/20 
                transition-all duration-300 outline-none
                hover:border-[#05015A]/50"
              placeholder="Enter plan name"
            />
          </div>

          {/* Price */}
          <div>
            <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
              <DollarSign size={14} />
              Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05015A] font-medium">₹</span>
              <input
                value={values.price}
                onChange={(e) => updateField("price", e.target.value)}
                className="w-full border-2 border-gray-200 p-2.5 pl-8 rounded-lg text-sm
                  focus:border-[#05015A] focus:ring-2 focus:ring-[#05015A]/20 
                  transition-all duration-300 outline-none
                  hover:border-[#05015A]/50"
                placeholder="Amount"
              />
            </div>
          </div>

        </div>

        {/* Duration */}
        <div className="mb-4">
          <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
            <Clock size={14} />
            Duration Text
          </label>
          <input
            value={values.duration}
            onChange={(e) => updateField("duration", e.target.value)}
            className="w-full border-2 border-gray-200 p-2.5 rounded-lg text-sm
              focus:border-[#05015A] focus:ring-2 focus:ring-[#05015A]/20 
              transition-all duration-300 outline-none
              hover:border-[#05015A]/50"
            placeholder="e.g., /month, /year"
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
            <FileText size={14} />
            Description
          </label>
          <textarea
            value={values.description}
            onChange={(e) => updateField("description", e.target.value)}
            className="w-full border-2 border-gray-200 p-2.5 rounded-lg text-sm resize-none
              focus:border-[#05015A] focus:ring-2 focus:ring-[#05015A]/20 
              transition-all duration-300 outline-none
              hover:border-[#05015A]/50"
            rows={3}
            placeholder="Describe plan benefits..."
          />
        </div>

        {/* Features */}
        <div className="mb-4">
          <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
            <List size={14} />
            Features
            <span className="text-gray-400 font-normal">(one per line)</span>
          </label>
          <textarea
            value={values.features.join("\n")}
            onChange={(e) => updateField("features", e.target.value.split("\n"))}
            className="w-full border-2 border-gray-200 p-2.5 rounded-lg text-sm resize-none
              focus:border-[#05015A] focus:ring-2 focus:ring-[#05015A]/20 
              transition-all duration-300 outline-none
              hover:border-[#05015A]/50"
            rows={4}
            placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
          />
        </div>

        {/* Button Text */}
        <div className="mb-6">
          <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
            <MousePointerClick size={14} />
            Button Text
          </label>
          <input
            value={values.buttonText}
            onChange={(e) => updateField("buttonText", e.target.value)}
            className="w-full border-2 border-gray-200 p-2.5 rounded-lg text-sm
              focus:border-[#05015A] focus:ring-2 focus:ring-[#05015A]/20 
              transition-all duration-300 outline-none
              hover:border-[#05015A]/50"
            placeholder="e.g., Get Started, Subscribe"
          />
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium 
              border-2 border-gray-200 text-gray-600
              hover:border-[#05015A] hover:text-[#05015A]
              transition-all duration-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-[#05015A] text-white py-2.5 rounded-lg font-medium
              hover:bg-[#0a0280] hover:shadow-lg hover:shadow-[#05015A]/30
              active:scale-[0.98]
              transition-all duration-300"
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}