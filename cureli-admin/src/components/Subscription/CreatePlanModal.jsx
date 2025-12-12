//Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\cureli-admin\src\components\Subscription\CreatePlanModal.jsx
import { X, CreditCard, Clock, DollarSign, FileText, Users, Building2 } from "lucide-react";
import { useState } from "react";

export default function CreatePlanModal({ isOpen, onClose, onSubmit }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    planName: "",
    duration: "",
    price: "",
    detail: "",
    users: "",
    branches: "",
  });

  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white p-8 rounded-2xl w-[420px] shadow-2xl relative overflow-hidden animate-[fadeIn_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Header Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5"></div>

        {/* Close Button */}
        <button 
          className="absolute top-5 right-5 p-1.5 rounded-full bg-gray-100 hover:bg-[#05015A] hover:text-white transition-all duration-300 group"
          onClick={onClose}
        >
          <X size={18} className="transition-transform duration-300 group-hover:rotate-90" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#05015A]">Create a Plan</h2>
          <p className="text-sm text-gray-500 mt-1">Configure your subscription plan details</p>
        </div>

        {/* DROPDOWNS */}
        <div className="grid grid-cols-2 gap-4 mb-5">

          {/* Choose Plan */}
          <div className="relative">
            <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
              <CreditCard size={14} />
              Plan Type
            </label>
            <select
              className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm bg-white 
                focus:border-[#05015A] focus:ring-2 focus:ring-[#05015A]/20 
                transition-all duration-300 outline-none cursor-pointer
                hover:border-[#05015A]/50"
              value={formData.planName}
              onChange={(e) => handleChange("planName", e.target.value)}
            >
              <option value="">Select Plan</option>
              <option value="Basic Plan">Basic Plan</option>
              <option value="Standard Plan">Standard Plan</option>
              <option value="Premium Plan">Premium Plan</option>
            </select>
          </div>

          {/* Duration */}
          <div className="relative">
            <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
              <Clock size={14} />
              Duration
            </label>
            <select
              className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm bg-white 
                focus:border-[#05015A] focus:ring-2 focus:ring-[#05015A]/20 
                transition-all duration-300 outline-none cursor-pointer
                hover:border-[#05015A]/50"
              value={formData.duration}
              onChange={(e) => handleChange("duration", e.target.value)}
            >
              <option value="">Select Duration</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>

        </div>

        {/* PRICE */}
        <div className="mb-4">
          <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
            <DollarSign size={14} />
            Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05015A] font-medium">₹</span>
            <input
              className="w-full p-2.5 pl-8 border-2 border-gray-200 rounded-lg text-sm
                focus:border-[#05015A] focus:ring-2 focus:ring-[#05015A]/20 
                transition-all duration-300 outline-none
                hover:border-[#05015A]/50"
              placeholder="Enter amount"
              value={formData.price}
              onChange={(e) => handleChange("price", e.target.value)}
              onFocus={() => setFocusedField("price")}
              onBlur={() => setFocusedField(null)}
            />
          </div>
        </div>

        {/* DETAIL */}
        <div className="mb-4">
          <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
            <FileText size={14} />
            Plan Details
          </label>
          <textarea
            className="w-full p-2.5 border-2 border-gray-200 rounded-lg text-sm resize-none
              focus:border-[#05015A] focus:ring-2 focus:ring-[#05015A]/20 
              transition-all duration-300 outline-none
              hover:border-[#05015A]/50"
            placeholder="Describe plan features and benefits..."
            rows={3}
            value={formData.detail}
            onChange={(e) => handleChange("detail", e.target.value)}
          />
        </div>

        {/* USERS & BRANCHES */}
        <div className="grid grid-cols-2 gap-4 mb-6">

          {/* Users */}
          <div>
            <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
              <Users size={14} />
              Users
            </label>
            <input
              className="w-full p-2.5 border-2 border-gray-200 rounded-lg text-sm
                focus:border-[#05015A] focus:ring-2 focus:ring-[#05015A]/20 
                transition-all duration-300 outline-none
                hover:border-[#05015A]/50"
              placeholder="No. of users"
              value={formData.users}
              onChange={(e) => handleChange("users", e.target.value)}
            />
          </div>

          {/* Branches */}
          <div>
            <label className="text-xs font-medium text-[#05015A] mb-1.5 flex items-center gap-1.5">
              <Building2 size={14} />
              Branches
            </label>
            <input
              className="w-full p-2.5 border-2 border-gray-200 rounded-lg text-sm
                focus:border-[#05015A] focus:ring-2 focus:ring-[#05015A]/20 
                transition-all duration-300 outline-none
                hover:border-[#05015A]/50"
              placeholder="No. of branches"
              value={formData.branches}
              onChange={(e) => handleChange("branches", e.target.value)}
            />
          </div>

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
            onClick={handleSubmit}
            className="flex-1 bg-[#05015A] text-white py-2.5 rounded-lg font-medium
              hover:bg-[#0a0280] hover:shadow-lg hover:shadow-[#05015A]/30
              active:scale-[0.98]
              transition-all duration-300"
          >
            Save & Submit
          </button>
        </div>

      </div>
    </div>
  );
}