// frontend/src/pages/tickets/components/ViewTicketModal.jsx

import { useState, useEffect, useRef } from "react";
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
  AlertTriangle,
  Headphones,
} from "lucide-react";
import { format } from "date-fns";
import ReopenTicketModal from "./ReopenTicketModal";
import Tooltip from "../../../components/common/Tooltip";
import { 
  TICKET_CATEGORIES, 
  CATEGORY_COLORS,
  STATUS_TOOLTIP_MESSAGES,
  REOPEN_LIMIT,
  canReopenByCount,
  REOPEN_LIMIT_MESSAGE,
  buildTimelineEvents,
} from "../../../constant/tickets";

const ViewTicketModal = ({
  isOpen,
  onClose,
  ticket,
  onCancelClick,
  onReopenClick,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [slideDirection, setSlideDirection] = useState("right");
  const [isAnimating, setIsAnimating] = useState(false);
  const tabIndicatorRef = useRef(null);
  const tabsContainerRef = useRef(null);

  // Tab configuration with order for slide direction
  const tabs = [
    { id: "details", label: "Ticket Info", icon: Info, order: 0 },
    { id: "communication", label: "Communication", icon: Headphones, order: 1 },
    {
      id: "attachments",
      label: "Files",
      icon: Paperclip,
      count: ticket?.attachments?.length || 0,
      order: 2,
    },
    { id: "timeline", label: "Timeline", icon: History, order: 3 },
  ];

  // Get tab order for determining slide direction
  const getTabOrder = (tabId) => tabs.find(t => t.id === tabId)?.order ?? 0;

  // Handle tab change with animation
  const handleTabChange = (newTabId) => {
    if (newTabId === activeTab || isAnimating) return;
    
    const currentOrder = getTabOrder(activeTab);
    const newOrder = getTabOrder(newTabId);
    
    setSlideDirection(newOrder > currentOrder ? "left" : "right");
    setIsAnimating(true);
    
    setTimeout(() => {
      setActiveTab(newTabId);
      setTimeout(() => {
        setIsAnimating(false);
      }, 50);
    }, 150);
  };

  // Update tab indicator position
  useEffect(() => {
    if (tabsContainerRef.current && tabIndicatorRef.current) {
      const activeTabElement = tabsContainerRef.current.querySelector(`[data-tab="${activeTab}"]`);
      if (activeTabElement) {
        const containerRect = tabsContainerRef.current.getBoundingClientRect();
        const tabRect = activeTabElement.getBoundingClientRect();
        
        tabIndicatorRef.current.style.left = `${tabRect.left - containerRect.left}px`;
        tabIndicatorRef.current.style.width = `${tabRect.width}px`;
      }
    }
  }, [activeTab]);

  // Reset tab when ticket changes
  useEffect(() => {
    if (ticket) {
      setActiveTab("details");
      setIsAnimating(false);
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

  // ✅ UPDATED: New URL format matching backend fileStorage service
  const getAttachmentUrl = (storageKey) => {
    const baseURL = import.meta.env.VITE_API_URL;
    // storage_key now contains just the filename (e.g., "1234567890-abcdef12.jpg")
    // Backend serves files via /api/files/:folder/:filename
    return `${baseURL}/api/files/tickets/${storageKey}`;
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

  const canCancel = ticket.status === "PENDING" || ticket.status === "IN_PROGRESS";
  const canReopenStatus = ticket.status === "RESOLVED" || ticket.status === "CLOSED";
  const canReopenCount = canReopenByCount(ticket.reopen_count || 0);

  const handleReopenConfirm = async (reason) => {
    await onReopenClick(ticket, reason);
    setShowReopenModal(false);
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.PENDING;
    const tooltipMessage = STATUS_TOOLTIP_MESSAGES[status];
    
    const badge = (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} cursor-default`}
        tabIndex={tooltipMessage ? 0 : -1}
      >
        {config.label}
      </span>
    );

    if (tooltipMessage) {
      return (
        <Tooltip content={tooltipMessage} position="bottom" contentClassName="max-w-xs whitespace-normal">
          {badge}
        </Tooltip>
      );
    }

    return badge;
  };

  // Build timeline events
  const timelineEvents = buildTimelineEvents(ticket);

  // Check if there's communication content
  const hasCommunication = ticket.admin_notes || 
    (ticket.status === "CANCELLED" && ticket.cancellation_reason) || 
    ticket.reopen_count > 0;

  // Animation classes for content
  const getAnimationClasses = () => {
    if (isAnimating) {
      return slideDirection === "left" 
        ? "opacity-0 -translate-x-8" 
        : "opacity-0 translate-x-8";
    }
    return "opacity-100 translate-x-0";
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <div
          className="relative w-full max-w-6xl h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
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

          {/* TABS */}
          <div className="relative px-6 pt-3 pb-0 bg-white border-b border-gray-200 flex-shrink-0">
            <div 
              ref={tabsContainerRef}
              className="flex gap-1 relative"
            >
              <div
                ref={tabIndicatorRef}
                className="absolute bottom-0 h-0.5 bg-[#05015A] transition-all duration-300 ease-out rounded-full"
                style={{ left: 0, width: 0 }}
              />
              
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    data-tab={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    disabled={isAnimating}
                    className={`
                      relative flex items-center gap-2 px-4 py-3 text-sm font-medium 
                      transition-all duration-200 rounded-t-lg
                      ${isActive
                        ? "text-[#05015A]"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }
                      ${isAnimating ? "pointer-events-none" : ""}
                    `}
                  >
                    <Icon size={16} className={isActive ? "text-[#05015A]" : ""} />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`
                        px-1.5 py-0.5 rounded-full text-[10px] font-semibold
                        ${isActive 
                          ? "bg-[#05015A]/10 text-[#05015A]" 
                          : "bg-gray-100 text-gray-600"
                        }
                      `}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-hidden bg-gray-50">
            <div 
              className={`
                h-full overflow-auto p-6
                transition-all duration-300 ease-out
                ${getAnimationClasses()}
              `}
            >
              {/* =============== TICKET INFO TAB =============== */}
              {activeTab === "details" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
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
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-40 overflow-auto">
                              {ticket.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4 shadow-sm">
                      <h3 className="font-semibold text-gray-900 text-sm border-b border-gray-100 pb-2">
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

                    {canReopenStatus && (
                      <div className={`rounded-xl border p-4 shadow-sm ${
                        canReopenCount 
                          ? "bg-blue-50 border-blue-200" 
                          : "bg-red-50 border-red-200"
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <RotateCcw size={14} className={canReopenCount ? "text-blue-600" : "text-red-600"} />
                          <h3 className={`font-semibold text-sm ${canReopenCount ? "text-blue-900" : "text-red-900"}`}>
                            Reopen Status
                          </h3>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className={canReopenCount ? "text-blue-700" : "text-red-700"}>Reopened:</span>
                            <span className={`font-semibold ${canReopenCount ? "text-blue-900" : "text-red-900"}`}>
                              {ticket.reopen_count || 0} / {REOPEN_LIMIT}
                            </span>
                          </div>
                          {!canReopenCount && (
                            <p className="text-xs text-red-600 mt-2">
                              Maximum reopen limit reached.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* =============== COMMUNICATION TAB =============== */}
              {activeTab === "communication" && (
                <div className="max-w-4xl mx-auto space-y-4">
                  {!hasCommunication ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <Headphones size={28} className="text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Communication Yet</h3>
                      <p className="text-gray-500 text-sm">
                        Admin notes and status updates will appear here once available.
                      </p>
                    </div>
                  ) : (
                    <>
                      {ticket.admin_notes && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                          <div className="bg-indigo-50 px-5 py-3 border-b border-indigo-100">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <MessageSquare size={16} className="text-indigo-600" />
                              </div>
                              <h3 className="font-semibold text-indigo-900">
                                Admin Notes
                              </h3>
                            </div>
                          </div>
                          <div className="p-5">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {ticket.admin_notes}
                            </p>
                          </div>
                        </div>
                      )}

                      {ticket.status === "CANCELLED" && ticket.cancellation_reason && (
                        <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
                          <div className="bg-red-50 px-5 py-3 border-b border-red-100">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                                <X size={16} className="text-red-600" />
                              </div>
                              <h3 className="font-semibold text-red-900">
                                Ticket Cancelled
                              </h3>
                            </div>
                          </div>
                          <div className="p-5">
                            <p className="text-sm text-gray-700 mb-3">
                              {ticket.cancellation_reason}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <User size={12} />
                                {ticket.cancelled_by_name || "Unknown"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {formatDate(ticket.cancelled_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {ticket.reopen_count > 0 && (
                        <div className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden">
                          <div className="bg-orange-50 px-5 py-3 border-b border-orange-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                                  <RotateCcw size={16} className="text-orange-600" />
                                </div>
                                <h3 className="font-semibold text-orange-900">
                                  Ticket Reopened
                                </h3>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                                  {ticket.reopen_count} {ticket.reopen_count === 1 ? "time" : "times"}
                                </span>
                                {ticket.reopen_count >= REOPEN_LIMIT && (
                                  <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                                    Limit Reached
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="p-5">
                            {ticket.reopen_reason && (
                              <div className="mb-3">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                  Latest Reason
                                </label>
                                <p className="text-sm text-gray-700 bg-orange-50/50 border border-orange-100 rounded-lg p-3">
                                  {ticket.reopen_reason}
                                </p>
                              </div>
                            )}
                            {ticket.reopened_at && (
                              <div className="flex items-center gap-4 text-xs text-gray-500">
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
                      )}
                    </>
                  )}
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
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <Paperclip size={28} className="text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Attachments</h3>
                      <p className="text-gray-500 text-sm">
                        No files were attached to this ticket.
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
                <div className="max-w-3xl mx-auto">
                  <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-lg bg-[#05015A]/10 flex items-center justify-center">
                        <History size={16} className="text-[#05015A]" />
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        Ticket Timeline
                      </h3>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {timelineEvents.length} event{timelineEvents.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {timelineEvents.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                          <History size={28} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Events Yet</h3>
                        <p className="text-gray-500 text-sm">Timeline events will appear here.</p>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#05015A] via-gray-200 to-gray-100" />

                        <div className="space-y-4">
                          {timelineEvents.map((event, index) => (
                            <TimelineItem
                              key={event.id}
                              color={event.color}
                              title={event.title}
                              description={event.description}
                              date={formatDate(event.timestamp)}
                              by={event.by}
                              count={event.count}
                              isFirst={index === 0}
                              isLast={index === timelineEvents.length - 1}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className="px-6 py-3 bg-white border-t border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                ID: {ticket.ticket_id?.substring(0, 8)}...
              </p>
              
              <div className="flex items-center gap-2">
                {canReopenStatus && (
                  canReopenCount ? (
                    <button
                      onClick={() => setShowReopenModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition-all"
                    >
                      <RotateCcw size={14} />
                      Reopen Ticket
                    </button>
                  ) : (
                    <Tooltip content={REOPEN_LIMIT_MESSAGE} position="top" contentClassName="max-w-xs whitespace-normal">
                      <button
                        disabled
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                      >
                        <AlertTriangle size={14} />
                        Reopen Limit Reached
                      </button>
                    </Tooltip>
                  )
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

const AttachmentCard = ({ attachment, getUrl }) => {
  const [imageError, setImageError] = useState(false);
  const isImage = attachment.mime_type?.startsWith("image/");
  const url = getUrl(attachment.storage_key);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
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

const TimelineItem = ({ color, title, description, date, by, count, isFirst, isLast }) => (
  <div className="relative flex gap-4 pl-8">
    <div
      className={`
        absolute left-2 w-4 h-4 rounded-full ${color} 
        ring-4 ring-white shadow-sm
        ${isFirst ? "ring-[#05015A]/20" : ""}
      `}
    />
    
    <div className={`
      flex-1 bg-gray-50 rounded-lg p-4 
      border border-gray-100
      hover:bg-gray-100/50 transition-colors
      ${!isLast ? 'mb-0' : ''}
    `}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
            {count && count > 1 && (
              <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-semibold rounded-full">
                ×{count}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-gray-600 mt-1">{description}</p>
          )}
          {by && (
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <User size={10} />
              {by}
            </p>
          )}
        </div>
        <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0 bg-white px-2 py-1 rounded-md border border-gray-100">
          {date}
        </span>
      </div>
    </div>
  </div>
);

export default ViewTicketModal;