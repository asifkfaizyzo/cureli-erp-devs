// src/pages/Communications/pages/Broadcast/InApp/comps/CreateBroadcastForm.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Send, Save, Calendar, Eye, AlertTriangle, Users, 
  Building2, Link2, Image, Video, X, FileText,
  Bookmark, ChevronDown
} from "lucide-react";
import AudienceFilterPanel from "./AudienceFilterPanel";
import AttachmentsPanel from "./AttachmentsPanel";
import ConfirmSendModal from "./ConfirmSendModal";
import ScheduleModal from "./ScheduleModal";
import PreviewModal from "./PreviewModal";
import TemplateModal from "./TemplateModal";
import StyledSelect from "../../../../../../components/common/StyledSelect";
import * as broadcastAPI from "../../../../../../api/cadminBroadcast";
import { useDebounce } from "../../../../../../hooks/useDebounce";

const PRIORITY_OPTIONS = [
  { value: "low", label: "🔵 Low" },
  { value: "normal", label: "🟢 Normal" },
  { value: "high", label: "🟠 High" },
  { value: "critical", label: "🔴 Critical" },
];

const EXPIRY_OPTIONS = [
  { value: "", label: "Never expires" },
  { value: "24", label: "24 hours" },
  { value: "48", label: "48 hours" },
  { value: "72", label: "3 days" },
  { value: "168", label: "7 days" },
  { value: "720", label: "30 days" },
];

function CreateBroadcastForm({ onSuccess, onDraftSaved, onScheduled, editDraft = null }) {
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    priority: "normal",
    target_filters: {},
    attachments: [],
    action_url: "",
    action_label: "",
    expires_in_hours: "",
    target_users: true,
    target_cadmins: false,
  });

  // UI state
  const [recipientPreview, setRecipientPreview] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Debounced filters for auto-preview
  const debouncedFilters = useDebounce(formData.target_filters, 500);

  // Load draft data
  useEffect(() => {
    if (editDraft) {
      setFormData({
        title: editDraft.title || "",
        message: editDraft.message || "",
        priority: editDraft.priority || "normal",
        target_filters: editDraft.target_filters || {},
        attachments: editDraft.attachments || [],
        action_url: editDraft.action_url || "",
        action_label: editDraft.action_label || "",
        expires_in_hours: "",
        target_users: editDraft.target_users ?? true,
        target_cadmins: editDraft.target_cadmins ?? false,
      });
    }
  }, [editDraft]);

  // Auto-preview recipient count when filters change
  useEffect(() => {
    const hasFilters = Object.keys(debouncedFilters).length > 0 || 
                       formData.target_users || 
                       formData.target_cadmins;
    
    if (hasFilters) {
      fetchRecipientCount();
    } else {
      setRecipientPreview(null);
    }
  }, [debouncedFilters, formData.target_users, formData.target_cadmins]);

  const fetchRecipientCount = async () => {
    setIsPreviewLoading(true);
    try {
      const filters = {
        ...formData.target_filters,
        includeUsers: formData.target_users,
        includeCAdmins: formData.target_cadmins,
      };
      const response = await broadcastAPI.previewBroadcast(filters, true);
      if (response.data.success) {
        setRecipientPreview(response.data.data);
      }
    } catch (err) {
      console.error("Preview failed:", err);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError(null);
    setSuccess(null);
  };

  const handleSelectChange = (name) => (value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFiltersChange = useCallback((filters) => {
    setFormData((prev) => ({ ...prev, target_filters: filters }));
    setError(null);
  }, []);

  const handleAttachmentsChange = useCallback((attachments) => {
    setFormData((prev) => ({ ...prev, attachments }));
  }, []);

  const validateForm = () => {
    if (!formData.title.trim() || formData.title.length < 3) {
      setError("Title must be at least 3 characters");
      return false;
    }
    if (!formData.message.trim() || formData.message.length < 10) {
      setError("Message must be at least 10 characters");
      return false;
    }
    if (formData.message.length > 500) {
      setError("Message must not exceed 500 characters");
      return false;
    }
    if (!formData.target_users && !formData.target_cadmins) {
      setError("Select at least one audience type (Users or CAdmins)");
      return false;
    }
    return true;
  };

  const handleLoadTemplate = async (template) => {
    setFormData((prev) => ({
      ...prev,
      title: template.title,
      message: template.message,
      priority: template.priority,
      attachments: template.attachments || [],
    }));
    setShowTemplateModal(false);
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setError(null);
    try {
      if (editDraft?.campaign_id) {
        await broadcastAPI.updateDraft(editDraft.campaign_id, formData);
        setSuccess("Draft updated successfully");
      } else {
        await broadcastAPI.createDraft(formData);
        setSuccess("Draft saved successfully");
      }
      setTimeout(() => onDraftSaved?.(), 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  const handleSendNow = async () => {
    if (!validateForm()) return;
    setShowConfirmModal(true);
  };

  const confirmSendNow = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      const res = await broadcastAPI.sendBroadcastNow(formData);
      if (res.data.success) {
        setSuccess(`Broadcast sent to ${res.data.data.sent_to} recipients`);
        setTimeout(() => onSuccess?.(), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send broadcast");
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = () => {
    if (!validateForm()) return;
    setShowScheduleModal(true);
  };

  const confirmSchedule = async (scheduledFor) => {
    setShowScheduleModal(false);
    setLoading(true);
    try {
      let campaignId = editDraft?.campaign_id;
      if (!campaignId) {
        const draftRes = await broadcastAPI.createDraft(formData);
        campaignId = draftRes.data.data.campaign_id;
      }
      await broadcastAPI.scheduleBroadcast(campaignId, scheduledFor);
      setSuccess(`Scheduled for ${new Date(scheduledFor).toLocaleString()}`);
      setTimeout(() => onScheduled?.(), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to schedule");
    } finally {
      setLoading(false);
    }
  };

  const charCount = formData.message.length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Alerts - Fixed top */}
      {(error || success) && (
        <div className="flex-shrink-0 px-4 pt-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <AlertTriangle size={16} />
              <span className="text-sm font-medium">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto">
                <X size={16} />
              </button>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg">
              <span className="text-sm font-medium">{success}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-12 gap-4">
          
          {/* LEFT COLUMN: Message Content (5 cols) */}
          <div className="col-span-12 lg:col-span-5 space-y-4">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <FileText size={16} className="text-[#05015A]" />
                  Message Content
                </h3>
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  <Bookmark size={12} />
                  Use Template
                </button>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., System Maintenance Alert"
                  maxLength={200}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
                />
                <span className="text-[10px] text-gray-400">{formData.title.length}/200</span>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Enter your announcement message..."
                  rows={5}
                  maxLength={500}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
                />
                <div className="flex justify-between">
                  <span className={`text-[10px] font-medium ${
                    charCount > 500 ? "text-red-600" : charCount > 450 ? "text-amber-600" : "text-gray-400"
                  }`}>
                    {charCount}/500 characters
                  </span>
                </div>
              </div>

              {/* Priority & Expiry - Side by side */}
              <div className="grid grid-cols-2 gap-3">
                <StyledSelect
                  label="Priority"
                  value={formData.priority}
                  onChange={handleSelectChange("priority")}
                  options={PRIORITY_OPTIONS}
                  disabled={loading}
                />
                <StyledSelect
                  label="Expires After"
                  value={formData.expires_in_hours}
                  onChange={handleSelectChange("expires_in_hours")}
                  options={EXPIRY_OPTIONS}
                  placeholder="Never"
                  disabled={loading}
                />
              </div>

              {/* Attachments */}
              <AttachmentsPanel
                attachments={formData.attachments}
                onChange={handleAttachmentsChange}
                disabled={loading}
              />

              {/* Action Button (optional) */}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 size={14} className="text-gray-400" />
                  <span className="text-xs font-medium text-gray-600">Action Button (Optional)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    name="action_label"
                    value={formData.action_label}
                    onChange={handleInputChange}
                    placeholder="Button label"
                    maxLength={50}
                    disabled={loading}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="url"
                    name="action_url"
                    value={formData.action_url}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    disabled={loading}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Audience Selection (7 cols) */}
          <div className="col-span-12 lg:col-span-7 space-y-4">
            {/* Audience Type Selection */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Users size={16} className="text-[#05015A]" />
                  Target Audience
                </h3>
                
                {/* Live Recipient Count */}
                <div className="flex items-center gap-2">
                  {isPreviewLoading ? (
                    <span className="text-xs text-gray-400 animate-pulse">Calculating...</span>
                  ) : recipientPreview ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 rounded-lg">
                      <Eye size={14} className="text-indigo-600" />
                      <span className="text-sm font-bold text-indigo-700">
                        {recipientPreview.total}
                      </span>
                      <span className="text-xs text-indigo-600">recipients</span>
                      {recipientPreview.by_type && (
                        <span className="text-[10px] text-indigo-500 border-l border-indigo-200 pl-2 ml-1">
                          {recipientPreview.by_type.users} users, {recipientPreview.by_type.cadmins} admins
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Select filters to preview</span>
                  )}
                </div>
              </div>

              {/* Audience Type Toggles */}
              <div className="flex gap-3 mb-4">
                <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.target_users 
                    ? "border-indigo-500 bg-indigo-50" 
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}>
                  <input
                    type="checkbox"
                    name="target_users"
                    checked={formData.target_users}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">ERP Users</span>
                    <p className="text-xs text-gray-500">Shop owners, admins, staff</p>
                  </div>
                </label>

                <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.target_cadmins 
                    ? "border-indigo-500 bg-indigo-50" 
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}>
                  <input
                    type="checkbox"
                    name="target_cadmins"
                    checked={formData.target_cadmins}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Cureli Admins</span>
                    <p className="text-xs text-gray-500">Internal team members</p>
                  </div>
                </label>
              </div>

              {/* Filter Panel */}
              <AudienceFilterPanel
                filters={formData.target_filters}
                onChange={handleFiltersChange}
                disabled={loading}
                showUserFilters={formData.target_users}
                showCAdminFilters={formData.target_cadmins}
                recipientPreview={recipientPreview}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions - Fixed bottom */}
      <div className="flex-shrink-0 px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {editDraft && (
            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded">
              Editing Draft
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            disabled={loading || !recipientPreview?.total}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            <Eye size={16} />
            Preview
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
          >
            <Save size={16} />
            {editDraft ? "Update Draft" : "Save Draft"}
          </button>

          <button
            type="button"
            onClick={handleSchedule}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
          >
            <Calendar size={16} />
            Schedule
          </button>

          <button
            type="button"
            onClick={handleSendNow}
            disabled={loading || !recipientPreview?.total}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#05015A] text-white rounded-lg text-sm font-semibold hover:bg-[#0a0280] disabled:opacity-50"
          >
            <Send size={16} />
            {loading ? "Sending..." : "Send Now"}
          </button>
        </div>
      </div>

      {/* Modals */}
      {showConfirmModal && (
        <ConfirmSendModal
          title={formData.title}
          message={formData.message}
          recipientCount={recipientPreview?.total || 0}
          recipientBreakdown={recipientPreview?.by_type}
          onConfirm={confirmSendNow}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}

      {showScheduleModal && (
        <ScheduleModal
          onConfirm={confirmSchedule}
          onCancel={() => setShowScheduleModal(false)}
        />
      )}

      {showPreviewModal && recipientPreview && (
        <PreviewModal
          data={recipientPreview}
          formData={formData}
          onClose={() => setShowPreviewModal(false)}
        />
      )}

      {showTemplateModal && (
        <TemplateModal
          onSelect={handleLoadTemplate}
          onClose={() => setShowTemplateModal(false)}
        />
      )}
    </div>
  );
}

export default CreateBroadcastForm;