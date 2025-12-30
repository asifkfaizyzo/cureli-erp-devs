// frontend/src/pages/tickets/components/ViewTicketModal.jsx

import { useState, useEffect } from "react";
import {
  X,
  Download,
  Phone,
  User,
  Building2,
  Clock,
  Paperclip,
  MessageSquare,
  RotateCcw,
  Calendar,
  Tag,
  FileText,
  ExternalLink,
  Info,
  AlertTriangle,
  History,
} from "lucide-react";
import { format } from "date-fns";
import ReopenTicketModal from "./ReopenTicketModal";
import {
  STATUS_COLORS,
  CATEGORY_COLORS,
  TICKET_STATUSES,
  TICKET_CATEGORIES,
} from "../../../constant/tickets";

const ViewTicketModal = ({
  isOpen,
  onClose,
  ticket,
  onCancelClick,
  onReopenClick,
  onRefresh,
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
  }, [isOpen, showReopenModal]);

  if (!isOpen || !ticket) return null;

  // Get attachment URL
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

  // Status config for header badge
  const statusConfig = {
    PENDING: { bg: "bg-yellow-500/20", text: "text-yellow-300", label: "Pending" },
    IN_PROGRESS: { bg: "bg-blue-500/20", text: "text-blue-300", label: "In Progress" },
    RESOLVED: { bg: "bg-emerald-500/20", text: "text-emerald-300", label: "Resolved" },
    CLOSED: { bg: "bg-gray-500/20", text: "text-gray-300", label: "Closed" },
    CANCELLED: { bg: "bg-red-500/20", text: "text-red-300", label: "Cancelled" },
  };

  const currentStatus = statusConfig[ticket.status] || statusConfig.PENDING;

  const canCancel = ticket.status === "PENDING" || ticket.status === "IN_PROGRESS";
  const canReopen = ticket.status === "RESOLVED" || ticket.status === "CLOSED";

  // Tabs configuration
  const tabs = [
    { id: "details", label: "Ticket Details", icon: Info },
    {
      id: "attachments",
      label: "Attachments",
      icon: Paperclip,
      count: ticket.attachments?.length || 0,
    },
    { id: "timeline", label: "Timeline", icon: History },
  ];

  const handleReopenClick = () => {
    setShowReopenModal(true);
  };

  const handleReopenConfirm = async (reason) => {
    await onReopenClick(ticket, reason);
    setShowReopenModal(false);
  };

  const handleClose = () => {
    onClose();
  };

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

  // Category Badge Component
  const CategoryBadge = ({ category, otherText }) => {
    const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.OTHER;
    const label =
      category === "OTHER" && otherText
        ? otherText
        : TICKET_CATEGORIES[category] || category;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium 
                    ${colors.bg} ${colors.text} border ${colors.border}`}
      >
        {label}
      </span>
    );
  };

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
                    <span>{TICKET_CATEGORIES[ticket.category] || ticket.category}</span>
                  </div>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2">
                {canReopen && (
                  <button
                    onClick={handleReopenClick}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium 
                               bg-orange-500 text-white hover:bg-orange-600 transition-all"
                  >
                    <RotateCcw size={16} />
                    Reopen
                  </button>
                )}

                {canCancel && (
                  <button
                    onClick={() => {
                      onClose();
                      onCancelClick(ticket);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium 
                               bg-red-500/80 text-white hover:bg-red-600 transition-all"
                  >
                    <X size={16} />
                    Cancel
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
                {/* Subject & Category Card */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#05015A]/10 flex items-center justify-center">
                        <MessageSquare size={20} className="text-[#05015A]" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Ticket Content</h3>
                    </div>
                    <CategoryBadge
                      category={ticket.category}
                      otherText={ticket.other_category_text}
                    />
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

                {/* Admin Notes */}
                {ticket.admin_notes && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <MessageSquare size={16} className="text-indigo-600" />
                      </div>
                      <h3 className="font-semibold text-indigo-900">Admin Notes</h3>
                    </div>
                    <p className="text-sm text-indigo-800 whitespace-pre-wrap leading-relaxed pl-11">
                      {ticket.admin_notes}
                    </p>
                  </div>
                )}

                {/* Info Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Contact Number */}
                  <InfoCard
                    icon={<Phone size={20} />}
                    iconBg="bg-blue-100"
                    iconColor="text-blue-600"
                    label="Contact Number"
                    value={ticket.contact_number || "N/A"}
                  />

                  {/* Preferred Time */}
                  <InfoCard
                    icon={<Clock size={20} />}
                    iconBg="bg-purple-100"
                    iconColor="text-purple-600"
                    label="Preferred Time"
                    value={ticket.preferred_slot || "N/A"}
                  />

                  {/* Branch */}
                  <InfoCard
                    icon={<Building2 size={20} />}
                    iconBg="bg-green-100"
                    iconColor="text-green-600"
                    label="Branch"
                    value={ticket.branch_name || "N/A"}
                  />

                  {/* Created By */}
                  <InfoCard
                    icon={<User size={20} />}
                    iconBg="bg-indigo-100"
                    iconColor="text-indigo-600"
                    label="Created By"
                    value={ticket.created_by_name || "N/A"}
                  />
                </div>

                {/* Cancellation Info */}
                {ticket.status === "CANCELLED" && ticket.cancellation_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                        <X size={20} className="text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-red-900 mb-2">
                          Ticket Cancelled
                        </h4>
                        <p className="text-sm text-red-700 mb-2">
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

                {/* Reopen Info */}
                {ticket.reopen_count > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <RotateCcw size={20} className="text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-orange-900 mb-2">
                          Ticket Reopened ({ticket.reopen_count}{" "}
                          {ticket.reopen_count === 1 ? "time" : "times"})
                        </h4>
                        {ticket.reopen_reason && (
                          <p className="text-sm text-orange-800 mb-2">
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

            {/* Timeline Tab */}
            {activeTab === "timeline" && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-[#05015A]/10 flex items-center justify-center">
                    <History size={20} className="text-[#05015A]" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Ticket Timeline</h3>
                </div>

                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

                  <div className="space-y-6">
                    {/* Created */}
                    <TimelineItem
                      color="bg-blue-500"
                      title="Ticket Created"
                      description={`Created by ${ticket.created_by_name || "Unknown"}`}
                      date={formatDate(ticket.created_at)}
                    />

                    {/* Status Changes - In Progress */}
                    {ticket.status === "IN_PROGRESS" && (
                      <TimelineItem
                        color="bg-purple-500"
                        title="In Progress"
                        description="Ticket is being reviewed"
                        date={formatDate(ticket.updated_at)}
                      />
                    )}

                    {/* Reopened */}
                    {ticket.reopened_at && (
                      <TimelineItem
                        color="bg-orange-500"
                        title="Ticket Reopened"
                        description={ticket.reopen_reason || "Ticket was reopened"}
                        date={formatDate(ticket.reopened_at)}
                        by={ticket.reopened_by_name}
                      />
                    )}

                    {/* Resolved */}
                    {ticket.status === "RESOLVED" && (
                      <TimelineItem
                        color="bg-emerald-500"
                        title="Ticket Resolved"
                        description="Issue has been resolved"
                        date={formatDate(ticket.updated_at)}
                      />
                    )}

                    {/* Closed */}
                    {ticket.status === "CLOSED" && (
                      <TimelineItem
                        color="bg-gray-500"
                        title="Ticket Closed"
                        description="Ticket has been closed"
                        date={formatDate(ticket.updated_at)}
                      />
                    )}

                    {/* Cancelled */}
                    {ticket.cancelled_at && (
                      <TimelineItem
                        color="bg-red-500"
                        title="Ticket Cancelled"
                        description={ticket.cancellation_reason || "Ticket was cancelled"}
                        date={formatDate(ticket.cancelled_at)}
                        by={ticket.cancelled_by_name}
                      />
                    )}

                    {/* Last Updated (if different from created) */}
                    {ticket.updated_at !== ticket.created_at &&
                      !["RESOLVED", "CLOSED", "CANCELLED"].includes(ticket.status) && (
                        <TimelineItem
                          color="bg-yellow-500"
                          title="Last Updated"
                          description="Ticket information was updated"
                          date={formatDate(ticket.updated_at)}
                        />
                      )}
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
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-400">
                  {ticket.branch_name || "Main Branch"}
                </p>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium 
                             hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reopen Modal */}
      <ReopenTicketModal
        isOpen={showReopenModal}
        onClose={() => setShowReopenModal(false)}
        ticket={ticket}
        onConfirm={handleReopenConfirm}
      />
    </>
  );
};

// Info Card Component
const InfoCard = ({ icon, iconBg, iconColor, label, value }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-4">
    <div className="flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center ${iconColor}`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
      </div>
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
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        {isImage ? (
          <div className="h-40 bg-gray-100 overflow-hidden">
            <img
              src={url}
              alt={attachment.original_name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentElement.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center bg-gray-100">
                    <span class="text-xs text-gray-400">Failed to load</span>
                  </div>
                `;
              }}
            />
          </div>
        ) : (
          <div className="h-40 bg-gray-50 flex items-center justify-center">
            <Download size={40} className="text-gray-300" />
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

// Timeline Item Component
const TimelineItem = ({ color, title, description, date, by }) => (
  <div className="relative flex gap-4 pl-8">
    {/* Dot */}
    <div
      className={`absolute left-2.5 w-3 h-3 rounded-full ${color} ring-4 ring-white`}
    />

    {/* Content */}
    <div className="flex-1 bg-gray-50 rounded-lg p-4 -mt-1">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600 mt-0.5">{description}</p>
          {by && <p className="text-xs text-gray-500 mt-1">By {by}</p>}
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">{date}</span>
      </div>
    </div>
  </div>
);

export default ViewTicketModal;