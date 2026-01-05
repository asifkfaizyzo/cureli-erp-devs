// cureli-admin/src/pages/Tickets/components/TicketDetailsModal.jsx

import { useState, useEffect, useCallback } from "react";
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
  Info,
  RotateCcw,
  History,
  ArrowRight,
  XCircle,
} from "lucide-react";
import {
  updateTicketStatus,
  getTicketHistory,
} from "../../../../../api/cadminTickets";
import { format } from "date-fns";
import {
  getStatusConfig,
  getCategoryConfig,
  getPriorityConfig,
  UPDATABLE_STATUSES,
  STATUS_CONFIG,
} from "../../../../../config/ticketConfigs";
import toast from "react-hot-toast";

// ============================================
// STATUS NOTE MODAL (Popup when updating status)
// ============================================
const StatusNoteModal = ({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  newStatus,
  loading,
}) => {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNote("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentConfig = getStatusConfig(currentStatus);
  const newConfig = getStatusConfig(newStatus);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-5 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Confirm Status Change</h3>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all
                         disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Status Change Visual */}
          <div className="flex items-center justify-center gap-3 py-3 bg-gray-50 rounded-lg">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold 
                          ${currentConfig.bg} ${currentConfig.text} border ${currentConfig.border}`}
            >
              <span className={`w-2 h-2 rounded-full ${currentConfig.dot}`} />
              {currentConfig.label}
            </span>
            <ArrowRight size={20} className="text-gray-400" />
            <span
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold 
                          ${newConfig.bg} ${newConfig.text} border ${newConfig.border}`}
            >
              <span className={`w-2 h-2 rounded-full ${newConfig.dot}`} />
              {newConfig.label}
            </span>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add a note{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Add context about this status change..."
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm
                         text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 
                         focus:ring-[#05015A]/20 focus:border-[#05015A] transition-all resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {note.length}/500
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium
                         hover:bg-gray-200 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(note)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#05015A] 
                         text-white rounded-lg text-sm font-semibold hover:bg-[#0a0280] 
                         transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Confirm
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// TIMELINE ITEM COMPONENT
// ============================================
const TimelineItem = ({ item, isFirst, isLast }) => {
  const toConfig = getStatusConfig(item.to_status);
  const fromConfig = item.from_status
    ? getStatusConfig(item.from_status)
    : null;

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy • hh:mm a");
    } catch {
      return "N/A";
    }
  };

  const isCreation = !item.from_status;
  const isCAdminAction = item.changed_by_type === "CADMIN";

  return (
    <div className="relative flex gap-4">
      {/* Timeline Line */}
      <div className="flex flex-col items-center">
        <div
          className={`w-3 h-3 rounded-full border-2 z-10
                      ${
                        isFirst
                          ? `${toConfig.dot} border-white shadow-md`
                          : "bg-white border-gray-300"
                      }`}
        />
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 -mt-0.5" />}
      </div>

      {/* Content */}
      <div className={`flex-1 pb-6 ${isLast ? "pb-0" : ""}`}>
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar size={12} />
              <span>{formatDateTime(item.created_at)}</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase
                          ${
                            isCAdminAction
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
            >
              {isCAdminAction ? "Admin" : "User"}
            </span>
          </div>

          {/* Status Change */}
          <div className="flex items-center gap-2 mb-2">
            {isCreation ? (
              <span className="text-sm font-medium text-gray-900">
                Ticket Created
              </span>
            ) : (
              <>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                              ${fromConfig.bg} ${fromConfig.text} border ${fromConfig.border}`}
                >
                  {fromConfig.label}
                </span>
                <ArrowRight size={14} className="text-gray-400" />
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                              ${toConfig.bg} ${toConfig.text} border ${toConfig.border}`}
                >
                  {toConfig.label}
                </span>
              </>
            )}
          </div>

          {/* Changed By */}
          <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2">
            <User size={12} />
            <span className="font-medium">{item.changed_by_name}</span>
          </div>

          {/* Note */}
          {item.note && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-medium mb-1">Note:</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {item.note}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// INFO ROW COMPONENT
// ============================================
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

// ============================================
// ATTACHMENT CARD COMPONENT
// ============================================
const AttachmentCard = ({ attachment, getUrl }) => {
  const [imageError, setImageError] = useState(false);
  const isImage = attachment.mime_type?.startsWith("image/");
  const url = getUrl(attachment.storage_key);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        {isImage && !imageError ? (
          <div className="h-32 bg-gray-100 overflow-hidden">
            <img
              src={url}
              alt={attachment.original_name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="h-32 bg-gray-50 flex items-center justify-center">
            <Paperclip size={40} className="text-gray-300" />
          </div>
        )}
      </a>

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

// ============================================
// MAIN MODAL COMPONENT
// ============================================
const TicketDetailsModal = ({
  isOpen,
  onClose,
  ticket,
  loading,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [error, setError] = useState("");

  // History state
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Status note modal
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Reset state when ticket changes
  useEffect(() => {
    if (ticket) {
      setSelectedStatus("");
      setError("");
      setActiveTab("details");
      setHistory([]);
      setHistoryLoaded(false);
    }
  }, [ticket?.ticket_id]);

  // Fetch history when History tab is opened
  useEffect(() => {
    if (activeTab === "history" && ticket?.ticket_id && !historyLoaded) {
      fetchHistory();
    }
  }, [activeTab, ticket?.ticket_id, historyLoaded]);

  const fetchHistory = async () => {
    if (!ticket?.ticket_id) return;

    setLoadingHistory(true);
    try {
      const response = await getTicketHistory(ticket.ticket_id);
      setHistory(response.data.data.history || []);
      setHistoryLoaded(true);
    } catch (err) {
      console.error("Failed to fetch history:", err);
      toast.error("Failed to load ticket history");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && !showNoteModal) {
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
  }, [isOpen, showNoteModal]);

  // Early return if not open
  if (!isOpen) return null;

  // Show loading state while fetching ticket details
  if (loading || !ticket) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div
          className="relative bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <Loader2 size={40} className="animate-spin text-[#05015A]" />
          <p className="text-gray-600">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  const getAttachmentUrl = (storageKey) => {
    return `${import.meta.env.VITE_API_URL}/uploads/${storageKey}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy • HH:mm");
    } catch {
      return "N/A";
    }
  };

  const handleStatusSelect = (status) => {
    setSelectedStatus(status);
    setError("");
  };

  const handleUpdateClick = () => {
    if (!selectedStatus) {
      setError("Please select a status");
      return;
    }
    if (selectedStatus === ticket.status) {
      setError("Status is already " + getStatusConfig(selectedStatus).label);
      return;
    }
    setShowNoteModal(true);
  };

  const handleConfirmUpdate = async (note) => {
    setUpdating(true);
    setError("");

    try {
      await updateTicketStatus(ticket.ticket_id, {
        status: selectedStatus,
        note: note || undefined,
      });
      toast.success("Ticket updated successfully");
      setShowNoteModal(false);
      onRefresh();
      onClose();
    } catch (err) {
      console.error("Failed to update ticket:", err);
      const errorMsg = err.response?.data?.message || "Failed to update ticket";
      setError(errorMsg);
      toast.error(errorMsg);
      setShowNoteModal(false);
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = () => {
    if (!updating) {
      onClose();
    }
  };

  const currentStatusConfig = getStatusConfig(ticket.status);
  const priorityConfig = getPriorityConfig(ticket.priority);
  const categoryConfig = getCategoryConfig(ticket.category);

  // Tabs configuration
  const tabs = [
    { id: "details", label: "Details", icon: Info },
    { id: "history", label: "History", icon: History },
    {
      id: "attachments",
      label: "Attachments",
      icon: Paperclip,
      count: ticket.attachments?.length || 0,
    },
    { id: "update", label: "Update", icon: Save },
  ];

  // Check if ticket can be updated
  const canUpdate = ticket.status !== "CANCELLED";

  return (
    <>
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
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <FileText className="text-white" size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-white text-lg font-semibold">
                      {ticket.ticket_number}
                    </h2>
                    {/* Status Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium 
                                  ${currentStatusConfig.darkBg} ${currentStatusConfig.darkText}`}
                    >
                      {currentStatusConfig.label}
                    </span>
                    {/* Priority Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium 
                                  ${priorityConfig.bg} ${
                        priorityConfig.text
                      } border ${priorityConfig.border}
                                  ${
                                    priorityConfig.pulse ? "animate-pulse" : ""
                                  }`}
                    >
                      {priorityConfig.label} Priority
                    </span>
                    {/* Reopen Count Badge */}
                    {ticket.reopen_count > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300 flex items-center gap-1">
                        <RotateCcw size={12} />
                        Reopened {ticket.reopen_count}x
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-white/70 text-sm mt-1">
                    <Calendar size={14} />
                    <span>{formatDate(ticket.created_at)}</span>
                    <span className="text-white/40">•</span>
                    <span>{categoryConfig.fullLabel}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleClose}
                disabled={updating}
                className="p-2 rounded-lg bg-white/20 text-white hover:bg-red-500/30 transition-all
                           disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* TABS */}
          <div className="flex gap-1 px-6 bg-white border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              // Hide Update tab for cancelled tickets
              if (tab.id === "update" && !canUpdate) return null;

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
            {/* ============================================ */}
            {/* DETAILS TAB */}
            {/* ============================================ */}
            {activeTab === "details" && (
              <div className="space-y-6">
                {/* Reopen Alert */}
                {ticket.reopen_count > 0 && (
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <RotateCcw size={20} className="text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-orange-900">
                            Ticket Reopened {ticket.reopen_count}{" "}
                            {ticket.reopen_count === 1 ? "Time" : "Times"}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium 
                                        ${priorityConfig.bg} ${priorityConfig.text}`}
                          >
                            {priorityConfig.label} Priority
                          </span>
                        </div>
                        {ticket.reopen_reason && (
                          <div className="bg-white/50 rounded-lg p-3 mb-3">
                            <p className="text-xs font-semibold text-orange-700 uppercase tracking-wider mb-1">
                              Latest Reopen Reason
                            </p>
                            <p className="text-sm text-orange-900 whitespace-pre-wrap">
                              {ticket.reopen_reason}
                            </p>
                          </div>
                        )}
                        {ticket.reopened_at && (
                          <div className="flex items-center gap-4 text-xs text-orange-700">
                            <span className="flex items-center gap-1">
                              <User size={12} />
                              {ticket.reopened_by_name || "Unknown"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {formatDate(ticket.reopened_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Cancellation Alert */}
                {ticket.status === "CANCELLED" &&
                  ticket.cancellation_reason && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                          <XCircle size={20} className="text-red-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-red-900 mb-2">
                            Ticket Cancelled
                          </h3>
                          <div className="bg-white/50 rounded-lg p-3 mb-3">
                            <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">
                              Cancellation Reason
                            </p>
                            <p className="text-sm text-red-900 whitespace-pre-wrap">
                              {ticket.cancellation_reason}
                            </p>
                          </div>
                          {ticket.cancelled_at && (
                            <div className="flex items-center gap-4 text-xs text-red-700">
                              <span className="flex items-center gap-1">
                                <User size={12} />
                                {ticket.cancelled_by_name || "Unknown"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {formatDate(ticket.cancelled_at)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Info Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Shop Info Card */}
                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-[#05015A]/10 flex items-center justify-center">
                        <Building2 size={20} className="text-[#05015A]" />
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        Shop Information
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <InfoRow
                        label="Shop Name"
                        value={ticket.shop_name || "-"}
                      />
                      <InfoRow
                        label="Branch"
                        value={ticket.branch_name || "Main"}
                      />
                    </div>
                  </div>

                  {/* Contact Info Card */}
                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-[#05015A]/10 flex items-center justify-center">
                        <User size={20} className="text-[#05015A]" />
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        Contact Details
                      </h3>
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
                      <h3 className="font-semibold text-gray-900">
                        Ticket Info
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <InfoRow
                        label="Category"
                        value={categoryConfig.fullLabel}
                      />
                      <InfoRow label="Priority" value={priorityConfig.label} />
                      <InfoRow
                        label="Created"
                        value={formatDate(ticket.created_at)}
                      />
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
                    <h3 className="font-semibold text-gray-900">
                      Ticket Content
                    </h3>
                  </div>

                  <div className="space-y-4">
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
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <FileText size={16} className="text-indigo-600" />
                      </div>
                      <h3 className="font-semibold text-indigo-900">
                        Admin Notes
                      </h3>
                    </div>
                    <pre className="text-sm text-indigo-800 whitespace-pre-wrap font-sans leading-relaxed">
                      {ticket.admin_notes}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* ============================================ */}
            {/* HISTORY TAB */}
            {/* ============================================ */}
            {activeTab === "history" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-2">
                    <History size={18} className="text-[#05015A]" />
                    <span className="text-sm font-medium text-gray-700">
                      Status History Timeline
                    </span>
                  </div>
                  <button
                    onClick={fetchHistory}
                    disabled={loadingHistory}
                    className="text-xs text-[#05015A] hover:underline disabled:opacity-50"
                  >
                    {loadingHistory ? "Refreshing..." : "Refresh"}
                  </button>
                </div>

                {loadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2
                      size={32}
                      className="animate-spin text-[#05015A] mb-3"
                    />
                    <p className="text-sm text-gray-500">Loading history...</p>
                  </div>
                ) : history.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <History size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No status history available</p>
                    <p className="text-xs text-gray-400 mt-1">
                      History will appear when status changes are made
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="space-y-0">
                      {history.map((item, index) => (
                        <TimelineItem
                          key={item.id}
                          item={item}
                          isFirst={index === 0}
                          isLast={index === history.length - 1}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================ */}
            {/* ATTACHMENTS TAB */}
            {/* ============================================ */}
            {activeTab === "attachments" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-2">
                    <Paperclip size={18} className="text-[#05015A]" />
                    <span className="text-sm font-medium text-gray-700">
                      {ticket.attachments?.length || 0} Attachment(s)
                    </span>
                  </div>
                </div>

                {!ticket.attachments || ticket.attachments.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Paperclip
                      size={48}
                      className="mx-auto text-gray-300 mb-3"
                    />
                    <p className="text-gray-500">
                      No attachments for this ticket
                    </p>
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

            {/* ============================================ */}
            {/* UPDATE TAB */}
            {/* ============================================ */}
            {activeTab === "update" && canUpdate && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-[#05015A]/10 flex items-center justify-center">
                      <Save size={20} className="text-[#05015A]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Update Ticket Status
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Select a new status to update this ticket
                      </p>
                    </div>
                  </div>

                  {/* Current Status Display */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 font-medium mb-2">
                      Current Status
                    </p>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold
                                  ${currentStatusConfig.bg} ${currentStatusConfig.text} border ${currentStatusConfig.border}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${currentStatusConfig.dot}`}
                      />
                      {currentStatusConfig.label}
                    </span>
                  </div>

                  {/* Status Selection */}
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500 font-medium">
                      Select New Status
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {UPDATABLE_STATUSES.map((status) => {
                        const config = getStatusConfig(status);
                        const isSelected = selectedStatus === status;
                        const isCurrent = ticket.status === status;

                        return (
                          <button
                            key={status}
                            onClick={() => handleStatusSelect(status)}
                            disabled={isCurrent}
                            className={`
                              relative flex items-center gap-2 p-4 rounded-xl border-2 transition-all
                              ${
                                isSelected
                                  ? `${config.bg} ${
                                      config.border
                                    } ring-2 ring-offset-2 ring-${config.dot.replace(
                                      "bg-",
                                      ""
                                    )}`
                                  : isCurrent
                                  ? "bg-gray-50 border-gray-200 cursor-not-allowed opacity-50"
                                  : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                              }
                            `}
                          >
                            <span
                              className={`w-3 h-3 rounded-full ${config.dot}`}
                            />
                            <span
                              className={`font-medium ${
                                isSelected ? config.text : "text-gray-700"
                              }`}
                            >
                              {config.label}
                            </span>
                            {isCurrent && (
                              <span className="absolute top-2 right-2 text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                                Current
                              </span>
                            )}
                            {isSelected && !isCurrent && (
                              <CheckCircle
                                size={16}
                                className={`absolute top-2 right-2 ${config.text}`}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertTriangle
                        size={20}
                        className="text-red-500 flex-shrink-0 mt-0.5"
                      />
                      <p className="text-sm text-red-700 font-medium">
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-6 mt-6 border-t border-gray-100">
                    <button
                      onClick={handleUpdateClick}
                      disabled={
                        !selectedStatus || selectedStatus === ticket.status
                      }
                      className={`
                        flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all
                        ${
                          selectedStatus && selectedStatus !== ticket.status
                            ? "bg-[#05015A] text-white hover:bg-[#0a0280]"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }
                      `}
                    >
                      <Save size={18} />
                      Update Status
                    </button>
                    <button
                      onClick={handleClose}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold 
                                 hover:bg-gray-200 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="px-6 py-4 bg-white border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <p>
                Ticket ID: {ticket.ticket_id?.slice(0, 8)}... • Created:{" "}
                {formatDate(ticket.created_at)}
              </p>
              <p>
                {ticket.shop_name} • {ticket.branch_name || "Main Branch"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Note Modal */}
      <StatusNoteModal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        onConfirm={handleConfirmUpdate}
        currentStatus={ticket.status}
        newStatus={selectedStatus}
        loading={updating}
      />
    </>
  );
};

export default TicketDetailsModal;
