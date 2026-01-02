// frontend/src/pages/tickets/components/ViewTicketModal.jsx

import { useState, useEffect } from "react";
import {
  X,
  CircleOff,
  Download,
  Phone,
  User,
  Building2,
  Clock,
  Paperclip,
  MessageSquare,
  RotateCcw,
  Calendar,
  FileText,
  ExternalLink,
  Info,
  History,
  ImageOff,
} from "lucide-react";
import { format } from "date-fns";
import ReopenTicketModal from "./ReopenTicketModal";
import { TICKET_CATEGORIES, CATEGORY_COLORS } from "../../../constant/tickets";

const ViewTicketModal = ({
  isOpen,
  onClose,
  ticket,
  onCancelClick,
  onReopenClick,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [showReopenModal, setShowReopenModal] = useState(false);

  // Reset tab when ticket changes
  useEffect(() => {
    if (ticket) {
      setActiveTab("details");
    }
  }, [ticket?.ticket_id]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && !showReopenModal) {
        onClose();
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
  }, [isOpen, showReopenModal, onClose]);

  if (!isOpen || !ticket) return null;

  const getAttachmentUrl = (storageKey) => {
    const baseURL = import.meta.env.VITE_API_URL;
    return `${baseURL}/uploads/${storageKey}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy • HH:mm");
    } catch {
      return "N/A";
    }
  };

  const statusConfig = {
    PENDING: {
      bg: "bg-yellow-500/20",
      text: "text-yellow-300",
      label: "Pending",
    },
    IN_PROGRESS: {
      bg: "bg-blue-500/20",
      text: "text-blue-300",
      label: "In Progress",
    },
    RESOLVED: {
      bg: "bg-emerald-500/20",
      text: "text-emerald-300",
      label: "Resolved",
    },
    CLOSED: { bg: "bg-gray-500/20", text: "text-gray-300", label: "Closed" },
    CANCELLED: {
      bg: "bg-red-500/20",
      text: "text-red-300",
      label: "Cancelled",
    },
  };

  const canCancel =
    ticket.status === "PENDING" || ticket.status === "IN_PROGRESS";
  const canReopen = ticket.status === "RESOLVED" || ticket.status === "CLOSED";

  const tabs = [
    { id: "details", label: "Details", icon: Info },
    {
      id: "attachments",
      label: "Files",
      icon: Paperclip,
      count: ticket.attachments?.length || 0,
    },
    { id: "timeline", label: "Timeline", icon: History },
  ];

  const handleReopenConfirm = async (reason) => {
    await onReopenClick(ticket, reason);
    setShowReopenModal(false);
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* ✅ HORIZONTAL LAYOUT - Max width increased, fixed height */}
        <div
          className="relative w-full max-w-6xl h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER - Compact */}
          <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <FileText className="text-white" size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-white text-lg font-semibold">
                      {ticket.ticket_number}
                    </h2>
                    {getStatusBadge(ticket.status)}
                  </div>
                  <div className="flex items-center gap-2 text-white/70 text-xs">
                    <Calendar size={12} />
                    <span>{formatDate(ticket.created_at)}</span>
                    <span className="text-white/40">•</span>
                    <span>
                      {TICKET_CATEGORIES[ticket.category] || ticket.category}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
              
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-red-500/30 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* TABS - Compact */}
          <div className="flex gap-1 px-6 py-2 bg-gray-50 border-b border-gray-200 flex-shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all
                    ${
                      isActive
                        ? "bg-white text-[#05015A] shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                    }`}
                >
                  <Icon size={14} />
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

          {/* CONTENT - Flex grow with overflow */}
          <div className="flex-1 overflow-auto p-6 bg-gray-50">
            {/* =============== DETAILS TAB - HORIZONTAL LAYOUT =============== */}
            {activeTab === "details" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Left Column - Ticket Content */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Subject & Description Card */}
                  <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-[#05015A]/10 flex items-center justify-center">
                        <MessageSquare size={16} className="text-[#05015A]" />
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        Ticket Content
                      </h3>
                      <CategoryBadge
                        category={ticket.category}
                        otherText={ticket.other_category_text}
                      />
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          Subject
                        </label>
                        <p className="text-sm font-medium text-gray-900 bg-gray-50 border border-gray-200 rounded-lg p-3">
                          {ticket.subject}
                        </p>
                      </div>

                      {ticket.description && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                            Description
                          </label>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-32 overflow-auto">
                            {ticket.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Admin Notes */}
                  {ticket.admin_notes && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare size={14} className="text-indigo-600" />
                        <h3 className="font-semibold text-indigo-900 text-sm">
                          Admin Notes
                        </h3>
                      </div>
                      <p className="text-sm text-indigo-800 whitespace-pre-wrap leading-relaxed">
                        {ticket.admin_notes}
                      </p>
                    </div>
                  )}

                  {/* Status Cards - Cancellation/Reopen */}
                  {ticket.status === "CANCELLED" &&
                    ticket.cancellation_reason && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <X
                            size={18}
                            className="text-red-600 flex-shrink-0 mt-0.5"
                          />
                          <div>
                            <h4 className="text-sm font-semibold text-red-900 mb-1">
                              Ticket Cancelled
                            </h4>
                            <p className="text-sm text-red-700 mb-1">
                              {ticket.cancellation_reason}
                            </p>
                            <p className="text-xs text-red-600">
                              By {ticket.cancelled_by_name || "Unknown"} •{" "}
                              {formatDate(ticket.cancelled_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  {ticket.reopen_count > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <RotateCcw
                          size={18}
                          className="text-orange-600 flex-shrink-0 mt-0.5"
                        />
                        <div>
                          <h4 className="text-sm font-semibold text-orange-900 mb-1">
                            Reopened ({ticket.reopen_count}{" "}
                            {ticket.reopen_count === 1 ? "time" : "times"})
                          </h4>
                          {ticket.reopen_reason && (
                            <p className="text-sm text-orange-800 mb-1">
                              {ticket.reopen_reason}
                            </p>
                          )}
                          {ticket.reopened_at && (
                            <p className="text-xs text-orange-600">
                              By {ticket.reopened_by_name || "Unknown"} •{" "}
                              {formatDate(ticket.reopened_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Info Cards */}
                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
                    <h3 className="font-semibold text-gray-900 text-sm border-b pb-2">
                      Ticket Information
                    </h3>

                    <InfoRow
                      icon={<Phone size={16} />}
                      label="Contact"
                      value={ticket.contact_number || "N/A"}
                    />
                    <InfoRow
                      icon={<Clock size={16} />}
                      label="Preferred Time"
                      value={ticket.preferred_slot || "N/A"}
                    />
                    <InfoRow
                      icon={<Building2 size={16} />}
                      label="Branch"
                      value={ticket.branch_name || "Main Branch"}
                    />
                    <InfoRow
                      icon={<User size={16} />}
                      label="Created By"
                      value={ticket.created_by_name || "Unknown"}
                    />
                    <InfoRow
                      icon={<Calendar size={16} />}
                      label="Created At"
                      value={formatDate(ticket.created_at)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* =============== ATTACHMENTS TAB =============== */}
            {activeTab === "attachments" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Paperclip size={16} className="text-[#05015A]" />
                  <span>{ticket.attachments?.length || 0} Attachment(s)</span>
                </div>

                {!ticket.attachments || ticket.attachments.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Paperclip
                      size={40}
                      className="mx-auto text-gray-300 mb-3"
                    />
                    <p className="text-gray-500">
                      No attachments for this ticket
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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

            {/* =============== TIMELINE TAB =============== */}
            {activeTab === "timeline" && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <History size={18} className="text-[#05015A]" />
                  <h3 className="font-semibold text-gray-900">
                    Ticket Timeline
                  </h3>
                </div>

                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />

                  <div className="space-y-4">
                    <TimelineItem
                      color="bg-blue-500"
                      title="Ticket Created"
                      description={`Created by ${
                        ticket.created_by_name || "Unknown"
                      }`}
                      date={formatDate(ticket.created_at)}
                    />

                    {ticket.status === "IN_PROGRESS" && (
                      <TimelineItem
                        color="bg-purple-500"
                        title="In Progress"
                        description="Ticket is being reviewed"
                        date={formatDate(ticket.updated_at)}
                      />
                    )}

                    {ticket.reopened_at && (
                      <TimelineItem
                        color="bg-orange-500"
                        title="Ticket Reopened"
                        description={
                          ticket.reopen_reason || "Ticket was reopened"
                        }
                        date={formatDate(ticket.reopened_at)}
                        by={ticket.reopened_by_name}
                      />
                    )}

                    {ticket.status === "RESOLVED" && (
                      <TimelineItem
                        color="bg-emerald-500"
                        title="Ticket Resolved"
                        description="Issue has been resolved"
                        date={formatDate(ticket.updated_at)}
                      />
                    )}

                    {ticket.status === "CLOSED" && (
                      <TimelineItem
                        color="bg-gray-500"
                        title="Ticket Closed"
                        description="Ticket has been closed"
                        date={formatDate(ticket.updated_at)}
                      />
                    )}

                    {ticket.cancelled_at && (
                      <TimelineItem
                        color="bg-red-500"
                        title="Ticket Cancelled"
                        description={
                          ticket.cancellation_reason || "Ticket was cancelled"
                        }
                        date={formatDate(ticket.cancelled_at)}
                        by={ticket.cancelled_by_name}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER - Compact */}
          <div className="px-6 py-3 bg-white border-t border-gray-100 flex-shrink-0">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                ID: {ticket.ticket_id?.substring(0, 8)}...
              </p>
              {canReopen && (
                  <button
                    onClick={() => setShowReopenModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition-all"
                  >
                    <RotateCcw size={14} />
                    Reopen Ticket
                  </button>
                )}
                {canCancel && (
                  <button
                    onClick={() => {
                      onClose();
                      onCancelClick(ticket);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/80 text-white hover:bg-red-600 transition-all"
                  >
                    <CircleOff size={14} />
                    Cancel Ticket
                  </button>
                )}
            </div>
          </div>
        </div>
      </div>

      <ReopenTicketModal
        isOpen={showReopenModal}
        onClose={() => setShowReopenModal(false)}
        ticket={ticket}
        onConfirm={handleReopenConfirm}
      />
    </>
  );
};

// ============================================
// HELPER COMPONENTS
// ============================================

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-3">
    <div className="text-gray-400">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
    </div>
  </div>
);

const CategoryBadge = ({ category, otherText }) => {
  const colors = CATEGORY_COLORS?.[category] || {
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
  };
  const label =
    category === "OTHER" && otherText
      ? otherText
      : TICKET_CATEGORIES[category] || category;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}
    >
      {label}
    </span>
  );
};

// ✅ FIXED: XSS vulnerability - Using React state instead of innerHTML
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
          <div className="h-32 bg-gray-50 flex flex-col items-center justify-center gap-2">
            {imageError ? (
              <>
                <ImageOff size={24} className="text-gray-300" />
                <span className="text-xs text-gray-400">Failed to load</span>
              </>
            ) : (
              <Download size={24} className="text-gray-300" />
            )}
          </div>
        )}
      </a>

      <div className="p-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-medium text-gray-900 truncate"
              title={attachment.original_name}
            >
              {attachment.original_name}
            </p>
            <p className="text-[10px] text-gray-500">
              {(attachment.file_size / 1024).toFixed(1)} KB
            </p>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded bg-[#05015A]/10 text-[#05015A] hover:bg-[#05015A]/20 transition-colors"
          >
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
};

const TimelineItem = ({ color, title, description, date, by }) => (
  <div className="relative flex gap-4 pl-6">
    <div
      className={`absolute left-1.5 w-3 h-3 rounded-full ${color} ring-4 ring-white`}
    />
    <div className="flex-1 bg-gray-50 rounded-lg p-3 -mt-1">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
          <p className="text-xs text-gray-600 mt-0.5">{description}</p>
          {by && <p className="text-xs text-gray-500 mt-0.5">By {by}</p>}
        </div>
        <span className="text-[10px] text-gray-400 whitespace-nowrap">
          {date}
        </span>
      </div>
    </div>
  </div>
);

export default ViewTicketModal;
