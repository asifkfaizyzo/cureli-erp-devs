// cureli-admin/src/pages/Communications/pages/Broadcast/InApp/comps/CreateBroadcastForm.jsx
import { useState, useEffect } from "react";
import { Send, Save, Calendar, Eye, AlertTriangle } from "lucide-react";
import AudienceFilterPanel from "./AudienceFilterPanel";
import ConfirmSendModal from "./ConfirmSendModal";
import ScheduleModal from "./ScheduleModal";
import PreviewModal from "./PreviewModal";
import * as broadcastAPI from "../../../../../../api/cadminBroadcast";

function CreateBroadcastForm({
  onSent,
  onDraftSaved,
  onScheduled,
  editDraft = null,
}) {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    priority: "normal",
    target_filters: {},
  });

  const [charCount, setCharCount] = useState(0);
  const [recipientCount, setRecipientCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  // Load draft
  useEffect(() => {
    if (editDraft) {
      setFormData({
        title: editDraft.title,
        message: editDraft.message,
        priority: editDraft.priority,
        target_filters: editDraft.target_filters,
      });
      setCharCount(editDraft.message.length);
    }
  }, [editDraft]);

  useEffect(() => {
    setCharCount(formData.message.length);
  }, [formData.message]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleFiltersChange = (filters) => {
    setFormData((prev) => ({ ...prev, target_filters: filters }));
    setRecipientCount(null);
    setError(null);
  };

  const handlePreview = async () => {
    if (Object.keys(formData.target_filters).length === 0) {
      setError("Please select at least one audience filter");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await broadcastAPI.previewBroadcast(
        formData.target_filters,
      );
      if (response.data.success) {
        setRecipientCount(response.data.data.total);
        setPreviewData(response.data.data);
        setShowPreviewModal(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to preview recipients");
    } finally {
      setLoading(false);
    }
  };

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
    if (Object.keys(formData.target_filters).length === 0) {
      setError("Please select at least one audience filter");
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setError(null);
    try {
      await broadcastAPI.createDraft(formData);
      setSuccess("Draft saved successfully");
      resetForm();
      onDraftSaved?.();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  const handleSendNow = async () => {
    if (!validateForm()) return;
    setConfirmAction("send");
    setShowConfirmModal(true);
  };

  const confirmSendNow = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      const res = await broadcastAPI.sendBroadcastNow(formData);
      if (res.data.success) {
        setSuccess(`Broadcast sent to ${res.data.data.sent_to} recipients`);
        resetForm();
        onSent?.();
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
      const draftRes = await broadcastAPI.createDraft(formData);
      const campaignId = draftRes.data.data.campaign_id;
      await broadcastAPI.scheduleBroadcast(campaignId, scheduledFor);
      setSuccess(
        `Broadcast scheduled for ${new Date(scheduledFor).toLocaleString()}`,
      );
      resetForm();
      onScheduled?.();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to schedule broadcast");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      priority: "normal",
      target_filters: {},
    });
    setCharCount(0);
    setRecipientCount(null);
  };

  return (
    <div className="w-full space-y-6">
      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <AlertTriangle size={20} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg">
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}

      {/* Broadcast Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Broadcast Details
        </h3>

        {/* Title */}
        <div className="space-y-2">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g., System Maintenance Alert"
            maxLength={200}
            disabled={loading}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
          />
          <span className="text-xs text-gray-500">
            {formData.title.length}/200 characters
          </span>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <label
            htmlFor="message"
            className="block text-sm font-medium text-gray-700"
          >
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            placeholder="Enter your announcement message..."
            rows={6}
            maxLength={500}
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
          />
          <div className="flex justify-between items-center">
            <span
              className={`text-sm font-medium ${
                charCount > 500
                  ? "text-red-600"
                  : charCount > 450
                    ? "text-amber-600"
                    : "text-gray-500"
              }`}
            >
              {charCount}/500 characters
            </span>
          </div>
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <label
            htmlFor="priority"
            className="block text-sm font-medium text-gray-700"
          >
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            disabled={loading}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <p className="text-xs text-gray-500">
            {formData.priority === "critical" &&
              "⚠️ Critical priority shows red badge"}
            {formData.priority === "high" && "High priority shows orange badge"}
            {formData.priority === "normal" && "Default priority"}
            {formData.priority === "low" && "Low priority for info messages"}
          </p>
        </div>
      </div>

      {/* Audience Filter Panel */}
      <AudienceFilterPanel
        filters={formData.target_filters}
        onChange={handleFiltersChange}
        disabled={loading}
      />

      {/* Recipient Preview */}
      {recipientCount !== null && (
        <div className="flex items-center gap-2 p-4 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-800">
          <Eye size={20} />
          <span className="text-sm font-medium">
            This broadcast will reach <strong>{recipientCount}</strong> user
            {recipientCount !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-end">
        <button
          type="button"
          onClick={handlePreview}
          disabled={
            loading || Object.keys(formData.target_filters).length === 0
          }
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-all"
        >
          <Eye size={18} />
          Preview Recipients
        </button>

        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-all"
        >
          <Save size={18} />
          Save as Draft
        </button>

        <button
          type="button"
          onClick={handleSchedule}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-all"
        >
          <Calendar size={18} />
          Schedule
        </button>

        <button
          type="button"
          onClick={handleSendNow}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#05015A] text-white rounded-lg text-sm font-semibold hover:bg-[#0a0280] disabled:opacity-50 transition-all"
        >
          <Send size={18} />
          {loading ? "Sending..." : "Send Now"}
        </button>
      </div>

      {/* Modals */}
      {showConfirmModal && (
        <ConfirmSendModal
          title={formData.title}
          message={formData.message}
          recipientCount={recipientCount}
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

      {showPreviewModal && previewData && (
        <PreviewModal
          data={previewData}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </div>
  );
}

export default CreateBroadcastForm;
