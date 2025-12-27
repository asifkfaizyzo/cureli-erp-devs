// frontend/src/pages/tickets/components/CreateTicketModal.jsx

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Upload, AlertCircle } from "lucide-react";
import { createTicket } from "../../../api/tickets";
import { useAuthStore } from "../../../store/useAuthStore";
import {
  TICKET_CATEGORY_OPTIONS,
  TIME_SLOTS,
  ATTACHMENT_CONFIG,
} from "../../../constant/tickets";

const CreateTicketModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuthStore();

  // Form state
  const [formData, setFormData] = useState({
    contact_number: "",
    category: "",
    subject: "",
    description: "",
    other_category_text: "",
    preferred_slot: "",
  });

  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        contact_number: user?.phone_number || "",
        category: "",
        subject: "",
        description: "",
        other_category_text: "",
        preferred_slot: "",
      });
      setAttachments([]);
      setErrors({});
      setUploadError("");
    }
  }, [isOpen, user]);

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setUploadError("");

    // Check total count
    if (attachments.length + files.length > ATTACHMENT_CONFIG.MAX_FILES) {
      setUploadError(
        `Maximum ${ATTACHMENT_CONFIG.MAX_FILES} files allowed`
      );
      return;
    }

    // Validate each file
    const validFiles = [];
    for (const file of files) {
      // Check file size
      if (file.size > ATTACHMENT_CONFIG.MAX_SIZE_BYTES) {
        setUploadError(
          `${file.name} exceeds ${ATTACHMENT_CONFIG.MAX_SIZE_MB}MB limit`
        );
        continue;
      }

      // Check file type
      if (!ATTACHMENT_CONFIG.ALLOWED_TYPES.includes(file.type)) {
        setUploadError(
          `${file.name} has invalid file type. Allowed: ${ATTACHMENT_CONFIG.ALLOWED_EXTENSIONS.join(", ")}`
        );
        continue;
      }

      validFiles.push(file);
    }

    setAttachments([...attachments, ...validFiles]);
  };

  // Remove file
  const handleRemoveFile = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.contact_number) {
      newErrors.contact_number = "Contact number is required";
    } else if (!/^[0-9]{10}$/.test(formData.contact_number)) {
      newErrors.contact_number = "Must be exactly 10 digits";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (formData.category === "OTHER" && !formData.other_category_text) {
      newErrors.other_category_text = "Please specify the category";
    }

    if (!formData.subject || formData.subject.trim().length < 5) {
      newErrors.subject = "Subject must be at least 5 characters";
    }

    if (!formData.preferred_slot) {
      newErrors.preferred_slot = "Preferred time slot is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  
  // Handle submit
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validate()) return;

  setLoading(true);
  try {
    // TODO: Upload attachments first (Phase 3)
    // For now, we'll submit without attachments
    const attachment_ids = [];

    // ✅ Prepare payload with branch_id
    const payload = {
      contact_number: formData.contact_number,
      category: formData.category,
      subject: formData.subject.trim(),
      description: formData.description?.trim() || undefined,
      other_category_text: formData.other_category_text?.trim() || undefined,
      preferred_slot: formData.preferred_slot,
      attachment_ids, // Empty array for now
    };

    // ✅ Add branch_id if user has one
    if (user?.branch_id) {
      payload.branch_id = user.branch_id;
    }

    console.log("Sending ticket payload:", payload); // ✅ Debug log

    await createTicket(payload);

    onSuccess();
    onClose();
  } catch (err) {
    console.error("Failed to create ticket:", err);
    console.error("Error response:", err.response?.data); // ✅ Debug log
    setErrors({
      submit: err.response?.data?.message || "Failed to create ticket",
    });
  } finally {
    setLoading(false);
  }
};


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Create Support Ticket
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            {/* Contact Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.contact_number}
                onChange={(e) =>
                  setFormData({ ...formData, contact_number: e.target.value })
                }
                placeholder="10-digit mobile number"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 
                           ${errors.contact_number ? "border-red-500" : "border-gray-300"}`}
              />
              {errors.contact_number && (
                <p className="text-xs text-red-500 mt-1">{errors.contact_number}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 
                           ${errors.category ? "border-red-500" : "border-gray-300"}`}
              >
                <option value="">Select category</option>
                {TICKET_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-xs text-red-500 mt-1">{errors.category}</p>
              )}
            </div>

            {/* Other Category Text (conditional) */}
            {formData.category === "OTHER" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specify Category <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.other_category_text}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      other_category_text: e.target.value,
                    })
                  }
                  placeholder="What type of issue is this?"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 
                             ${errors.other_category_text ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.other_category_text && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.other_category_text}
                  </p>
                )}
              </div>
            )}

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                placeholder="Brief summary of your issue"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 
                           ${errors.subject ? "border-red-500" : "border-gray-300"}`}
              />
              {errors.subject && (
                <p className="text-xs text-red-500 mt-1">{errors.subject}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                placeholder="Provide additional details about your issue"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                           focus:ring-2 focus:ring-indigo-500/20 resize-none"
              />
            </div>

            {/* Preferred Time Slot */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Contact Time <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.preferred_slot}
                onChange={(e) =>
                  setFormData({ ...formData, preferred_slot: e.target.value })
                }
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 
                           ${errors.preferred_slot ? "border-red-500" : "border-gray-300"}`}
              >
                <option value="">Select time slot</option>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
              {errors.preferred_slot && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.preferred_slot}
                </p>
              )}
            </div>

            {/* File Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Max {ATTACHMENT_CONFIG.MAX_FILES} files, {ATTACHMENT_CONFIG.MAX_SIZE_MB}MB each.
                Allowed: {ATTACHMENT_CONFIG.ALLOWED_EXTENSIONS.join(", ")}
              </p>

              {/* Upload Button */}
              {attachments.length < ATTACHMENT_CONFIG.MAX_FILES && (
                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed 
                                 border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 
                                 transition-colors cursor-pointer">
                  <Upload size={18} className="text-gray-500" />
                  <span className="text-sm text-gray-600">Choose files</span>
                  <input
                    type="file"
                    multiple
                    accept={ATTACHMENT_CONFIG.ALLOWED_TYPES.join(",")}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              )}

              {/* Upload Error */}
              {uploadError && (
                <div className="flex items-center gap-2 mt-2 text-xs text-red-600">
                  <AlertCircle size={14} />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* File List */}
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="ml-3 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg 
                       hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2.5 bg-[#05015A] text-white rounded-lg 
                       hover:bg-[#06027a] transition-all disabled:opacity-50 
                       disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus size={18} />
                <span>Create Ticket</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTicketModal;
