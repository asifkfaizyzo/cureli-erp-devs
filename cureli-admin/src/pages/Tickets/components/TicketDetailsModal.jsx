// cureli-admin/src/pages/Tickets/components/TicketDetailsModal.jsx

import { useState, useEffect, useMemo } from "react";
import {
  X,
  Calendar,
  User,
  Building2,
  Phone,
  AlertTriangle,
  Save,
  Paperclip,
  Clock,
  Tag,
  FileText,
  MessageSquare,
  ExternalLink,
  Loader2,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import { updateTicketStatus } from "../../../api/cadminTickets";
import { format } from "date-fns";

const TicketDetailsModal = ({ isOpen, onClose, ticket, onRefresh }) => {
  const [activeTab, setActiveTab] = useState("details");
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [error, setError] = useState("");

  // Reset state when ticket changes
  useEffect(() => {
    if (ticket) {
      setNewStatus("");
      setAdminNote("");
      setError("");
      setActiveTab("details");
    }
  }, [ticket?.ticket_id]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !ticket) return null;

  const getAttachmentUrl = (storageKey) => {
    return `${import.meta.env.VITE_API_URL}/uploads/${storageKey}`;
  };

  const statusConfig = {
    PENDING: {
      bg: "bg-yellow-500/20",
      text: "text-yellow-300",
      label: "Pending",
      dot: "bg-yellow-500",
    },
    IN_PROGRESS: {
      bg: "bg-blue-500/20",
      text: "text-blue-300",
      label: "In Progress",
      dot: "bg-blue-500",
    },
    RESOLVED: {
      bg: "bg-emerald-500/20",
      text: "text-emerald-300",
      label: "Resolved",
      dot: "bg-emerald-500",
    },
    CLOSED: {
      bg: "bg-gray-500/20",
      text: "text-gray-300",
      label: "Closed",
      dot: "bg-gray-500",
    },
  };

  const categoryLabels = {
    TECHNICAL_ISSUE: "Technical Issue",
    BILLING_ISSUE: "Billing Issue",
    FEATURE_REQUEST: "Feature Request",
    ACCOUNT_ISSUE: "Account Issue",
    OTHER: "Other",
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy • HH:mm");
    } catch {
      return "N/A";
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      setError("Please select a status");
      return;
    }

    setUpdating(true);
    setError("");

    try {
      await updateTicketStatus(ticket.ticket_id, {
        status: newStatus,
        admin_notes: adminNote || undefined,
      });
      onRefresh();
      onClose();
    } catch (err) {
      console.error("Failed to update ticket:", err);
      setError(err.response?.data?.message || "Failed to update ticket");
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const currentStatus = statusConfig[ticket.status] || statusConfig.PENDING;

  // Check if can save
  const canSave = newStatus && newStatus !== ticket.status;

  // Tabs configuration
  const tabs = [
    { id: "details", label: "Ticket Details", icon: Info },
    {
      id: "attachments",
      label: "Attachments",
      icon: Paperclip,
      count: ticket.attachments?.length || 0,
    },
    { id: "update", label: "Update Status", icon: Save },
  ];

  // Get status badge for header
  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Ticket Info */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <FileText className="text-white" size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-white text-lg font-semibold">
                    {ticket.ticket_number}
                  </h2>
                  {getStatusBadge(ticket.status)}
                </div>
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <Calendar size={14} />
                  <span>{formatDate(ticket.created_at)}</span>
                  <span className="text-white/40">•</span>
                  <span>{categoryLabels[ticket.category] || ticket.category}</span>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              {activeTab === "update" && (
                <button
                  onClick={handleUpdateStatus}
                  disabled={!canSave || updating}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${
                      canSave && !updating
                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                        : "bg-white/20 text-white/50 cursor-not-allowed"
                    }
                  `}
                >
                  {updating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              )}

              <button
                onClick={handleClose}
                className="p-2 rounded-lg bg-white/20 text-white hover:bg-red-500/30 transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-1 px-6 bg-white border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-md transition-all whitespace-nowrap
                  ${
                    isActive
                      ? "text-[#05015A] border-b-2 border-[#05015A] bg-white"
                      : "text-gray-500 hover:text-gray-700"
                  }
                `}
              >
                <Icon size={16} />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* CONTENT */}
        <div className="p-6 h-[60vh] overflow-auto bg-gray-50">
          {/* Details Tab */}
          {activeTab === "details" && (
            <div className="space-y-6">
              {/* Info Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Shop Info Card */}
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#05015A]/10 flex items-center justify-center">
                      <Building2 size={20} className="text-[#05015A]" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Shop Information</h3>
                  </div>
                  <div className="space-y-3">
                    <InfoRow label="Shop Name" value={ticket.shop_name || "-"} />
                    <InfoRow label="Branch" value={ticket.branch_name || "-"} />
                  </div>
                </div>

                {/* Contact Info Card */}
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#05015A]/10 flex items-center justify-center">
                      <User size={20} className="text-[#05015A]" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Contact Details</h3>
                  </div>
                  <div className="space-y-3">
                    <InfoRow
                      label="Created By"
                      value={ticket.created_by_name || "Unknown"}
                    />
                    <InfoRow
                      label="Role"
                      value={ticket.created_by_role?.replace("_", " ") || "-"}
                    />
                    <InfoRow
                      label="Phone"
                      value={ticket.contact_number || "-"}
                      icon={<Phone size={14} className="text-gray-400" />}
                    />
                  </div>
                </div>

                {/* Ticket Meta Card */}
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#05015A]/10 flex items-center justify-center">
                      <Tag size={20} className="text-[#05015A]" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Ticket Info</h3>
                  </div>
                  <div className="space-y-3">
                    <InfoRow
                      label="Category"
                      value={categoryLabels[ticket.category] || ticket.category}
                    />
                    <InfoRow label="Created" value={formatDate(ticket.created_at)} />
                    {ticket.preferred_slot && (
                      <InfoRow
                        label="Preferred Time"
                        value={ticket.preferred_slot}
                        icon={<Clock size={14} className="text-gray-400" />}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Subject & Description */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#05015A]/10 flex items-center justify-center">
                    <MessageSquare size={20} className="text-[#05015A]" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Ticket Content</h3>
                </div>

                <div className="space-y-4">
                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Subject
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-900">
                        {ticket.subject}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {ticket.description && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Description
                      </label>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {ticket.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Previous Admin Notes */}
              {ticket.admin_notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <FileText size={16} className="text-amber-600" />
                    </div>
                    <h3 className="font-semibold text-amber-900">Previous Admin Notes</h3>
                  </div>
                  <pre className="text-sm text-amber-800 whitespace-pre-wrap font-sans leading-relaxed">
                    {ticket.admin_notes}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Attachments Tab */}
          {activeTab === "attachments" && (
            <div className="space-y-4">
              {/* Stats Bar */}
              <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-2">
                  <Paperclip size={18} className="text-[#05015A]" />
                  <span className="text-sm font-medium text-gray-700">
                    {ticket.attachments?.length || 0} Attachment(s)
                  </span>
                </div>
              </div>

              {/* Attachments Grid */}
              {!ticket.attachments || ticket.attachments.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <Paperclip size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No attachments for this ticket</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ticket.attachments.map((attachment) => (
                    <AttachmentCard
                      key={attachment.attachment_id}
                      attachment={attachment}
                      getUrl={getAttachmentUrl}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Update Status Tab */}
          {activeTab === "update" && (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Current Status Card */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#05015A]/10 flex items-center justify-center">
                    <CheckCircle size={20} className="text-[#05015A]" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Current Status</h3>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${currentStatus.dot}`} />
                  <span className="text-sm font-semibold text-gray-900">
                    {currentStatus.label}
                  </span>
                </div>
              </div>

              {/* Update Form */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-[#05015A]/10 flex items-center justify-center">
                    <Save size={20} className="text-[#05015A]" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Update Ticket</h3>
                </div>

                <div className="space-y-5">
                  {/* New Status */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      New Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm 
                                 font-medium text-gray-900 focus:outline-none focus:ring-2 
                                 focus:ring-[#05015A]/20 focus:border-[#05015A] transition-all cursor-pointer"
                    >
                      <option value="">Select new status...</option>
                      {Object.entries(statusConfig).map(([value, config]) => (
                        <option key={value} value={value}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Admin Note */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Admin Note
                      <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                    </label>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      rows={4}
                      placeholder="Add internal notes about this ticket..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm
                                 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 
                                 focus:ring-[#05015A]/20 focus:border-[#05015A] 
                                 transition-all resize-none"
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                  )}

                  {/* Action Buttons - Mobile/Tablet View */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={handleUpdateStatus}
                      disabled={!canSave || updating}
                      className={`
                        flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all
                        ${
                          canSave && !updating
                            ? "bg-[#05015A] text-white hover:bg-[#0a0280]"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }
                      `}
                    >
                      {updating ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          Update Ticket
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleClose}
                      className="flex-1 sm:flex-none px-6 py-3 bg-gray-100 text-gray-700 rounded-lg 
                                 text-sm font-semibold hover:bg-gray-200 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-white border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Ticket ID: {ticket.ticket_id} • Created:{" "}
              {formatDate(ticket.created_at)}
            </p>
            <p className="text-xs text-gray-400">
              {ticket.shop_name} • {ticket.branch_name || "Main Branch"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Info Row Component
const InfoRow = ({ label, value, icon }) => (
  <div className="flex items-start justify-between gap-2">
    <span className="text-xs text-gray-500 font-medium">{label}</span>
    <div className="flex items-center gap-1.5 text-right">
      {icon}
      <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
        {value}
      </span>
    </div>
  </div>
);

// Attachment Card Component
const AttachmentCard = ({ attachment, getUrl }) => {
  const isImage = attachment.mime_type?.startsWith("image/");
  const url = getUrl(attachment.storage_key);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Preview */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {isImage ? (
          <div className="h-32 bg-gray-100 overflow-hidden">
            <img
              src={url}
              alt={attachment.original_name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="h-32 bg-gray-50 flex items-center justify-center">
            <Paperclip size={40} className="text-gray-300" />
          </div>
        )}
      </a>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium text-gray-900 truncate"
              title={attachment.original_name}
            >
              {attachment.original_name}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {(attachment.file_size / 1024).toFixed(1)} KB
            </p>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-[#05015A]/10 text-[#05015A] hover:bg-[#05015A]/20 transition-colors"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailsModal;