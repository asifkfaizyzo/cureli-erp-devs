// cadmin/src/pages/MasterMedicines/comps/CreateMedicineModal.jsx

import { useState, useEffect } from "react";
import {
  X,
  Plus,
  Loader2,
  Pill,
  Building2,
  Package,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const CreateMedicineModal = ({ isOpen, item, onClose, onConfirm }) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "DRUG",
    composition: "",
    manufacturer: "",
    marketer: "",
    packSize: "",
    prescriptionRequired: false,
    hsn_code: "",
    schedule: "",
    category: "",
    subCategory: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});

  // Reset form when modal opens with item data
  useEffect(() => {
    if (isOpen && item) {
      setFormData({
        name: item.sampleNames?.[0] || item.normalizedName || "",
        type: item.type || "DRUG",
        composition: "",
        manufacturer: "",
        marketer: "",
        packSize: "",
        prescriptionRequired: item.type === "DRUG",
        hsn_code: "",
        schedule: "",
        category: "",
        subCategory: "",
      });
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
    }
  }, [isOpen, item]);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  // Validation
  const validateField = (field, value) => {
    switch (field) {
      case "name":
        if (!value.trim()) return "Name is required";
        if (value.length < 3) return "Name must be at least 3 characters";
        if (value.length > 200) return "Name must be less than 200 characters";
        break;
      case "manufacturer":
        if (!value.trim()) return "Manufacturer is required";
        break;
      default:
        return "";
    }
    return "";
  };

  const validate = () => {
    const newErrors = {};
    const requiredFields = ["name", "manufacturer"];

    requiredFields.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, formData[field]);
    setErrors({ ...errors, [field]: error });
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors({ ...errors, [field]: error });
    }
  };

  const handleSubmit = async () => {
    // Mark all fields as touched
    setTouched({
      name: true,
      manufacturer: true,
    });

    if (!validate()) return;

    setIsSubmitting(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    onConfirm(formData);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden 
                   animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Plus size={20} className="text-white" />
              <div>
                <h2 className="text-white text-lg font-semibold">Create New Master Medicine</h2>
                <p className="text-white/70 text-sm">
                  Add a new medicine to the global catalog
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Source Info */}
        <div className="px-6 py-3 bg-green-50 border-b border-green-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm text-green-600 font-medium">Creating from:</span>
            <span className="px-3 py-1 bg-white rounded-lg text-sm font-semibold text-gray-800 shadow-sm">
              "{item.normalizedName}"
            </span>
            <span className="text-xs text-green-500">
              ({item.occurrenceCount} occurrences from {item.shopCount} shops)
            </span>
          </div>
          {item.sampleNames && item.sampleNames.length > 1 && (
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="text-xs text-green-600">Variations:</span>
              {item.sampleNames.slice(0, 5).map((name, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-white text-xs text-gray-600 rounded">
                  {name}
                </span>
              ))}
              {item.sampleNames.length > 5 && (
                <span className="text-xs text-green-500">+{item.sampleNames.length - 5} more</span>
              )}
            </div>
          )}
        </div>

        {/* Form */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Basic Info Section */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Pill size={16} />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medicine Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    onBlur={() => handleBlur("name")}
                    placeholder="Enter medicine name"
                    className={`w-full h-10 px-3 border rounded-lg text-sm
                              focus:ring-2 focus:ring-green-500/20 focus:border-green-500
                              ${errors.name && touched.name ? "border-red-300 bg-red-50" : "border-gray-300"}`}
                  />
                  {errors.name && touched.name && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleChange("type", e.target.value)}
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white
                              focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  >
                    <option value="DRUG">Drug (Rx)</option>
                    <option value="OTC">OTC (Over-the-Counter)</option>
                  </select>
                </div>

                {/* Prescription Required */}
                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.prescriptionRequired}
                      onChange={(e) => handleChange("prescriptionRequired", e.target.checked)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Prescription Required</span>
                  </label>
                </div>

                {/* Composition */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Composition
                  </label>
                  <input
                    type="text"
                    value={formData.composition}
                    onChange={(e) => handleChange("composition", e.target.value)}
                    placeholder="e.g., Paracetamol (500mg)"
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm
                              focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Manufacturer Section */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Building2 size={16} />
                Manufacturer / Marketer
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Manufacturer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manufacturer <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => handleChange("manufacturer", e.target.value)}
                    onBlur={() => handleBlur("manufacturer")}
                    placeholder="e.g., Cipla Ltd"
                    className={`w-full h-10 px-3 border rounded-lg text-sm
                              focus:ring-2 focus:ring-green-500/20 focus:border-green-500
                              ${errors.manufacturer && touched.manufacturer ? "border-red-300 bg-red-50" : "border-gray-300"}`}
                  />
                  {errors.manufacturer && touched.manufacturer && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.manufacturer}
                    </p>
                  )}
                </div>

                {/* Marketer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marketer
                  </label>
                  <input
                    type="text"
                    value={formData.marketer}
                    onChange={(e) => handleChange("marketer", e.target.value)}
                    placeholder="e.g., Cipla Ltd (leave empty if same)"
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm
                              focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Pack Info Section */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Package size={16} />
                Pack Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pack Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pack Size
                  </label>
                  <input
                    type="text"
                    value={formData.packSize}
                    onChange={(e) => handleChange("packSize", e.target.value)}
                    placeholder="e.g., 10 tablets in 1 strip"
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm
                              focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>

                {/* HSN Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HSN Code
                  </label>
                  <input
                    type="text"
                    value={formData.hsn_code}
                    onChange={(e) => handleChange("hsn_code", e.target.value)}
                    placeholder="e.g., 30049099"
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm
                              focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Classification Section */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <FileText size={16} />
                Classification (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Schedule */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule
                  </label>
                  <select
                    value={formData.schedule}
                    onChange={(e) => handleChange("schedule", e.target.value)}
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white
                              focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  >
                    <option value="">None</option>
                    <option value="H">Schedule H</option>
                    <option value="H1">Schedule H1</option>
                    <option value="X">Schedule X</option>
                    <option value="G">Schedule G</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    placeholder="e.g., Analgesics"
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm
                              focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>

                {/* Sub-Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sub-Category
                  </label>
                  <input
                    type="text"
                    value={formData.subCategory}
                    onChange={(e) => handleChange("subCategory", e.target.value)}
                    placeholder="e.g., Antipyretics"
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm
                              focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Fields marked with <span className="text-red-500">*</span> are required
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium
                           flex items-center gap-2 hover:bg-green-700 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Create Medicine
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateMedicineModal;