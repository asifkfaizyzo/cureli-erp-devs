// frontend/src/pages/tickets/components/CreateTicketModal.jsx

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Upload, AlertCircle, CheckCircle, Loader2, FileText, Image } from "lucide-react";
import { createTicket } from "../../../api/tickets";
import { useAuthStore } from "../../../store/useAuthStore";
import { 
  TICKET_CATEGORY_OPTIONS, 
  TIME_SLOTS, 
  ATTACHMENT_CONFIG,
  isValidAttachment,
  formatFileSize,
  UPLOAD_STATUS 
} from "../../../constant/tickets";
import StyledSelect from "../../../components/common/StyledSelect";

/**
 * File item component with upload status indicator
 */
const FileItem = ({ file, status, error, onRemove, disabled }) => {
  const isImage = file.type?.startsWith("image/");
  const isPdf = file.type === "application/pdf";
  
  const getStatusIcon = () => {
    switch (status) {
      case UPLOAD_STATUS.UPLOADING:
        return <Loader2 size={16} className="animate-spin text-indigo-600" />;
      case UPLOAD_STATUS.SUCCESS:
        return <CheckCircle size={16} className="text-emerald-600" />;
      case UPLOAD_STATUS.ERROR:
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getFileIcon = () => {
    if (isImage) return <Image size={16} className="text-blue-500" />;
    if (isPdf) return <FileText size={16} className="text-red-500" />;
    return <FileText size={16} className="text-gray-500" />;
  };

  return (
    <div 
      className={`
        flex items-center justify-between p-2.5 rounded-lg border transition-all
        ${status === UPLOAD_STATUS.ERROR 
          ? "bg-red-50 border-red-200" 
          : status === UPLOAD_STATUS.SUCCESS
            ? "bg-emerald-50 border-emerald-200"
            : "bg-gray-50 border-gray-200"
        }
      `}
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {/* File type icon */}
        <div className="flex-shrink-0">
          {getFileIcon()}
        </div>
        
        {/* File info */}
        <div className="flex-1 min-w-0">
          <p 
            className={`text-sm font-medium truncate ${
              status === UPLOAD_STATUS.ERROR ? "text-red-700" : "text-gray-900"
            }`}
            title={file.name}
          >
            {file.name}
          </p>
          <p className={`text-xs ${status === UPLOAD_STATUS.ERROR ? "text-red-500" : "text-gray-500"}`}>
            {error || formatFileSize(file.size)}
          </p>
        </div>

        {/* Status icon */}
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled || status === UPLOAD_STATUS.UPLOADING}
        className="ml-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Remove file"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};

/**
 * Upload area component
 */
const UploadArea = ({ onFileSelect, disabled, remainingSlots }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileSelect({ target: { files } });
    }
  };

  if (remainingSlots <= 0) return null;

  return (
    <label 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        flex flex-col items-center justify-center gap-2 px-4 py-4
        border-2 border-dashed rounded-lg cursor-pointer
        transition-all duration-200
        ${disabled 
          ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60" 
          : isDragging
            ? "border-indigo-500 bg-indigo-50"
            : "border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50"
        }
      `}
    >
      <div className={`p-2 rounded-full ${isDragging ? "bg-indigo-100" : "bg-gray-100"}`}>
        <Upload size={20} className={isDragging ? "text-indigo-600" : "text-gray-500"} />
      </div>
      <div className="text-center">
        <span className={`text-sm font-medium ${isDragging ? "text-indigo-700" : "text-gray-700"}`}>
          {isDragging ? "Drop files here" : "Click to upload"}
        </span>
        <p className="text-xs text-gray-500 mt-0.5">
          or drag and drop ({remainingSlots} remaining)
        </p>
      </div>
      <input
        type="file"
        multiple
        accept={ATTACHMENT_CONFIG.ALLOWED_TYPES.join(",")}
        onChange={onFileSelect}
        className="hidden"
        disabled={disabled}
      />
    </label>
  );
};

/**
 * Main CreateTicketModal Component
 */
const CreateTicketModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    contact_number: "",
    category: "",
    subject: "",
    description: "",
    other_category_text: "",
    preferred_slot: "",
  });

  // Enhanced attachment state with status tracking
  const [attachments, setAttachments] = useState([]); // Array of { file, status, error }
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Convert constants to StyledSelect format
  const categoryOptions = [
    { label: "Select category", value: "" },
    ...TICKET_CATEGORY_OPTIONS.map((opt) => ({
      label: opt.label,
      value: opt.value,
    })),
  ];

  const timeSlotOptions = [
    { label: "Select time slot", value: "" },
    ...TIME_SLOTS.map((slot) => ({
      label: slot.label,
      value: slot.value,
    })),
  ];

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

  // Handle file selection with validation
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setUploadError("");

    if (files.length === 0) return;

    const currentCount = attachments.length;
    const remainingSlots = ATTACHMENT_CONFIG.MAX_FILES - currentCount;

    if (files.length > remainingSlots) {
      setUploadError(`Can only add ${remainingSlots} more file${remainingSlots !== 1 ? 's' : ''} (max ${ATTACHMENT_CONFIG.MAX_FILES})`);
      return;
    }

    const newAttachments = [];
    const validationErrors = [];

    for (const file of files) {
      const validation = isValidAttachment(file);
      
      if (validation.valid) {
        newAttachments.push({
          file,
          status: UPLOAD_STATUS.SUCCESS, // Mark as valid/ready
          error: null,
        });
      } else {
        validationErrors.push(`${file.name}: ${validation.error}`);
      }
    }

    if (validationErrors.length > 0) {
      setUploadError(validationErrors.join("; "));
    }

    if (newAttachments.length > 0) {
      setAttachments([...attachments, ...newAttachments]);
    }

    // Reset input
    if (e.target) e.target.value = "";
  };

  // Handle file removal
  const handleRemoveFile = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
    setUploadError("");
  };

  // Form validation
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

    if (formData.category === "OTHER" && !formData.other_category_text?.trim()) {
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    
    // Mark all files as uploading
    setAttachments(prev => prev.map(att => ({
      ...att,
      status: UPLOAD_STATUS.UPLOADING,
    })));

    try {
      const payload = {
        contact_number: formData.contact_number,
        category: formData.category,
        subject: formData.subject.trim(),
        preferred_slot: formData.preferred_slot,
      };

      if (formData.description?.trim()) {
        payload.description = formData.description.trim();
      }

      if (formData.category === "OTHER" && formData.other_category_text?.trim()) {
        payload.other_category_text = formData.other_category_text.trim();
      }

      if (user?.branch_id) {
        payload.branch_id = user.branch_id;
      }

      // Extract files from attachment objects
      const files = attachments.map(att => att.file);
      if (files.length > 0) {
        payload.attachments = files;
      }

      await createTicket(payload);
      
      // Mark all files as success before closing
      setAttachments(prev => prev.map(att => ({
        ...att,
        status: UPLOAD_STATUS.SUCCESS,
      })));

      onSuccess();
    } catch (err) {
      console.error("Failed to create ticket:", err);

      // Mark files as error
      setAttachments(prev => prev.map(att => ({
        ...att,
        status: UPLOAD_STATUS.ERROR,
        error: "Upload failed",
      })));

      let errorMessage = "Failed to create ticket. Please try again.";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.errors) {
        const zodErrors = err.response.data.errors;
        if (Array.isArray(zodErrors) && zodErrors.length > 0) {
          errorMessage = zodErrors.map((e) => e.message).join(", ");
        }
      }

      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const remainingSlots = ATTACHMENT_CONFIG.MAX_FILES - attachments.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      {/* HORIZONTAL LAYOUT - Two column grid */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Create Support Ticket</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form - Two Column Layout */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN */}
            <div className="space-y-4">
              {/* Contact Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.contact_number}
                  onChange={(e) => setFormData({ ...formData, contact_number: e.target.value.replace(/\D/g, "") })}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  disabled={loading}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    errors.contact_number ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.contact_number && <p className="text-xs text-red-500 mt-1">{errors.contact_number}</p>}
              </div>

              {/* Category - Using StyledSelect */}
              <div>
                <StyledSelect
                  label={
                    <>
                      Category <span className="text-red-500">*</span>
                    </>
                  }
                  value={formData.category}
                  onChange={(value) => setFormData({ ...formData, category: value, other_category_text: "" })}
                  options={categoryOptions}
                  placeholder="Select category"
                  error={errors.category}
                  disabled={loading}
                />
              </div>

              {/* Other Category Text */}
              {formData.category === "OTHER" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Specify Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.other_category_text}
                    onChange={(e) => setFormData({ ...formData, other_category_text: e.target.value })}
                    placeholder="What type of issue is this?"
                    maxLength={100}
                    disabled={loading}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed ${
                      errors.other_category_text ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.other_category_text && <p className="text-xs text-red-500 mt-1">{errors.other_category_text}</p>}
                </div>
              )}

              {/* Preferred Time Slot - Using StyledSelect */}
              <div>
                <StyledSelect
                  label={
                    <>
                      Preferred Contact Time <span className="text-red-500">*</span>
                    </>
                  }
                  value={formData.preferred_slot}
                  onChange={(value) => setFormData({ ...formData, preferred_slot: value })}
                  options={timeSlotOptions}
                  placeholder="Select time slot"
                  error={errors.preferred_slot}
                  disabled={loading}
                />
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-4">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief summary of your issue"
                  maxLength={200}
                  disabled={loading}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    errors.subject ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.subject ? <p className="text-xs text-red-500">{errors.subject}</p> : <span />}
                  <p className="text-xs text-gray-400">{formData.subject.length}/200</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  maxLength={2000}
                  placeholder="Provide additional details..."
                  disabled={loading}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 text-right mt-1">{formData.description.length}/2000</p>
              </div>

              {/* File Attachments - Enhanced */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Attachments (Optional)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Images & PDFs • Max {ATTACHMENT_CONFIG.MAX_SIZE_MB}MB each • {ATTACHMENT_CONFIG.MAX_FILES} files max
                </p>

                {/* Upload Area */}
                <UploadArea
                  onFileSelect={handleFileSelect}
                  disabled={loading || remainingSlots <= 0}
                  remainingSlots={remainingSlots}
                />

                {/* Upload Error */}
                {uploadError && (
                  <div className="flex items-start gap-2 mt-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-red-600">{uploadError}</span>
                  </div>
                )}

                {/* File List */}
                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachments.map((attachment, index) => (
                      <FileItem
                        key={`${attachment.file.name}-${index}`}
                        file={attachment.file}
                        status={attachment.status}
                        error={attachment.error}
                        onRemove={() => handleRemoveFile(index)}
                        disabled={loading}
                      />
                    ))}
                  </div>
                )}

                {/* Files count indicator */}
                {attachments.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <CheckCircle size={12} className="text-emerald-600" />
                    {attachments.length} file{attachments.length !== 1 ? 's' : ''} ready
                    {remainingSlots > 0 && ` • ${remainingSlots} more allowed`}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mt-4">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-[#05015A] text-white rounded-lg hover:bg-[#06027a] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[120px] justify-center"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus size={16} />
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