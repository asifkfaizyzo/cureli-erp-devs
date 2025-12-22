// src/pages/setup/SetupBranchesPage.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Plus,
  Trash2,
  MapPin,
  Phone,
  ChevronRight,
  AlertCircle,
  Check,
  Loader2,
  Info,
  Edit2,
  X,
} from "lucide-react";

import { useSetupStore } from "../../store/useSetupStore";

/**
 * SetupBranchesPage
 * Step 1: Create branches
 */

const SetupBranchesPage = () => {
  const navigate = useNavigate();

  // Store - get everything we need
  const branches = useSetupStore((state) => state.branches);
  const planLimits = useSetupStore((state) => state.planLimits);
  const isInitialized = useSetupStore((state) => state.isInitialized);
  const addBranch = useSetupStore((state) => state.addBranch);
  const updateBranch = useSetupStore((state) => state.updateBranch);
  const removeBranch = useSetupStore((state) => state.removeBranch);
  const setCurrentStep = useSetupStore((state) => state.setCurrentStep);
  const canAddBranchFn = useSetupStore((state) => state.canAddBranch);

  // Local state
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    branch_name: "",
    address_line_1: "",
    city: "",
    state: "",
    pincode: "",
    contact_number: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs
  const formRef = useRef(null);
  const nameInputRef = useRef(null);

  // Computed values
  const maxBranches = planLimits.max_branches;
  const canAddMore = canAddBranchFn();
  const canContinue = branches.length >= 1;

  // Debug logging
  useEffect(() => {
    console.log("🏢 SetupBranchesPage mounted:", {
      isInitialized,
      planLimits,
      branchCount: branches.length,
      maxBranches,
      canAddMore,
    });
  }, [isInitialized, planLimits, branches.length]);

  // Set current step on mount
  useEffect(() => {
    setCurrentStep(1);
  }, [setCurrentStep]);

  // Focus name input when form opens
  useEffect(() => {
    if (showForm && nameInputRef.current) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [showForm]);

  // ============================================
  // FORM HANDLERS
  // ============================================

  const resetForm = () => {
    setFormData({
      branch_name: "",
      address_line_1: "",
      city: "",
      state: "",
      pincode: "",
      contact_number: "",
    });
    setErrors({});
    setEditingBranch(null);
  };

  const openAddForm = () => {
    if (!canAddMore) {
      console.warn("Cannot add more branches - limit reached");
      return;
    }
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (branch) => {
    setFormData({
      branch_name: branch.branch_name,
      address_line_1: branch.address_line_1 || "",
      city: branch.city || "",
      state: branch.state || "",
      pincode: branch.pincode || "",
      contact_number: branch.contact_number || "",
    });
    setEditingBranch(branch);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.branch_name.trim()) {
      newErrors.branch_name = "Branch name is required";
    } else if (formData.branch_name.trim().length < 2) {
      newErrors.branch_name = "Branch name must be at least 2 characters";
    }

    // Check for duplicate name
    const isDuplicate = branches.some(
      (b) =>
        b.branch_name.toLowerCase() === formData.branch_name.trim().toLowerCase() &&
        b.temp_id !== editingBranch?.temp_id
    );
    if (isDuplicate) {
      newErrors.branch_name = "A branch with this name already exists";
    }

    // Pincode validation
    if (formData.pincode && !/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Pincode must be exactly 6 digits";
    }

    // Phone validation
    if (formData.contact_number && !/^[0-9]{10}$/.test(formData.contact_number.replace(/\D/g, ""))) {
      newErrors.contact_number = "Please enter a valid 10-digit phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      if (editingBranch) {
        updateBranch(editingBranch.temp_id, {
          branch_name: formData.branch_name.trim(),
          address_line_1: formData.address_line_1.trim() || "",
          city: formData.city.trim() || "",
          state: formData.state.trim() || "",
          pincode: formData.pincode || "",
          contact_number: formData.contact_number.replace(/\D/g, "") || "",
        });
        setIsSubmitting(false);
        closeForm();
      } else {
        const result = addBranch({
          branch_name: formData.branch_name.trim(),
          address_line_1: formData.address_line_1.trim() || "",
          city: formData.city.trim() || "",
          state: formData.state.trim() || "",
          pincode: formData.pincode || "",
          contact_number: formData.contact_number.replace(/\D/g, "") || "",
        });

        console.log("📝 Add branch result:", result);

        if (!result.success) {
          setErrors({ submit: result.error });
          setIsSubmitting(false);
          return;
        }

        setIsSubmitting(false);
        closeForm();
      }
    }, 300);
  };

  const handleDelete = (branch) => {
    if (window.confirm(`Are you sure you want to remove "${branch.branch_name}"?`)) {
      removeBranch(branch.temp_id);
    }
  };

  const handleContinue = () => {
    if (!canContinue) return;
    navigate("/setup/users");
  };

  const formatAddress = (branch) => {
    const parts = [
      branch.address_line_1,
      branch.city,
      branch.state,
      branch.pincode,
    ].filter(Boolean);
    return parts.join(", ");
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="w-full max-w-3xl mx-auto py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#000060] mb-2">
          Create Your Branches
        </h1>
        <p className="text-gray-600">
          Set up at least one branch to continue. Each branch represents a physical location of your pharmacy.
        </p>
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6"
      >
        <div className="flex gap-3">
          <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Only branch name is required</p>
            <p className="text-blue-600">
              You can add address and contact details now or update them later. 
              Your plan allows up to {maxBranches === -1 ? "unlimited" : maxBranches} branch{maxBranches !== 1 ? "es" : ""}.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Branch List */}
      <div className="space-y-3 mb-6">
        <AnimatePresence mode="popLayout">
          {branches.map((branch, index) => (
            <motion.div
              key={branch.temp_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.2 }}
              layout
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-[#000060]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 size={24} className="text-[#000060]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {branch.branch_name}
                      </h3>
                      {index === 0 && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                          Primary
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      {formatAddress(branch) && (
                        <div className="flex items-center gap-1">
                          <MapPin size={12} />
                          <span className="truncate max-w-[250px]">
                            {formatAddress(branch)}
                          </span>
                        </div>
                      )}
                      {branch.contact_number && (
                        <div className="flex items-center gap-1">
                          <Phone size={12} />
                          <span>{branch.contact_number}</span>
                        </div>
                      )}
                    </div>

                    {!formatAddress(branch) && !branch.contact_number && (
                      <p className="text-xs text-gray-400 italic">
                        No address or contact added
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEditForm(branch)}
                    className="p-2 text-gray-400 hover:text-[#000060] hover:bg-[#000060]/5 rounded-lg transition-colors"
                    title="Edit branch"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(branch)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove branch"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {branches.length === 0 && !showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 size={32} className="text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-700 mb-1">No branches yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Create your first branch to get started
            </p>
            <button
              onClick={openAddForm}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#000060] text-white rounded-lg text-sm font-medium hover:bg-[#000080] transition-colors"
            >
              <Plus size={16} />
              Add Your First Branch
            </button>
          </motion.div>
        )}

        {/* Add Branch Button */}
        {branches.length > 0 && canAddMore && !showForm && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={openAddForm}
            className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#000060] hover:text-[#000060] hover:bg-[#000060]/5 transition-all group"
          >
            <Plus size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium">Add Another Branch</span>
          </motion.button>
        )}

        {/* Limit Reached Message */}
        {!canAddMore && branches.length > 0 && !showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm"
          >
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>
              Branch limit reached ({maxBranches} branch{maxBranches !== 1 ? "es" : ""}). 
              <a href="/pricing" className="underline font-medium ml-1 hover:text-amber-800">
                Upgrade your plan
              </a> to add more.
            </span>
          </motion.div>
        )}
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            ref={formRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">
                  {editingBranch ? "Edit Branch" : "Add New Branch"}
                </h3>
                <button
                  onClick={closeForm}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Branch Name (Required) */}
                <div>
                  <label className="block text-xs font-bold text-[#000060] mb-1">
                    Branch Name *
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={formData.branch_name}
                    onChange={(e) => handleChange("branch_name", e.target.value)}
                    placeholder="e.g., Main Branch, Downtown Store"
                    className={`
                      w-full px-3 py-2.5 bg-white border rounded-lg transition-all duration-200
                      focus:outline-none focus:ring-2
                      ${
                        errors.branch_name
                          ? "border-red-500 focus:ring-red-500/20"
                          : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                      }
                    `}
                  />
                  {errors.branch_name && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.branch_name}
                    </p>
                  )}
                </div>

                {/* Optional Fields Section */}
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-3">
                    Optional details (can be added later)
                  </p>

                  {/* Address Line 1 */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={formData.address_line_1}
                      onChange={(e) => handleChange("address_line_1", e.target.value)}
                      placeholder="e.g., 123 Main Street"
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-[#000060] focus:ring-[#000060]/20"
                    />
                  </div>

                  {/* City, State, Pincode Row */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleChange("city", e.target.value)}
                        placeholder="City"
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-[#000060] focus:ring-[#000060]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => handleChange("state", e.target.value)}
                        placeholder="State"
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-[#000060] focus:ring-[#000060]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Pincode
                      </label>
                      <input
                        type="text"
                        value={formData.pincode}
                        onChange={(e) => handleChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="123456"
                        maxLength={6}
                        className={`
                          w-full px-3 py-2.5 bg-white border rounded-lg transition-all duration-200
                          focus:outline-none focus:ring-2
                          ${
                            errors.pincode
                              ? "border-red-500 focus:ring-red-500/20"
                              : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                          }
                        `}
                      />
                      {errors.pincode && (
                        <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>
                      )}
                    </div>
                  </div>

                  {/* Contact Number */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      value={formData.contact_number}
                      onChange={(e) => handleChange("contact_number", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="e.g., 9876543210"
                      maxLength={10}
                      className={`
                        w-full px-3 py-2.5 bg-white border rounded-lg transition-all duration-200
                        focus:outline-none focus:ring-2
                        ${
                          errors.contact_number
                            ? "border-red-500 focus:ring-red-500/20"
                            : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                        }
                      `}
                    />
                    {errors.contact_number && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.contact_number}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Error */}
                {errors.submit && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm flex items-center gap-2">
                      <AlertCircle size={16} />
                      {errors.submit}
                    </p>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-5 py-2 bg-[#000060] text-white font-medium rounded-lg hover:bg-[#000080] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        {editingBranch ? "Update Branch" : "Add Branch"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Continue Button */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          {branches.length === 0 ? (
            <span className="text-amber-600 flex items-center gap-1">
              <AlertCircle size={14} />
              Add at least one branch to continue
            </span>
          ) : (
            <span className="text-emerald-600 flex items-center gap-1">
              <Check size={14} />
              {branches.length} of {maxBranches === -1 ? "∞" : maxBranches} branch{branches.length !== 1 ? "es" : ""} created
            </span>
          )}
        </p>

        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200
            ${
              canContinue
                ? "bg-[#000060] text-white hover:bg-[#000080] shadow-lg shadow-[#000060]/25"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          Continue
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default SetupBranchesPage;